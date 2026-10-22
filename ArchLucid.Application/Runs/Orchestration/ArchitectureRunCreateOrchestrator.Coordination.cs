using ArchLucid.Application.Runs.Coordination;
using ArchLucid.Contracts.Requests;
using ArchLucid.Core.Audit;

using Microsoft.Extensions.Options;

namespace ArchLucid.Application.Runs.Orchestration;

public sealed partial class ArchitectureRunCreateOrchestrator
{
    /// <summary>
    ///     Lock wait budget (shared by SQL <c>sp_getapplock</c> and in-process semaphores) while another caller holds
    ///     the same idempotency key. The lock spans coordinator + persistence.
    /// </summary>
    private static int ClampDistributedLockTimeout(IOptions<ArchitectureRunCreateOptions> options)
    {
        int ms = options.Value.DistributedIdempotencyLockTimeoutMilliseconds;
        if (ms < 1_000)
            return 1_000;

        // Ceiling must allow losers to wait for the slowest winner across authority pipeline plus SQL variance
        // (greenfield CI sets AuthorityPipeline:PipelineTimeout above the historical 25-minute cap).
        const int absoluteMaxDistributedIdempotencyLockWaitMilliseconds = 3_600_000;

        return ms > absoluteMaxDistributedIdempotencyLockWaitMilliseconds
            ? absoluteMaxDistributedIdempotencyLockWaitMilliseconds
            : ms;
    }

    private async Task<CreateRunResult> CreateRunWithCoordinationAsync(ArchitectureRequest request, CreateRunIdempotencyState? idempotency,
        CancellationToken cancellationToken)
    {
        bool useEnlistedUnitOfWork = await _asyncAuthorityPipelineModeResolver
            .ShouldQueueContextAndGraphStagesAsync(cancellationToken);

        if (useEnlistedUnitOfWork)
            return await CreateRunWithEnlistedCoordinationAsync(request, idempotency, cancellationToken);

        return await CreateRunWithSyncCoordinationAsync(request, idempotency, cancellationToken);
    }

    private async Task<CreateRunResult> FinalizeSuccessfulCreateRunAsync(
        ArchitectureRequest request,
        CreateRunIdempotencyState? idempotency,
        CoordinationResult coordination,
        bool inserted,
        string actor,
        CancellationToken cancellationToken)
    {
        if (idempotency is not null && !inserted)
        {
            CreateRunResult? winner = await _idempotencyHelper.ResolveIdempotencyRaceAsync(idempotency, cancellationToken);
            return winner ?? throw new InvalidOperationException("Idempotency insert failed but no winning row was found; retry the request.");
        }

        await _baselineMutationAudit.RecordAsync(AuditEventTypes.Baseline.Architecture.RunCreated, actor, coordination.Run.RunId,
            $"RequestId={request.RequestId}; Environment={request.Environment}; SystemName={request.SystemName}", cancellationToken);

        await _postCreateHooks.ExecuteAsync(request, coordination, actor, cancellationToken);

        return new CreateRunResult { Run = coordination.Run, EvidenceBundle = coordination.EvidenceBundle, Tasks = coordination.Tasks };
    }

    private static bool TryParseCoordinationRunGuid(string runId, out Guid runGuid) =>
        Guid.TryParseExact(runId, "N", out runGuid) || Guid.TryParse(runId, out runGuid);

    private string ResolveCreateActor(string? actorOverride)
    {
        if (!string.IsNullOrWhiteSpace(actorOverride))
            return actorOverride;

        return _actorContext.GetActor();
    }
}
