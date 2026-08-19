> **Reviewed:** 2026-07-25

> **Scope:** Checked-in sample output from `scripts/assemble_blind_validation_packet.py` — demo-safe illustration only.

# Blind validation sample packet (regulated scenario)

Generated from [`fixtures/blind-validation/regulated-scenario/`](../../../../fixtures/blind-validation/regulated-scenario/) with `--seed 42`.

| File | Purpose |
| --- | --- |
| `reviewer-packet.md` | Blind reviewer-facing findings (Arm A / Arm B) |
| `scoring-sheet.json` | Per-finding rating capture template |
| `blind-packet.json` | Machine-readable packet |
| `source-key.json` | Facilitator-only arm → source mapping |
| `facilitator-source-key.md` | Human-readable source key |
| `exec-summary.template.md` | Product/exec rollup template |

**Regenerate:**

```powershell
python scripts/assemble_blind_validation_packet.py assemble `
  --fixture fixtures/blind-validation/regulated-scenario `
  --output docs/go-to-market/fixtures/blind-validation-regulated-scenario-sample `
  --seed 42
```

**Guardrail:** Demo-derived fixture — not customer proof. See [`FIRST_SESSION_COGNITIVE_LOAD_OBSERVATION.md#blind-insight-validation`](../../FIRST_SESSION_COGNITIVE_LOAD_OBSERVATION.md#blind-insight-validation) (alias: [`PRINCIPAL_ARCHITECT_INSIGHT_VALIDATION_PROTOCOL.md`](../../Architect_Evaluation/PRINCIPAL_ARCHITECT_INSIGHT_VALIDATION_PROTOCOL.md#blind-insight-validation)).
