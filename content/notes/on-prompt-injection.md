---
title: on prompt injection
date: 2026-07-10
description: and the absence of a trust boundary.
tags:
  - security
  - llm
  - technical
---

placeholder note — delete me. it exists to exercise the technical typography: tags, math, code, and tables.

## the problem

it also links to [[reading-queue]] so that backlinks have something to show.

the model has no way to distinguish instructions from data, because both arrive as the same token stream. attention is computed over the concatenation:

$$
A(Q, K, V) = \mathrm{softmax}\left(\frac{QK^{\top}}{\sqrt{d_k}}\right)V
$$

nothing in that operation encodes provenance. a retrieved document and a system prompt are, mechanically, the same kind of thing.

## the surfaces

```python
def build_prompt(system: str, user: str, retrieved: list[str]) -> str:
    # the trust boundary is a string concat, which is to say: there isn't one
    return "\n".join([system, *retrieved, user])
```

| surface        | attacker controls | trust boundary |
| -------------- | ----------------- | -------------- |
| system prompt  | no                | yes            |
| user turn      | partially         | weak           |
| retrieved docs | yes               | none           |
