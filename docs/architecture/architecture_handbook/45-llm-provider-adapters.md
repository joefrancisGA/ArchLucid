# 45. LLM provider adapters

Completions and embeddings are Azure OpenAI–backed in V1 behind `DefaultLlmProviderFactory` and a decorator stack (cache, circuit breaker, fallback, content safety). Non-Azure enum values remain scaffold-only (`NotSupportedException`).

![LLM provider adapters](../architecture_diagrams/archlucid-llm-provider-adapters.svg)
