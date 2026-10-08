> **Scope:** Chapter 6 stub for the book draft *Managing Azure Security with AI*. Author working notes; not product documentation.
> **Status:** draft

# Chapter 6 — Data flow: may access vs did access

**Spine:** [`../README.md`](../README.md) · **Outline:** [`../OUTLINE.md`](../OUTLINE.md)

## Reader takeaway

"This identity **may access** this data" is a capability statement. It is not evidence that data moved. Wording matters to executives and auditors.

## Key points

- Capability-to-flow: combine privilege and reachability to show possible data access.
- Declared flows (app settings, connection strings by name), probable flows, observed flows (logs), human-confirmed flows.
- How AI-generated summaries tend to blur "may" into "did", and how to stop it.

## Lab idea

Draw a data flow diagram with a legend for each evidence level; have an LLM describe it and grade the wording.

## Open questions

- Which diagram notation to standardize on in the book?
