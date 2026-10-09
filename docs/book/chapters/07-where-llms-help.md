> **Scope:** Chapter 7 stub for the book draft *Managing Azure Security with AI*. Author working notes; not product documentation.
> **Status:** draft

# Chapter 7 — Where LLMs help

**Spine:** [`../README.md`](../README.md) · **Outline:** [`../OUTLINE.md`](../OUTLINE.md)

## Reader takeaway

LLMs are strong at **explaining cited evidence** to different audiences and drafting artifacts a human reviews.

## Key points

- Explain a specific path hop by hop, citing only supplied evidence.
- Triage summaries for an on-call engineer versus a CISO.
- Draft runbooks and Terraform changes for human review.
- Grounding pattern: provide structured evidence, require citations, reject uncited claims.
- Azure options: Azure OpenAI in Foundry, Copilot for Security (verify capabilities at writing time).

## Lab idea

Prompt template plus a small validator that rejects any explanation sentence without a hop citation.

## Open questions

- How much code versus prose in this chapter?
