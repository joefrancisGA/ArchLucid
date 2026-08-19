# Model seats counter-positioning fixtures

Copy templates into `artifacts/model-seats/<cohort-label>/` before running [`docs/go-to-market/DIFFERENTIATION_PROOF_PACKET.md`](../../docs/go-to-market/DIFFERENTIATION_PROOF_PACKET.md#model-seats-counter-positioning-message-test).

**Do not commit** customer-identifying content under `artifacts/`.

## Folder layout

```
<cohort-label>/
  sessions/
    session-01.md
    session-02.md
    session-03.md
  cohort-synthesis.md
```

## Quick start

```powershell
$cohort = "cohort-2026-06"
$root = "artifacts/model-seats/$cohort"
New-Item -ItemType Directory -Force -Path "$root/sessions" | Out-Null
Copy-Item fixtures/model-seats-counter-positioning/message-test-session.template.md "$root/sessions/session-01.md"
Copy-Item fixtures/model-seats-counter-positioning/message-test-session.template.md "$root/sessions/session-02.md"
Copy-Item fixtures/model-seats-counter-positioning/message-test-session.template.md "$root/sessions/session-03.md"
Copy-Item fixtures/model-seats-counter-positioning/cohort-synthesis.template.md "$root/cohort-synthesis.md"
```

## Templates

| File | Purpose |
| --- | --- |
| `script-variants.template.md` | Quick-reference copy of Scripts A/B/C for facilitator |
| `message-test-session.template.md` | Per-conversation log and scoring |
| `cohort-synthesis.template.md` | Rollup after 3 sessions |
