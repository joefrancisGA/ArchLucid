> **Scope:** Paste-ready Composer 2.5 prompts that classify the eight warnings on the 2026-10-22 SecureNow Azure package, plus a zero-record policy compliance result. Prompts only — do not implement from this index.
> **Paste-ready files:** [`.cursor/prompts/extractor-warning-triage-00-index.md`](../../.cursor/prompts/extractor-warning-triage-00-index.md)

# Extractor warning triage — Composer prompts

**Created:** 2026-10-22 · **Status:** ready to paste · **Audience:** Composer 2.5

Package: `C:\ArchLucid\securenow-azure-package.zip`. Subscription `0966098b-4d6c-4f09-af1b-965bc2a2ad1d`. Tenant `5c4694b8-0490-46f0-bd5a-4eb70dd3c0b8`. Inventory 893 resources. Security inventory 1776 objects. Policy compliance record count 0. Warning count 8.

Paste **one** numbered file per Composer 2.5 session. Do not implement from this index.

| ID | Prompt | Intent |
|----|--------|--------|
| **EXW-01** | [extractor-warning-triage-01-aks-runcommand.md](../../.cursor/prompts/extractor-warning-triage-01-aks-runcommand.md) | Classify `aks-workload-images-not-collected-customer-script:http-error` on `aks-maks-hi-nprd-weus-300` |
| **EXW-02** | [extractor-warning-triage-02-fabric-workspaces.md](../../.cursor/prompts/extractor-warning-triage-02-fabric-workspaces.md) | Classify `fabric-capacity-assignments-not-collected:http-error` on `hihapfabriccapcitynprd` |
| **EXW-03** | [extractor-warning-triage-03-defender-contacts.md](../../.cursor/prompts/extractor-warning-triage-03-defender-contacts.md) | Classify `defender-security-contacts-not-collected` |
| **EXW-04** | [extractor-warning-triage-04-defender-governance.md](../../.cursor/prompts/extractor-warning-triage-04-defender-governance.md) | Classify the governance 404 and truncation warnings |
| **EXW-05** | [extractor-warning-triage-05-defender-attack-paths.md](../../.cursor/prompts/extractor-warning-triage-05-defender-attack-paths.md) | Classify `defender-attack-paths.json collection failed` |
| **EXW-06** | [extractor-warning-triage-06-defender-vulnerability-counts.md](../../.cursor/prompts/extractor-warning-triage-06-defender-vulnerability-counts.md) | Classify `defender-vulnerability-counts.json collection failed` |
| **EXW-07** | [extractor-warning-triage-07-policy-compliance.md](../../.cursor/prompts/extractor-warning-triage-07-policy-compliance.md) | Explain `recordCount=0` beside 60 policy assignments |
| **EXW-08** | [extractor-warning-triage-08-governance-status.md](../../.cursor/prompts/extractor-warning-triage-08-governance-status.md) | Record the real HTTP status on governance collection failure |
| **EXW-09** | [extractor-warning-triage-09-implement-on-master.md](../../.cursor/prompts/extractor-warning-triage-09-implement-on-master.md) | Land the triage prompts and EXW-08 code on `origin/master` |

## Already shipped — do not re-run

| Warning family | Shipped prompt |
|----------------|----------------|
| AKS workload images | NR-36 |
| Fabric capacity workspaces | NR-40 |
| Defender governance | DFV-04 |
| Defender attack paths | DFV-07 |
| Defender vulnerability counts | DFV-08 |
| Defender security contacts | DFV-09 |

EXW-01 through EXW-07 are read-only probes against the signed-in Azure context. EXW-08 is the only session that edits the repo.
