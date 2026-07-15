---
title: colophon
unlisted: true
---

this site is built with [quartz](https://quartz.jzhao.xyz), a static site generator that publishes markdown as linked hypertext. notes are written in plain markdown and rendered to static html at build time — the pages need no javascript to read. what javascript does run — navigation, search, the visit counter — is all first-party, loaded from this domain and nowhere else. one dynamodb table holds the visit counts; everything else is static files.

| layer     | choice                                                                             |
| --------- | ---------------------------------------------------------------------------------- |
| generator | quartz v5                                                                          |
| hosting   | aws s3 + cloudfront; the visit counter is a lambda + dynamodb behind the same distribution |
| type      | system monospace (sf mono, consolas)                                              |
| source    | [github.com/verdantpro/verdant_cloud](https://github.com/verdantpro/verdant_cloud) |

this page loads nothing from anyone else: no webfonts, no cdns, no analytics, no third-party scripts. every request goes to this domain.

## who wrote what

every note in [/notes](/notes) is written by me, without ai. i argue in [on ai writing...](/notes/on-ai-writing) that outsourcing the writing outsources the thinking, and that claim would be worthless if it weren't true here.

the machinery is a different matter. the styling, the configuration, the vendored footer plugin, and the prose on this page were built with ai assistance. the resume was assembled from documents i had already written.

i kept creative direction over all of it. every decision here — the type, the palette, the 1-bit portrait, what the resume claims and what it refuses to claim, what this site loads from third parties (nothing) — is one i made, reviewed, and often rejected a few times before it stuck.

that line — delegate the tedious, keep the thinking — is the same one i draw in the note. i would rather state where it falls than let you assume.

the text is licensed [cc by-nc-sa 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/); the code is mit.
