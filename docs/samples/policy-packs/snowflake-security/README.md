# Snowflake Security policy pack

**Pack id:** `snowflake-security` · **Version:** `1.0.0` · **Category:** Data Platform Security

Snowflake-specific architecture and security review rules for enterprise architects, data platform owners, security reviewers, and audit stakeholders. The pack evaluates identity, RBAC, sensitive-data protection, network connectivity, stages/integrations, logging, encryption, data sharing, SDLC separation, and compliance-readiness themes using **partial evidence** — missing inputs produce **insufficient evidence** outcomes rather than unsupported compliance claims.

> **Disclaimer:** Framework mappings (HIPAA, PCI, GDPR, SOC 2, etc.) are **thematic only**. This pack does **not** certify Snowflake deployments or assert statutory compliance.

## Intended use

1. Upload Snowflake design notes, architecture diagrams, and governance narratives.
2. Upload grants/users/roles exports (`SHOW USERS`, `SHOW ROLES`, `SHOW GRANTS …`).
3. Upload sensitive-data classification or schema/tag exports.
4. Upload masking and row access policy evidence (`SHOW MASKING POLICIES`, `SHOW ROW ACCESS POLICIES`).
5. Upload network policies, storage integrations, stages, and external access integrations.
6. Assign the **Snowflake Security** bundled pack (or import `snowflake-security.json`) to the review scope.
7. Run governance dry-run / commit review and triage findings by severity.
8. Convert accepted items into risks, exceptions, or remediation tasks; export proof for audit or architecture board.

## Recommended evidence to upload

| Evidence | Examples |
|----------|----------|
| Architecture | Snowflake account/region diagram, environment separation, PrivateLink design |
| Identity | `SHOW USERS`, `DESCRIBE USER`, login history summary, SSO/MFA policy exports |
| RBAC | `SHOW ROLES`, `SHOW GRANTS TO ROLE`, `SHOW GRANTS TO USER`, role hierarchy diagram |
| Classification | Object tags, data catalog export, steward/owner metadata |
| Data protection | `SHOW MASKING POLICIES`, `SHOW ROW ACCESS POLICIES`, role-based test results |
| Network | `SHOW NETWORK POLICIES`, external access / network rules |
| Stages & integrations | `SHOW INTEGRATIONS`, `SHOW STAGES`, Terraform/Pulumi snippets |
| Sharing | `SHOW SHARES`, reader account inventory, consumer approvals |
| Logging | Query/login/access history retention design, SIEM integration evidence |
| Access reviews | Privileged/sensitive-role review attestations, exception register |
| IaC | Terraform/Pulumi/schemachange for roles, grants, policies |

### Suggested Snowflake queries (when live access is available)

```sql
SHOW USERS;
SHOW ROLES;
SHOW GRANTS TO ROLE <role>;
SHOW GRANTS OF ROLE <role>;
SHOW GRANTS TO USER <user>;
SHOW GRANTS ON ACCOUNT;
SHOW NETWORK POLICIES;
SHOW INTEGRATIONS;
SHOW STAGES;
SHOW SHARES;
SHOW MASKING POLICIES;
SHOW ROW ACCESS POLICIES;
SELECT * FROM SNOWFLAKE.ACCOUNT_USAGE.USERS;
SELECT * FROM SNOWFLAKE.ACCOUNT_USAGE.LOGIN_HISTORY;
SELECT * FROM SNOWFLAKE.ACCOUNT_USAGE.QUERY_HISTORY;
SELECT * FROM SNOWFLAKE.ACCOUNT_USAGE.ACCESS_HISTORY;
SELECT * FROM SNOWFLAKE.ACCOUNT_USAGE.GRANTS_TO_USERS;
SELECT * FROM SNOWFLAKE.ACCOUNT_USAGE.GRANTS_TO_ROLES;
```

## Finding dispositions

Rules are written to support:

- **Pass** — evidence supports the control intent
- **Warning** — material gap with mitigating context
- **Fail** — evidence indicates meaningful Snowflake-specific risk
- **Insufficient evidence** — required artifacts not provided; reviewer should confirm
- **Not applicable** — control domain not in scope (e.g., PCI rules when no PCI-like data is evidenced)

## Limitations

- Does **not** require live Snowflake connectivity; works from exports, IaC, diagrams, and narrative evidence.
- Does **not** replace penetration testing, formal compliance audit, or Snowflake account health checks.
- Compliance rules (HIPAA/PCI/GDPR) apply only when workload context is evidenced; otherwise prefer insufficient evidence / not applicable language.

## Files

| File | Role |
|------|------|
| [`../snowflake-security.json`](../snowflake-security.json) | `PolicyPackContentDocument` selector |
| [`../snowflake-security-rules-v1.json`](../snowflake-security-rules-v1.json) | Curated rule narratives (`archlucid.policyPack.curatedRules.v1`) |
| [`sample-evidence-fixture.json`](./sample-evidence-fixture.json) | Partial evidence example for dry-run demos |

## Validate locally

```powershell
dotnet run --project ArchLucid.Cli/ArchLucid.Cli.csproj -- policy validate docs/samples/policy-packs/snowflake-security.json
```
