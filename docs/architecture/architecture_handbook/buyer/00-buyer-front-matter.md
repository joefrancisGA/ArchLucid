# Buyer front matter — ArchLucid platform architecture (excerpt)

**Pack:** Buyer  
**Version:** see `../VERSION`  
**Audience:** Evaluators, security reviewers, and procurement technical readers.

## What this pack is

A short, diagram-backed excerpt of how the **ArchLucid platform** is built and operated (Azure-first, authority pipeline, tenant isolation).

## What this pack is not

It is **not** a customer architecture review package produced by ArchLucid for a tenant’s systems. Those come from evidence through the product authority pipeline and product exports.

## Honesty

- Production tenant isolation is **database-per-tenant** (ADR 0037). SQL Row-Level Security is **not** the production control.
- Async authority pipeline + transactional outbox is the SQL default (ADR 0038).
- CPA SOC 2 attestation and third-party pen-test publication are **owner/GTM** tracks — do not infer them from this pack.
