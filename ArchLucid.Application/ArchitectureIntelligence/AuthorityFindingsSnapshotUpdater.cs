using ArchLucid.Contracts.ArchitectureIntelligence;
using ArchLucid.Contracts.Findings;
using ArchLucid.Core.Persistence.Ports;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Services;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Models;

namespace ArchLucid.Application.ArchitectureIntelligence;

public interface IAuthorityFindingsSnapshotUpdater
{
    Task MergeSpecialistFindingsAsync(
        ScopeContext scope,
        Guid runId,
        IReadOnlyList<SpecialistReviewFinding> specialistFindings,
        CancellationToken cancellationToken = default);
}

public sealed class AuthorityFindingsSnapshotUpdater(
    IRunRepository runRepository,
    IFindingsSnapshotRepository findingsSnapshotRepository,
    IAsyncAdversarialReviewService adversarialReviewService,
    TimeProvider timeProvider) : IAuthorityFindingsSnapshotUpdater
{
    private readonly IRunRepository _runRepository =
        runRepository ?? throw new ArgumentNullException(nameof(runRepository));

    private readonly IFindingsSnapshotRepository _findingsSnapshotRepository =
        findingsSnapshotRepository ?? throw new ArgumentNullException(nameof(findingsSnapshotRepository));

    private readonly IAsyncAdversarialReviewService _adversarialReviewService =
        adversarialReviewService ?? throw new ArgumentNullException(nameof(adversarialReviewService));

    private readonly TimeProvider _clock = timeProvider ?? TimeProvider.System;

    public async Task MergeSpecialistFindingsAsync(
        ScopeContext scope,
        Guid runId,
        IReadOnlyList<SpecialistReviewFinding> specialistFindings,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);
        ArgumentNullException.ThrowIfNull(specialistFindings);

        if (specialistFindings.Count == 0)
            return;

        RunRecord? run = await _runRepository.GetByIdAsync(scope, runId, cancellationToken).ConfigureAwait(false);

        if (run?.FindingsSnapshotId is not Guid snapshotId)
            return;

        FindingsSnapshot? snapshot =
            await _findingsSnapshotRepository.GetByIdAsync(scope, snapshotId, cancellationToken).ConfigureAwait(false);

        if (snapshot is null)
            return;

        AdversarialReviewResult adversarial = await _adversarialReviewService
            .ReviewAsync(specialistFindings, cancellationToken: cancellationToken)
            .ConfigureAwait(false);

        List<Finding> mapped = ArchitectureIntelligenceProductBridge.ToFindings(adversarial.SubstantiatedFindings);
        FindingsSnapshotAuthorityMerger.MergeAdditionalFindings(snapshot, mapped, _clock);

        await _findingsSnapshotRepository.SaveAsync(snapshot, cancellationToken).ConfigureAwait(false);
    }
}
