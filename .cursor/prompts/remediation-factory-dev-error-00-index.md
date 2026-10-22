<!-- Remediation factory dev-log prompts.
     Origin: Next dev log on /security/remediation-factory with a missing export
     and a Security-shell 403 to Azure Boards settings.
     Do not implement from this index. -->

# Remediation factory dev log — Composer prompt set (RF-ERR-01–RF-ERR-03 + hold)

`/security/remediation-factory` returns 200 while the client module fails to compile, and the operator shell requests an Architecture-only Azure Boards route.

**Do not implement from this index.** Paste **one** numbered `.cursor/prompts/remediation-factory-dev-error-0N-*.md` file per session.

Wave doc: [`docs/architecture/REMEDIATION_FACTORY_DEV_ERROR_COMPOSER_PROMPTS.md`](../../docs/architecture/REMEDIATION_FACTORY_DEV_ERROR_COMPOSER_PROMPTS.md).

## Diagnosis → prompt

| # | Concern | Prompt | What moves |
|---|---------|--------|------------|
| 1 | `REMEDIATION_FACTORY_PATH_INSPECT_PANEL_ID` is imported and not exported | **RF-ERR-01** | Page-copy export, optional panel `id`, factory caller |
| 2 | Security shell `GET /v1/integrations/azure-boards/settings` 403 | **RF-ERR-02** | Skip that fetch when the product line is Security |
| 3 | Fast Refresh reload, router-before-init, `global-error` chunk timeout | **RF-ERR-03** | Confirm they leave after 01. No Next internals patch |
| 4 | Temptation to mark Azure Boards `both` or mute the proxy log | **RF-ERR-HOLD** | Written hold |

## Run order

**RF-ERR-01** and **RF-ERR-02** can run in parallel. **RF-ERR-03** after 01. **RF-ERR-HOLD** is not implementation.

## Healthy lines (do not “fix”)

ITSM health 200, user preferences 200, working-workspace-continuity 204, learning plans 200, health/ready 200, auth/me 200, shell-status 200.

## Global constraints (every prompt)

- **Do not** change `AzureBoardsIntegrationsController` from `productLine: "architecture"`.
- **Do not** put the factory panel id on findings-queue or finding-inspect callers.
- Working-tree safety before editing a tracked file. Stage only named paths. **No `git add -A`.**
