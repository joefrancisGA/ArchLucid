> **Scope:** Advanced integrators authoring and registering custom agent handlers in the ArchLucid orchestration pipeline.

# Custom agent handler guide

This guide explains how an advanced integrator can author and register a custom agent handler in the ArchLucid orchestration pipeline.

**Note:** This capability is strictly for in-repo / self-hosted extensions. It is not designed for a public plugin marketplace.

For out-of-process handlers (separate service, HTTP contract), see [`CUSTOM_AGENT_HANDLERS.md`](CUSTOM_AGENT_HANDLERS.md).

## 1. When to use in-repo vs out-of-process

| Approach | Use when |
|----------|----------|
| **In-repo handler** (this guide) | You control the host deployment, need tight DI access, and accept compile-time coupling to ArchLucid releases. |
| **Out-of-process handler** | You need isolation, independent release cadence, or a non-.NET runtime. |

## 2. Prerequisites

- Familiarity with the authority orchestration pipeline (`AuthorityRunOrchestrator`, agent tasks, manifest commit).
- Access to the host composition root (`ArchLucid.Host.Composition`).
- Development environment configured for ArchLucid (`dotnet build ArchLucid.sln`).

## 3. Authority and safety posture

- **Execution boundary:** Custom handlers execute in the same process as core agents. They share memory and configuration.
- **Data safety:** Handlers must respect tenant scope from `IScopeContextProvider` and use repository ports — never bypass RLS or cross-tenant reads.
- **Rate limiting:** Handlers must respect LLM budgets (`LlmCompletionAccountingClient`) and configured quotas.

## 4. `IAgentHandler` — interface and minimal example

Interface location: `ArchLucid.Contracts.Agents.IAgentHandler` (or the agent execution abstraction your branch registers against the orchestrator).

Minimal handler (pseudocode — align names with your branch):

```csharp
public sealed class SampleCostReviewHandler : IAgentHandler
{
    public AgentType AgentType => AgentType.Cost;

    public Task<AgentResult> ExecuteAsync(AgentExecutionContext context, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(context);

        // Build structured JSON findings; never log raw prompts.
        AgentResult result = new()
        {
            RunId = context.RunId,
            AgentType = AgentType.Cost,
            Status = AgentResultStatus.Succeeded,
            Findings = []
        };

        return Task.FromResult(result);
    }
}
```

## 5. DI registration in `Host.Composition`

Register in `ArchLucid.Host.Composition/Startup/ServiceCollectionExtensions.AgentsGovernanceRetrieval.cs` (or the partial that wires agent handlers):

```csharp
services.AddTransient<IAgentHandler, SampleCostReviewHandler>();
```

The orchestrator resolves all registered `IAgentHandler` implementations and dispatches by `AgentType`. Confirm your handler’s `AgentType` does not collide with built-in agents unless intentionally replacing simulator/real paths in a fork.

## 6. Simulator vs real mode

| Mode | Behavior |
|------|----------|
| **Simulator** | Default dev/pilot — handlers may receive stub context; LLM calls may be bypassed. |
| **Real** | Hosted Azure OpenAI — handlers run through `LlmCompletionAccountingClient` (quota, redaction, budgeting). |

Configure via `AgentExecution:Mode` and related appsettings. Test both paths before promoting to production tenants.

## 7. Versioning / upgrade checklist

When upgrading ArchLucid:

1. Read [`BREAKING_CHANGES.md`](../BREAKING_CHANGES.md) for agent pipeline or contract changes.
2. Rebuild your handler against the new `ArchLucid.Contracts` package.
3. Run `ArchLucid.AgentRuntime.Tests` and your handler’s unit tests.
4. Run a simulator create → execute → commit smoke, then one real-mode pilot if applicable.
5. Verify DI registration still resolves (host fails fast on missing handler for required agent types).

## Related documents

- [`START_HERE.md`](../START_HERE.md) — integrator spine
- [`CUSTOM_AGENT_HANDLERS.md`](CUSTOM_AGENT_HANDLERS.md) — out-of-process contract
- [`API_CONTRACTS.md`](API_CONTRACTS.md) — HTTP surfaces handlers may call indirectly
