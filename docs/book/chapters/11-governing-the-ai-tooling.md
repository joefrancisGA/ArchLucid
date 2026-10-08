> **Scope:** Chapter 11 stub for the book draft *Managing Azure Security with AI*. Author working notes; not product documentation.
> **Status:** draft

# Chapter 11 — Governing the AI tooling itself

**Spine:** [`../README.md`](../README.md) · **Outline:** [`../OUTLINE.md`](../OUTLINE.md)

## Reader takeaway

The AI system that reads your security evidence is itself a high-value target. Govern it like one.

## Key points

- Least privilege: read-only collection identity, no write roles, managed identity over keys.
- Private endpoints for the model endpoint and evidence storage; deny public access.
- Tenant and data isolation if multiple business units or customers share the tooling.
- Audit model use with correlation IDs, model/version metadata, and redacted payloads by default. If full prompts or outputs must be retained, encrypt them, restrict access, set short retention limits, and exclude secrets, PII, and sensitive tenant data.
- Cost: token budgets, caching explanations per snapshot, cheaper models for triage.
- Everything deployed with Terraform.

## Lab idea

Terraform module for a private Azure OpenAI endpoint plus storage with private endpoints and RBAC-only access.

## Open questions

- Reference architecture diagram style (Azure icons are allowed in architectural diagrams under Microsoft's terms).
