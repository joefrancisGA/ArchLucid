using ArchLucid.Application.Runs;
using ArchLucid.Contracts.Requests;

namespace ArchLucid.Application.Runs.Orchestration;

/// <summary>
///     Coordinates and persists a new architecture run (create phase).
/// </summary>
/// <remarks>
///     <see cref="CreateRunAsync" /> evaluates <see cref="IRequestContentSafetyPrecheck" /> on the submitted request
///     before authority coordination or persistence (aligned with execute and file-import paths).
/// </remarks>
public interface IArchitectureRunCreateOrchestrator
{
    Task<CreateRunResult> CreateRunAsync(
        ArchitectureRequest request,
        CreateRunIdempotencyState? idempotency = null,
        CancellationToken cancellationToken = default);

    /// <summary>
    ///     Completes coordination and pipeline enqueue for a run admitted by async create accept (Tier C).
    ///     The run header and idempotency rows already exist; this method must not insert idempotency again.
    /// </summary>
    Task CompleteAsyncAcceptedCreateRunAsync(
        Guid runId,
        ArchitectureRequest request,
        CreateRunIdempotencyState? idempotency,
        CancellationToken cancellationToken = default);
}
