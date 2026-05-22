> **Scope:** Advanced integrators authoring and registering custom agent handlers in the ArchLucid orchestration pipeline.

# Custom agent handler guide

This guide explains how an advanced integrator can author and register a custom agent handler in the ArchLucid orchestration pipeline.

**Note:** This capability is strictly for in-repo / self-hosted extensions. It is not designed for a public plugin marketplace.

## Prerequisites
- Familiarity with the ArchLucid orchestration pipeline and agent execution model.
- Access to the host composition root (`Host.Composition`).
- Development environment configured for ArchLucid extension.

## Authority and safety posture
- **Execution boundary:** Custom handlers execute in the same process space as the core agents. They share the same memory and configuration.
- **Data safety:** Handlers must respect tenant boundaries and use the provided scoped data access interfaces.
- **Rate limiting:** Ensure your handlers respect the configured LLM budgets and rate limits.

## Registration expectations
Custom agent handlers are registered in the dependency injection container, typically within the `Host.Composition` layer.
Implement the `IAgentHandler` interface and register it:
```csharp
services.AddTransient<IAgentHandler, MyCustomHandler>();
```

## Versioning boundaries
- **In-repo extensions:** Your custom handlers must be compiled and deployed alongside the core ArchLucid API.
- **Upgrades:** When upgrading ArchLucid, review the release notes for changes to the agent execution pipeline, as internal interfaces (`IAgentHandler`, `AgentResult`) may evolve.
