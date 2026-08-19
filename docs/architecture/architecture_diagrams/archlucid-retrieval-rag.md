> **Scope:** Zoom-in — Retrieval indexing outbox and Ask RAG path.
> **ADR:** [`../adrs/0004-transactional-outbox-retrieval-indexing.md`](../adrs/0004-transactional-outbox-retrieval-indexing.md)

# ArchLucid — retrieval / RAG

![Retrieval RAG](archlucid-retrieval-rag.svg)

Editable source: [`archlucid-retrieval-rag.mmd`](archlucid-retrieval-rag.mmd)

```mermaid
flowchart LR
  COMMIT["Authority finalize / commit"] --> OUTBOX["Retrieval indexing outbox"]
  OUTBOX --> WORKER["Worker drains outbox"]
  WORKER --> EMB["Embedding batches"]
  EMB --> STORE["Vector / search store<br/>config-driven"]
  ASK["Ask / grounded chat"] --> RET["ArchLucid.Retrieval"]
  RET --> STORE
  RET --> LLM["Azure OpenAI optional"]
  RET --> ANS["Grounded answer + citations"]
```
