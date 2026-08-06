# 6. Threat model — Ask / RAG (security)

Ask and retrieval paths must preserve tenant scope on embeddings, retrieval, and answer grounding. Treat this diagram as the primary cross-tenant and prompt-abuse surface for conversational features—not a claim that every RAG risk is closed.

![Threat Ask RAG](../../architecture_diagrams/archlucid-threat-ask-rag.svg)
