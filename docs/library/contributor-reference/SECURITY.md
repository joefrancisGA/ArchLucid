> **Scope:** Contributor-reference index — security engineering pointers. Customer role guidance is **not** here.
>
> **Status:** current

# Security overview (ArchLucid)

This index points contributors to security-relevant behavior and gates. It is not a full threat model; see ADRs and runbooks for depth.

## Customer-facing

| Topic | Path |
| --- | --- |
| Users and roles (in-app) | `/help/users-and-roles` |
| Security and trust | `/help/security-trust` |
| Data handling | `/help/data-handling` |

## Contributor engineering references

| Topic | Path |
| --- | --- |
| Authentication and authorization configuration | [`AUTHENTICATION_CONFIGURATION.md`](AUTHENTICATION_CONFIGURATION.md) |
| Security testing (OWASP ZAP, Schemathesis) | [`../../security/SECURITY_TESTING_RUNBOOK.md`](../../security/SECURITY_TESTING_RUNBOOK.md) |
| Secure logging (CWE-117) | [`SECURE_LOGGING.md`](SECURE_LOGGING.md) |
| AI content safety operations | [`AI_CONTENT_SAFETY_OPERATIONS.md`](AI_CONTENT_SAFETY_OPERATIONS.md) |
| Data retention operations | [`DATA_RETENTION_OPERATIONS.md`](DATA_RETENTION_OPERATIONS.md) |
| Configuration reference | [`../CONFIGURATION_REFERENCE.md`](../CONFIGURATION_REFERENCE.md) |
| Deployment | [`../../engineering/DEPLOYMENT.md`](../../engineering/DEPLOYMENT.md) |
| Multi-tenant isolation | [`../../security/MULTI_TENANT_RLS.md`](../../security/MULTI_TENANT_RLS.md) |

## Cross-links

- **API key rotation:** [`../../runbooks/API_KEY_ROTATION.md`](../../runbooks/API_KEY_ROTATION.md)
- **System-wide STRIDE summary:** [`../../security/SYSTEM_THREAT_MODEL.md`](../../security/SYSTEM_THREAT_MODEL.md)
- **UI term mapping:** [`../CONCEPT_VOCABULARY.md#ui-glossary-v1`](../CONCEPT_VOCABULARY.md#ui-glossary-v1)
