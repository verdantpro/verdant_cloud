"""
Visitor counter Lambda — API Gateway HTTP API (payload 2.0) behind CloudFront.

Routes (same function):
  GET  /api/stats  — read totals
  HEAD /api/stats  — 200, empty body
  POST /api/visit  — count at most once per (salted IP hash, UTC day)

DynamoDB (single table, partition key `pk` String):
  site                 { total: N, lastUpdated: S }   # matches the existing row
  day#YYYY-MM-DD       { count: N, ttl: N }     # "today"; TTL ~3 days
  IP#<hash>#YYYY-MM-DD { ttl: N }               # dedup row; TTL ~2 days

Env:
  TABLE_NAME   required — e.g. site-stats
  IP_HASH_SALT required — long random secret (not the domain name)
  ALLOWED_ORIGINS optional — comma list, default verdantprotocol.com apex+www

Deploy notes (console):
  1. Enable TTL on the table attribute `ttl`.
  2. Total lives in the existing `site` row (pk="site"); no seeding needed.
  3. Set env vars; grant dynamodb:GetItem, PutItem, UpdateItem on the table.
  4. API routes: GET/HEAD /api/stats, POST /api/visit → this Lambda.
  5. Stage throttle (e.g. 10 rps / burst 20).
  6. Confirm X-Forwarded-For (or CloudFront-Viewer-Address) reaches Lambda.
"""

from __future__ import annotations

import hashlib
import json
import os
import time
from datetime import datetime, timezone
from typing import Any

import boto3
from botocore.exceptions import ClientError

TABLE_NAME = os.environ["TABLE_NAME"]
IP_HASH_SALT = os.environ["IP_HASH_SALT"]
ALLOWED_ORIGINS = {
    o.strip()
    for o in os.environ.get(
        "ALLOWED_ORIGINS",
        "https://verdantprotocol.com,https://www.verdantprotocol.com",
    ).split(",")
    if o.strip()
}

ddb = boto3.resource("dynamodb").Table(TABLE_NAME)

# Keep IP and day rows around long enough for "today" reads + clock skew.
IP_TTL_SECONDS = 60 * 60 * 48  # 48h
DAY_TTL_SECONDS = 60 * 60 * 72  # 72h


def _utc_day() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%d")


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _headers(event: dict) -> dict[str, str]:
    raw = event.get("headers") or {}
    return {str(k).lower(): str(v) for k, v in raw.items()}


def _client_ip(event: dict) -> str:
    """
    Prefer CloudFront-Viewer-Address (explicit, needs origin policy).
    Fall back to X-Forwarded-For first hop (CloudFront sets this by default).
    Last resort: API GW sourceIp (often the CloudFront edge — bad for dedup).
    """
    h = _headers(event)
    cf = h.get("cloudfront-viewer-address") or ""
    if cf:
        # "1.2.3.4:12345" or "[2001:db8::1]:12345"
        if cf.startswith("["):
            return cf[1:].split("]", 1)[0]
        return cf.rsplit(":", 1)[0]

    xff = h.get("x-forwarded-for") or ""
    if xff:
        return xff.split(",")[0].strip()

    return (
        (event.get("requestContext") or {})
        .get("http", {})
        .get("sourceIp")
        or "unknown"
    )


def _ip_pk(ip: str, day: str) -> str:
    digest = hashlib.sha256(f"{IP_HASH_SALT}{ip}".encode()).hexdigest()[:32]
    return f"IP#{digest}#{day}"


def _day_pk(day: str) -> str:
    return f"day#{day}"


def _json(status: int, body: dict | None = None, *, head: bool = False) -> dict:
    headers = {
        "content-type": "application/json",
        "cache-control": "no-store",
    }
    if head or body is None:
        return {"statusCode": status, "headers": headers, "body": ""}
    return {
        "statusCode": status,
        "headers": headers,
        "body": json.dumps(body, separators=(",", ":")),
    }


def _get_totals() -> dict[str, Any]:
    day = _utc_day()
    counter = ddb.get_item(Key={"pk": "site"}).get("Item") or {}
    day_item = ddb.get_item(Key={"pk": _day_pk(day)}).get("Item") or {}
    return {
        "totalVisitors": int(counter.get("total", 0)),
        "today": int(day_item.get("count", 0)),
        "status": "healthy",
        "lastUpdated": counter.get("lastUpdated") or _now_iso(),
    }


def _origin_ok(event: dict) -> bool:
    """Weak friction only — easy to spoof. Per-IP dedup is the real control."""
    h = _headers(event)
    origin = h.get("origin") or ""
    if origin:
        return origin in ALLOWED_ORIGINS
    referer = h.get("referer") or ""
    if referer:
        return any(referer.startswith(o + "/") or referer == o for o in ALLOWED_ORIGINS)
    # No Origin/Referer (curl, some privacy tools): allow; IP cap still applies.
    return True


def _handle_visit(event: dict) -> dict:
    if not _origin_ok(event):
        return _json(403, {"error": "forbidden"})

    day = _utc_day()
    ip = _client_ip(event)
    now = int(time.time())
    ip_pk = _ip_pk(ip, day)

    try:
        ddb.put_item(
            Item={"pk": ip_pk, "ttl": now + IP_TTL_SECONDS},
            ConditionExpression="attribute_not_exists(pk)",
        )
    except ClientError as e:
        if e.response["Error"]["Code"] == "ConditionalCheckFailedException":
            # Already counted today for this IP — return totals, no increment.
            return _json(200, _get_totals())
        raise

    # First hit today for this IP: bump lifetime total + today's day row.
    ddb.update_item(
        Key={"pk": "site"},
        UpdateExpression=(
            "SET #t = if_not_exists(#t, :z) + :one, lastUpdated = :u"
        ),
        ExpressionAttributeNames={"#t": "total"},
        ExpressionAttributeValues={
            ":z": 0,
            ":one": 1,
            ":u": _now_iso(),
        },
    )
    ddb.update_item(
        Key={"pk": _day_pk(day)},
        UpdateExpression=(
            "SET #c = if_not_exists(#c, :z) + :one, #ttl = :ttl"
        ),
        ExpressionAttributeNames={"#c": "count", "#ttl": "ttl"},
        ExpressionAttributeValues={
            ":z": 0,
            ":one": 1,
            ":ttl": now + DAY_TTL_SECONDS,
        },
    )
    return _json(200, _get_totals())


def handler(event: dict, context: Any) -> dict:
    http = (event.get("requestContext") or {}).get("http") or {}
    method = (http.get("method") or "").upper()
    path = event.get("rawPath") or http.get("path") or ""

    # Normalize trailing slash
    if path.endswith("/") and len(path) > 1:
        path = path[:-1]

    if path.endswith("/stats"):
        if method == "HEAD":
            return _json(200, head=True)
        if method == "GET":
            return _json(200, _get_totals())
        return _json(405, {"error": "method not allowed"})

    if path.endswith("/visit"):
        if method == "POST":
            return _handle_visit(event)
        return _json(405, {"error": "method not allowed"})

    return _json(404, {"error": "not found"})
