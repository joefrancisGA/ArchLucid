> **Scope:** Chapter 1 stub for the book draft *Managing Azure Security with AI*. Author working notes; not product documentation.
> **Status:** draft

# Chapter 1 — Why checklists fail

**Spine:** [`../README.md`](../README.md) · **Outline:** [`../OUTLINE.md`](../OUTLINE.md)

## Reader takeaway

A long list of misconfigurations is not a prioritized risk picture. Risk lives in **paths** that connect an entry point to something valuable.

## Key points

- Posture tools score controls independently; attackers chain them.
- Two "medium" findings can combine into one critical path (toxic combination).
- Teams burn out closing low-value findings while one high-value path stays open.
- Where AI enters: it can summarize the list faster, but a faster summary of the wrong unit is still wrong.

## Lab idea

Deploy a sample subscription with ~20 benign-looking misconfigurations, two of which chain into storage-account data access. Show the checklist view, then the path view.

## Open questions

- Which public posture scores to reference without vendor bashing?
