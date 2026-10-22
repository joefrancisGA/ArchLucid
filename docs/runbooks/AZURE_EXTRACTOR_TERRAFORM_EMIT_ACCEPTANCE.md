> **Scope:** Operator — Azure extractor and advisory Terraform emit acceptance evidence (V1 §2.17).

# Azure extractor and Terraform emit acceptance

**Last reviewed:** 2026-06-07

## Acceptance checklist

- [ ] Azure inventory ZIP upload failure UX documented in proof (`azure-extractor-upload-failure-ux.md`).
- [ ] Cost evidence freshness visible in sponsor summary (`costEvidenceFreshnessStatus`).
- [ ] Advisory Terraform snippets referenced from committed-run exports when present.
- [ ] `terraform-drift-preflight.json` attached to release-readiness bundle.

## Commands

```powershell
.\scripts\Emit-ReleaseReadinessEvidence.ps1
.\scripts\ci\check_azure_extractor_terraform_emit_acceptance.py
```

## Claim boundary

Advisory Terraform emit is **guidance**, not applied infrastructure. Production changes require separate IaC review.
