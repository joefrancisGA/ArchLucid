> **Scope:** Contributor-reference — Hosted production Terraform root scaffold and apply order pointer.

# Hosted production Terraform root (repo scaffold)

**Canonical path (when `infra/` is writable in CI):** `infra/terraform/prod/`  
**Working copy in repo:** `deploy/hosted-prod-terraform/` — same composition intent as `docs/library/IAC_RUNTIME_PARITY.md`.

Apply **`infra/terraform-private`** first when Key Vault private endpoints are enabled, then this root.

See `deploy/hosted-prod-terraform/README.md` for variables, BYO modes, and outputs mapping to `CONFIGURATION_REFERENCE.md`.
