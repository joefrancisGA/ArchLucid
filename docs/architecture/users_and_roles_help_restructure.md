# Users and roles help restructure

**Date:** 2026-07-13  
**Status:** Shipped

## Original problems

The `/help/operator-auth-roles` route rendered `docs/library/contributor-reference/SECURITY.md` as customer help. That document mixed:

- OWASP ZAP and Schemathesis CI instructions
- JWT, API key, and `DevelopmentBypass` configuration
- Internal RBAC class and policy names
- Rate-limiting partition internals
- LLM content-safety operations
- Removed SQL RLS break-glass notes
- Log-injection implementation guidance
- Operational PII and retention notes

Customers saw engineering runbook content under the label **Users and roles**.

## Route and title decisions

| Item | Decision |
| --- | --- |
| Canonical help slug | `users-and-roles` |
| Legacy alias | `/help/operator-auth-roles` → resolves to the same entry (saved links preserved) |
| Page title | Users and roles |
| Breadcrumb | Support / Users and roles |
| Content kind | `product-help` (was `technical-documentation`) |
| Registry source stub | `docs/library/customer-facing/USERS_AND_ROLES_GUIDE.md` |
| Right-side TOC | Removed — page is short and scannable without section spy |

## Content disposition

| Former SECURITY.md section | Disposition | Destination |
| --- | --- | --- |
| OWASP ZAP baseline | Move to internal security-testing runbook | `docs/security/SECURITY_TESTING_RUNBOOK.md` |
| OpenAPI / Schemathesis fuzzing | Move (consolidated with above) | `docs/security/SECURITY_TESTING_RUNBOOK.md` |
| Shipped auth defaults | Move to internal authentication documentation | `docs/library/contributor-reference/AUTHENTICATION_CONFIGURATION.md` |
| DevelopmentBypass production guard | Move (same doc) | `docs/library/contributor-reference/AUTHENTICATION_CONFIGURATION.md` |
| RBAC engineering table | Move (same doc) | `docs/library/contributor-reference/AUTHENTICATION_CONFIGURATION.md` |
| HTTP rate limiting | Move (same doc) | `docs/library/contributor-reference/AUTHENTICATION_CONFIGURATION.md` |
| LLM content safety | Move to AI safety operations | `docs/library/contributor-reference/AI_CONTENT_SAFETY_OPERATIONS.md` |
| SQL RLS break-glass (removed) | Move to data retention ops (historical note) | `docs/library/contributor-reference/DATA_RETENTION_OPERATIONS.md` |
| Log injection (CWE-117) | Move to secure-development standards | `docs/library/contributor-reference/SECURE_LOGGING.md` |
| PII and conversation retention | Split | Customer summaries remain on `/help/security-trust` and `/help/data-handling`; ops detail in `DATA_RETENTION_OPERATIONS.md` |
| Customer role overview | Rewrite in customer language | In-app manifest `users-and-roles-help-manifest.ts` |
| Workspace access | Rewrite | Guide + link to `/help/scope` |
| Reviewer invitations | Rewrite | Guide (Reader role default) |
| Managing access steps | Keep (customer) | Guide |
| Security guidance callout | Keep (customer) | Guide + link to `/help/security-trust` |

`docs/library/contributor-reference/SECURITY.md` is now an index only — not registered as customer help.

## Customer content retained or rewritten

- Built-in roles **Admin**, **Operator**, **Reader**, **Auditor** (assignable in Settings)
- Compact capability matrix aligned with `Permissions.BuiltIn*` on the API
- Workspace access explanation (no per-project membership UI claimed)
- Reviewer invitation distinction (Reader role, admin-only invite)
- Managing access steps and least-privilege guidance
- Small FAQ (invite, billing, admin vs architect, reviewer invite, access requests)

## Role terminology decisions

- UI role names **Admin**, **Operator**, **Reader**, **Auditor** are used because they match the Settings matrix and assignable roles.
- **Operator** is described as “Architect or review operator” in the intended-user column — not renamed in product UI.
- **Workspace administrator** maps to Admin for customer prose.
- Billing management is Admin-only per `Permissions.BuiltInAdmin`.
- Custom roles are mentioned only as a footnote; matrix reflects built-in defaults.

## Files changed

### In-app

- `archlucid-ui/src/lib/users-and-roles-help-manifest.ts`
- `archlucid-ui/src/lib/users-and-roles-help-copy.ts`
- `archlucid-ui/src/app/(operator)/help/_sections/HelpUsersAndRolesGuideView.tsx`
- `archlucid-ui/src/app/(operator)/help/_sections/HelpUsersAndRolesManageAction.tsx`
- `archlucid-ui/src/app/(operator)/help/[...topic]/page.tsx`
- `archlucid-ui/src/lib/product-documentation-registry.ts`
- `archlucid-ui/src/lib/product-documentation-content-kinds.ts`
- `archlucid-ui/src/lib/breadcrumb-map.ts`
- `archlucid-ui/src/lib/in-app-doc-href.ts`
- `archlucid-ui/src/lib/help/help-center-catalog.ts`
- `archlucid-ui/src/lib/help/help-search-panel-catalog.ts`
- `archlucid-ui/src/lib/help/help-topics.ts`
- `archlucid-ui/src/lib/troubleshooting-help-guide-content.ts`
- `archlucid-ui/src/components/operator/OperatorJwtBearerRoleMappingCallout.tsx`

### Documentation

- `docs/library/customer-facing/USERS_AND_ROLES_GUIDE.md` (new stub)
- `docs/library/contributor-reference/SECURITY.md` (index only)
- `docs/library/contributor-reference/AUTHENTICATION_CONFIGURATION.md` (new)
- `docs/library/contributor-reference/SECURE_LOGGING.md` (new)
- `docs/library/contributor-reference/AI_CONTENT_SAFETY_OPERATIONS.md` (new)
- `docs/library/contributor-reference/DATA_RETENTION_OPERATIONS.md` (new)
- `docs/security/SECURITY_TESTING_RUNBOOK.md` (new)
- `docs/library/HOSTED_ENTERPRISE_ONBOARDING_CHECKLIST.md` (link update)

### Tests

- `archlucid-ui/src/lib/users-and-roles-help-manifest.test.ts`
- `archlucid-ui/src/app/(operator)/help/HelpTopicUsersAndRoles.test.tsx`
- Updated registry and help-center catalog tests

## Tests run

```text
npx vitest run src/lib/users-and-roles-help-manifest.test.ts src/app/(operator)/help/HelpTopicUsersAndRoles.test.tsx
```

## Unresolved gaps

- **Project-scoped role assignment:** No project membership UI in Settings; guide states workspace-wide roles only.
- **Architect / Reviewer IdP labels:** Entra may emit `Architect` or `Reviewer` claims; only the four built-in assignable roles appear in the customer matrix.
- **Sponsor / WorkspaceAdmin / PlatformOperator:** Not shown on the customer page (internal or IdP-specific personas).
- **Screenshots:** Not captured in this pass — verify desktop and mobile manually at `/help/users-and-roles`.
