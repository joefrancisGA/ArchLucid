# Offline release-train frontier-AI scoreboard (synthetic)

This file is a CI pass-pack for `archlucid pilot readiness-bundle` offline replay.
It is not live bakeoff evidence. Standalone `archlucid pilot frontier-ai-baseline`
still reads `artifacts/bakeoff/scoreboard/frontier-ai-scoreboard.md`.

**Maintainer:** CI fixture  
**Sessions logged:** 3  

---

## Session log

| Session | Date (UTC) | Packet | Exec mode | AL min | Manual min | Timing basis | Decision Δ count | Δ outcome | Repeat (1–5) | Loss mode | AL win | Anti-claims OK |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| session-a | 2026-06-01 | packet-a | Simulator | 40 | 30 | measured | 1 | PASS | 4 | none | traceability | Y |
| session-b | 2026-06-02 | packet-b | Simulator | 45 | 33 | measured | 2 | PASS | 5 | L7 | packaging | Y |
| session-c | 2026-06-03 | packet-c | Simulator | 38 | 36 | measured | 1 | WARN | 3 | none | repeatability | Y |

---
