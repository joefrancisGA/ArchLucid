# Security

Responsible disclosure for **ArchLucid** — this repository, published **container images** (for example API and operator UI), and **NuGet** packages (for example the generated API client) produced from it.

## How to report

**Preferred:** Use **[GitHub Security Advisories](https://docs.github.com/en/code-security/security-advisories/guidance-on-reporting-and-writing-information-about-vulnerabilities/privately-reporting-a-security-vulnerability)** to submit a **private** report for this repository.

**Alternative (placeholder — update before GA):** Email **security@archlucid.dev**. Treat this address as a **stand-in** until your team publishes a verified security contact.

Please **do not** open public issues for undisclosed vulnerabilities.

## What to include

- Clear description of the issue and impact (confidentiality, integrity, availability).
- Steps to reproduce or a safe proof-of-concept (no exploitation of production systems you do not own).
- Affected **versions**, **commits**, **images**, or **packages** when known.
- Suggested **severity** (optional).

Do not send production secrets, live credentials, or unnecessary personal data.

## Our response

- **Acknowledgment** within **5 business days** of a report we can act on.
- **Initial assessment** (severity, scope, and direction) within **15 business days**.

Timelines assume good-faith reports with enough detail to triage; complex issues may need follow-up.

## Coordinated disclosure

Do **not** publicly disclose details (blogs, CVEs, social posts) until **maintainers** confirm a **fix or agreed mitigation** is available and a disclosure timeline is coordinated (**responsible disclosure**).

## Supported versions

Security fixes are applied to **`main`** and the **latest release** built from it. **Older tags** or branches receive fixes at **maintainer discretion**.

## Product security documentation

Deeper design and controls (not duplicated here):

- [docs/security/ASK_RAG_THREAT_MODEL.md](docs/security/ASK_RAG_THREAT_MODEL.md) — Ask / RAG threat model  
- [docs/security/MULTI_TENANT_RLS.md](docs/security/MULTI_TENANT_RLS.md) — Multi-tenant RLS  
- [docs/security/MANAGED_IDENTITY_SQL_BLOB.md](docs/security/MANAGED_IDENTITY_SQL_BLOB.md) — Managed identity, SQL, Blob  
- [docs/security/PII_RETENTION_CONVERSATIONS.md](docs/security/PII_RETENTION_CONVERSATIONS.md) — PII retention (conversations)

## CI security tooling (summary)

Pipelines include automated checks such as:

- **Gitleaks** — secret scanning in repository content.  
- **Trivy** — IaC and container image vulnerability scanning.  
- **CodeQL** — static analysis (C#, JavaScript/TypeScript).  
- **NuGet** — package vulnerability audit in .NET builds.  
- **CycloneDX** — SBOM generation for supply-chain visibility.  
- **OWASP ZAP** — baseline dynamic scanning against the API where configured.
