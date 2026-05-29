> **Scope:** Operator calibration for bundled default policy packs — not statutory certification.

# Default policy pack calibration (V1)

**Audience:** Pilot operators, governance leads, and procurement explaining bundled platform defaults.

**Last reviewed:** 2026-05-29

**Pack catalog:** [`DEFAULT_POLICY_PACKS_V1.md`](DEFAULT_POLICY_PACKS_V1.md)

---

## Severity interpretation

| Severity | Operator meaning | Typical action |
| --- | --- | --- |
| **Advisory** | Context and remediation hints | Document; no commit block |
| **Warning** | Material gap — review before commit | Fix evidence or accept explicit waiver in pilot notes |
| **Blocking (critical/high)** | May block commit when enforcement enabled | Resolve or run dry-run until clean |

Bundled packs are **curated architecture governance content**, not statutory certification of Azure WAF, ISO, HIPAA, or SOC 2 compliance.

---

## False-positive handling

1. Run **dry-run** before enabling `BlockCommitOnCritical`.
2. Tune **priority floor** (P0 only for first pilot) per [`POLICY_PACK_RULE_PRIORITY_MODEL.md`](../library/POLICY_PACK_RULE_PRIORITY_MODEL.md).
3. Scope packs at workspace/project when central security and squad packs must merge.
4. Record waived findings in pilot notes — do not silently ignore blocking rows in sponsor packets.

---

## Dry-run interpretation

```http
POST /v1/governance/policy-packs/dry-run
```

| Dry-run outcome | Next step |
| --- | --- |
| No blocking findings | Consider enforcement for pilot charter |
| Warnings only | Proceed with documented caveats |
| Critical/high blocking | Fix evidence or adjust pack scope before sponsor send |

Proof artifact: `governance-policy-pack-dry-run-proof` in first-pilot evidence bundle when collected.

---

## When to enforce BlockCommitOnCritical

Enable only when:

- Pilot charter requires hard governance stops, **and**
- Dry-run false-positive rate is acceptable on buyer evidence, **and**
- Sponsor understands blocked commits are product behavior, not infra failure.

Keep **WarnOnly** on engineer laptops (`appsettings.Development.json`).

---

## Calibration fixtures (repo tests)

| Pack theme | Test / fixture anchor |
| --- | --- |
| Azure WAF / security baseline | Bundled `waf-az-*` rules in policy pack tests under `ArchLucid.Application.Tests` |
| AI governance | `ai-gov-*` rules · walkthrough [`AI_GOVERNANCE_REVIEW.md`](../library/walkthroughs/AI_GOVERNANCE_REVIEW.md) |

Run targeted tests:

```powershell
dotnet test ArchLucid.Application.Tests --filter "FullyQualifiedName~PolicyPack"
```

---

## Related

- Pre-commit gate: [`PRE_COMMIT_GOVERNANCE_GATE.md`](../library/PRE_COMMIT_GOVERNANCE_GATE.md)
- Healthcare / regulated storyline: [`POLICY_PACK_HEALTHCARE_CLAIMS_PILOT.md`](../library/walkthroughs/POLICY_PACK_HEALTHCARE_CLAIMS_PILOT.md)
