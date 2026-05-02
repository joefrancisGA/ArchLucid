> **Scope:** How procurement-facing trust artefacts stay mechanically fresh — merge-blocking vs advisory checks.

## Objective

Keep `docs/trust-center.md` honest: links resolve and posture timestamps stay within policy windows documented here.

## Checks (CI)

| Script | Behaviour |
|---|---|
| [`scripts/ci/check_trust_center_links.py`](../../scripts/ci/check_trust_center_links.py) | **Fail-fast** broken relative / `blob/main/` links referenced from the trust-center page |
| [`scripts/ci/check_trust_center_posture_freshness.py`](../../scripts/ci/check_trust_center_posture_freshness.py) | **Fail-fast** on malformed posture dates · **warnings** (`STALE_ROW`) when “Last reviewed” exceeds status-class budget (unless `--fail-on-stale`) |

Maintenance rule: whenever you update a factual row in **`## Posture summary`**, set **Last reviewed** to the UTC calendar date reviewed (ISO `YYYY-MM-DD`). CI does **not** invent refreshed dates — authors must truthfully bump the stamp.

## Optional strict mode

Promotion path for tightening warnings into merge blockers:

```bash
python scripts/ci/check_trust_center_posture_freshness.py --fail-on-stale
```

Discuss with security leadership before flipping CI to `--fail-on-stale` wholesale; default keeps procurement noise low while preserving date integrity gates.
