#!/usr/bin/env bash
# fix-routing.sh -- run after `npx quartz build`
set -euo pipefail
cd public
find . -name "*.html" ! -name "index.html" ! -name "404.html" | while read -r f; do
  dir="${f%.html}"
  mkdir -p "$dir"
  mv "$f" "$dir/index.html"
done
