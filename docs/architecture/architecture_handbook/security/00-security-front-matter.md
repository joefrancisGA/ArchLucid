# Security reviewer front matter — ArchLucid platform architecture (excerpt)

**Pack:** Security  
**Version:** see `../VERSION`  
**Audience:** InfoSec, risk, and technical security reviewers evaluating the **ArchLucid platform**.

## What this pack is

A short, diagram-backed security excerpt: tenancy, identity, secrets, ingress threats (Ask/RAG and webhooks), content safety, rate limits, commit segregation of duties, audit, and compliance honesty.

## What this pack is not

- Not a customer architecture review package produced by ArchLucid for a tenant’s systems.
- Not a CPA SOC 2 report or a published third-party penetration-test summary.
- Not the full platform handbook (DbUp, CI lanes, Polly defaults, every hosted service).

## Honesty

- Production tenant isolation is **database-per-tenant** (ADR 0037). SQL Row-Level Security is **not** the production control.
- Async authority pipeline + transactional outbox is the SQL default (ADR 0038).
- CPA SOC 2 attestation (**G-REAL-05**) and third-party pen-test publication (**G-ASSURANCE-02**) remain **owner/GTM** tracks — do not infer them from this pack.
- Content safety and prompt-injection controls reduce risk; they do **not** claim “injection-proof.”
