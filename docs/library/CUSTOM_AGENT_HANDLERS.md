> **Scope:** Operators forking the host who need a minimal C# recipe for swapping **built-in** `IAgentHandler` registrations — cites existing composition patterns; **not** a plugin marketplace or supported third-party SDK.

> **Spine doc:** [Five-document onboarding spine](../FIRST_5_DOCS.md).

# Custom agent handlers (fork boilerplate)

## Where handlers live today

Production handlers (`TopologyAgentHandler`, `CostAgentHandler`, `ComplianceAgentHandler`, `CriticAgentHandler`) are registered as **`services.AddScoped<IAgentHandler, …>()`** inside **`RegisterAgentExecution`** in [`ArchLucid.Host.Composition/Startup/ServiceCollectionExtensions.AgentsGovernanceRetrieval.cs`](../../ArchLucid.Host.Composition/Startup/ServiceCollectionExtensions.AgentsGovernanceRetrieval.cs) when **`AgentExecution:Mode`** is not **`Simulator`**.

`RealAgentExecutor` builds a dictionary keyed by **`IAgentHandler.AgentTypeKey`** and **throws at startup** when two handlers advertise the same key (see [`ArchLucid.AgentRuntime/RealAgentExecutor.cs`](../../ArchLucid.AgentRuntime/RealAgentExecutor.cs)). You cannot register a second topology handler without removing or replacing the stock one.

Stable keys are defined in [`ArchLucid.Contracts/Common/AgentTypeKeys.cs`](../../ArchLucid.Contracts/Common/AgentTypeKeys.cs); each handler exposes **`AgentType`** plus **`AgentTypeKey`** (typically `AgentTypeKeys.Topology`, etc.).

## Fork recipe (replace one built-in handler)

1. **Fork or wrap** [`ArchLucid.Host.Composition`](../../ArchLucid.Host.Composition) into your deployment repo (same pattern as other enterprise forks of composition roots).
2. Copy the **`else`** branch body of **`RegisterAgentExecution`** that registers the four stock handlers.
3. Swap exactly **one** line — example replaces topology:

```csharp
// Stock line (remove when forking this handler):
// services.AddScoped<IAgentHandler, TopologyAgentHandler>();

// Your forked implementation must keep AgentType / AgentTypeKey aligned with dispatch:
services.AddScoped<IAgentHandler, AcmeTopologyAgentHandler>();
```

4. Implement **`AcmeTopologyAgentHandler : IAgentHandler`** mirroring the constructor dependencies of [`TopologyAgentHandler`](../../ArchLucid.AgentRuntime/TopologyAgentHandler.cs) (completion client, parser, trace recorder, prompts, audit, scope, remediation options) unless you intentionally slim the pipeline — **do not change `AgentTypeKey`** if you still execute persisted **`AgentTask`** rows that resolve to **`topology`**.

## Minimal handler skeleton (compile-time checklist only)

This skeleton is **not** runnable end-to-end copy-paste — real handlers must call `IAgentCompletionClient`, `IAgentResultParser`, and `IAgentExecutionTraceRecorder` like the stock implementations. It shows the **surface area** you must satisfy:

```csharp
using ArchLucid.Contracts.Abstractions.Agents;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Requests;

namespace Acme.ArchLucid.Host.AgentHandlers;

public sealed class AcmeTopologyAgentHandler : IAgentHandler
{
    public AgentType AgentType => AgentType.Topology;

    public string AgentTypeKey => AgentTypeKeys.Topology;

    public Task<AgentResult> ExecuteAsync(
        string runId,
        ArchitectureRequest request,
        AgentEvidencePackage evidence,
        AgentTask task,
        CancellationToken cancellationToken = default)
    {
        if (request is null) throw new ArgumentNullException(nameof(request));
        if (evidence is null) throw new ArgumentNullException(nameof(evidence));
        if (task is null) throw new ArgumentNullException(nameof(task));

        // Delegate to the stock TopologyAgentHandler logic via composition **or** call your LLM pipeline here.
        throw new NotImplementedException("Wire completion client + parser + traces like TopologyAgentHandler.");
    }
}
```

## Operational cautions

- **Simulator mode** (`AgentExecution:Mode=Simulator`) substitutes [`SimulatorExecutionTraceRecordingExecutor`](../../ArchLucid.AgentRuntime/SimulatorExecutionTraceRecordingExecutor.cs); handler registrations still exist but flows may bypass parts of the real pipeline — validate both modes if you ship a fork.
- **Governance + auditing**: stock handlers emit structured traces and audits; skipping those contracts breaks operator UX and compliance narratives — reuse shared helpers where possible.
- **Upgrade merges**: composition files churn frequently; track upstream diffs to `ServiceCollectionExtensions.AgentsGovernanceRetrieval.cs` whenever rebasing.

## References

- Interface contract — [`IAgentHandler`](../../ArchLucid.Contracts/Abstractions/Agents/IAgentHandler.cs)
- Dispatch keys — [`AgentTypeKeys`](../../ArchLucid.Contracts/Common/AgentTypeKeys.cs)
- Reference implementation — [`TopologyAgentHandler`](../../ArchLucid.AgentRuntime/TopologyAgentHandler.cs)
