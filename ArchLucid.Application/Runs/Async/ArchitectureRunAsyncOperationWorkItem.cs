using ArchLucid.Contracts.Requests;
using ArchLucid.Core.Scoping;

using ArchLucid.Application.Runs;

namespace ArchLucid.Application.Runs.Async;

/// <summary>Queued execute/replay/create work executed outside the HTTP request (TB-2075).</summary>
public sealed record ArchitectureRunAsyncOperationWorkItem(
    ArchitectureRunAsyncOperationKind Kind,
    ScopeContext Scope,
    string Actor,
    string CorrelationId,
    string RunId,
    string? ReplayExecutionMode,
    bool ReplayCommit,
    string? ReplayManifestVersionOverride,
    string? PreparedReplayRunId,
    ArchitectureRequest? CreateRequest = null,
    CreateRunIdempotencyState? CreateIdempotency = null);
