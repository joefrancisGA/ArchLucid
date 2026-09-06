# Professional-core acceptance audit (wave 15 close)

**Date:** 2026-09-06  
**Wave:** PC-01–PC-13 (kernel mitigations after CA-01–50)  
**Status:** Accepted — regression anchors in Vitest

## Prompt checklist

| Prompt | Topic | Representative merge |
| --- | --- | --- |
| PC-01 | Measurement floor / stamp honesty | #1776, `insight-density-measurement-floor` |
| PC-02 | Intake MUST → engine coverage | #1782 |
| PC-03 | BFF session LK-05→07 | #1830, `bff-session-cookie` / `proxy-bff-session-guard` |
| PC-04 | Working evicts eval chrome | #1859, `production-desk-chrome-eval-guard` |
| PC-05 | Monday architecture portfolio desk | #1776, `operator-home-primary-cta-composition` |
| PC-06 | Seal delta vs last seal | #1789 |
| PC-07 | `ArchitectureId` route honesty | #1776, `advisory-draft-architecture-id-honesty` |
| PC-08 | Background wait / in-flight | #1782, #1852 |
| PC-09 | Presenter → asserted trail | #1799, #1812 |
| PC-10 | Record correction on grid | #1875 |
| PC-11 | Findings landing + work-first keyboard | #1879 |
| PC-12 | Evidence graph naming / IA | #1816, #1885 |
| PC-13 | Career export honesty (C# + UI) | #1809, #1785, #1893 |

## CI ratchet

`archlucid-ui/src/lib/professional-core-acceptance-guard.test.ts` fails if any canonical evidence test file is deleted or stops naming its prompt marker.

## Residual follow-ups

None that block wave close. Future kernel work should open a **new** prompt set — do not extend PC-14 inside this audit.
