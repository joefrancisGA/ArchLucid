using ArchLucid.Core.Scoping;

namespace ArchLucid.Application.Runs.Async;

/// <summary>Queued execute/replay work executed outside the HTTP request (TB-2075).</summary>
public sealed record ArchitectureRunAsyncOperationWorkItem(
    ArchitectureRunAsyncOperationKind Kind,
    ScopeContext Scope,
    string Actor,
    string CorrelationId,
    string RunId,
    string? ReplayExecutionMode,
    bool ReplayCommit,
    string? ReplayManifestVersionOverride,
    string? PreparedReplayRunId);
