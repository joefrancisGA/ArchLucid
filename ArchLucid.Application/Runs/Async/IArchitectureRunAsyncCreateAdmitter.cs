using ArchLucid.Contracts.Requests;
using ArchLucid.Core.Scoping;

using ArchLucid.Application.Runs;

namespace ArchLucid.Application.Runs.Async;

/// <summary>
///     Persists the minimal create-run rows and returns a poll handle before heavy coordination runs (Tier C create).
/// </summary>
public interface IArchitectureRunAsyncCreateAdmitter
{
    /// <summary>
    ///     Commits request, run header stub, and idempotency rows, then returns <paramref name="runId" /> for
    ///     <c>run:{runId}</c> poll. Idempotent accepts replay the same run id when the key and body match.
    /// </summary>
    Task<ArchitectureRunAsyncCreateAdmitResult> AdmitAsync(
        ArchitectureRequest request,
        CreateRunIdempotencyState? idempotency,
        ScopeContext scope,
        CancellationToken cancellationToken = default);
}
