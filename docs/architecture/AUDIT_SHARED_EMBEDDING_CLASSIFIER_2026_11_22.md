# Shared embedding and completion provider classification audit

**Scope:** `ArchLucid.AgentRuntime/LlmCompletionFailureClassifier.cs`, `ArchLucid.Retrieval/Embedding/CircuitBreakingOpenAiEmbeddingClient.cs`, `ArchLucid.Core/Resilience/ProviderHttpFailurePolicy.cs`, associated retrieval tests.

**Confirmed divergence:** completion used HTTP status-aware classification, while embedding unconditionally ticked the circuit on non-caller-cancellation errors, including semantic-terminal errors such as `InvalidOperationException`. Embedding must not reference AgentRuntime because Retrieval is a lower-level project.

**Correction:** place provider HTTP status classification in existing Core.Resilience and reuse it in the completion classifier and embedding breaker. Embedding handles semantic-terminal errors without ticking its breaker; transient transport errors still tick it. Both single and batch embedding paths covered by regression test. Existing breaker and retry controls reused; no new breaker implementation.

**Compatibility:** Core now directly references System.ClientModel for ClientResultException status handling; CI/build must validate package availability and project layering. No merge until tests pass.
