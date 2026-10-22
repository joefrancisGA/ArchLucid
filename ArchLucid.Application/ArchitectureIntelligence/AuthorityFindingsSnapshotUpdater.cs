using ArchLucid.Application.Governance;
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
    Task<IReadOnlyList<string>> MergeSpecialistFindingsAsync(
        ScopeContext scope,
        Guid runId,
        IReadOnlyList<SpecialistReviewFinding> specialistFindings,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<string>> MergeSubstantiatedFindingsAsync(
        ScopeContext scope,
        Guid runId,
        SpecialistFindingsSubstantiationResult substantiation,
        CancellationToken cancellationToken = default);
}

public sealed class AuthorityFindingsSnapshotUpdater(
    IRunRepository runRepository,
    IFindingsSnapshotRepository findingsSnapshotRepository,
    ISpecialistFindingsSubstantiationService specialistFindingsSubstantiationService,
    TimeProvider timeProvider) : IAuthorityFindingsSnapshotUpdater
{
    private readonly IRunRepository _runRepository =
        runRepository ?? throw new ArgumentNullException(nameof(runRepository));

    private readonly IFindingsSnapshotRepository _findingsSnapshotRepository =
        findingsSnapshotRepository ?? throw new ArgumentNullException(nameof(findingsSnapshotRepository));

    private readonly ISpecialistFindingsSubstantiationService _specialistFindingsSubstantiationService =
        specialistFindingsSubstantiationService
        ?? throw new ArgumentNullException(nameof(specialistFindingsSubstantiationService));

    private readonly TimeProvider _clock = timeProvider ?? TimeProvider.System;

    public async Task<IReadOnlyList<string>> MergeSpecialistFindingsAsync(
        ScopeContext scope,
        Guid runId,
        IReadOnlyList<SpecialistReviewFinding> specialistFindings,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);
        ArgumentNullException.ThrowIfNull(specialistFindings);

        if (specialistFindings.Count == 0)
            return [];

        SpecialistFindingsSubstantiationResult substantiation = await _specialistFindingsSubstantiationService
            .SubstantiateAsync(specialistFindings, cancellationToken)
            .ConfigureAwait(false);

        return await MergeSubstantiatedFindingsAsync(scope, runId, substantiation, cancellationToken)
            .ConfigureAwait(false);
    }

    public async Task<IReadOnlyList<string>> MergeSubstantiatedFindingsAsync(
        ScopeContext scope,
        Guid runId,
        SpecialistFindingsSubstantiationResult substantiation,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);
        ArgumentNullException.ThrowIfNull(substantiation);

        RunRecord? run = await _runRepository.GetByIdAsync(scope, runId, cancellationToken).ConfigureAwait(false);

        if (run is null)
            return [];

        FindingsSnapshot? snapshot = null;

        if (run.FindingsSnapshotId is Guid existingSnapshotId)
        {
            snapshot = await _findingsSnapshotRepository
                .GetByIdAsync(scope, existingSnapshotId, cancellationToken)
                .ConfigureAwait(false);
        }

        if (snapshot is null)
        {
            snapshot = new FindingsSnapshot
            {
                FindingsSnapshotId = Guid.NewGuid(),
                RunId = runId,
                CreatedUtc = _clock.GetUtcNow().UtcDateTime,
                Findings = [],
            };
        }

        List<Finding> mapped = ArchitectureIntelligenceProductBridge.ToFindings(substantiation.SubstantiatedFindings);
        mapped.AddRange(ArchitectureIntelligenceProductBridge.ToHypothesisLaneFindings(substantiation.Challenges));

        FindingsSnapshotAuthorityMerger.MergeAdditionalFindings(snapshot, mapped, _clock);

        await _findingsSnapshotRepository.SaveAsync(snapshot, cancellationToken).ConfigureAwait(false);

        if (run.FindingsSnapshotId != snapshot.FindingsSnapshotId)
        {
            run.FindingsSnapshotId = snapshot.FindingsSnapshotId;
            await _runRepository.UpdateAsync(run, cancellationToken).ConfigureAwait(false);
        }

        if (!string.IsNullOrWhiteSpace(run.GovernanceScopeJson))
        {
            List<Finding> rollupFindings = snapshot.Findings?.ToList() ?? [];
            string updatedScopeJson = PolicyPackAssignmentOutcomeRecorder.ApplyOutcomes(
                run.GovernanceScopeJson,
                rollupFindings,
                snapshot);

            if (!string.Equals(updatedScopeJson, run.GovernanceScopeJson, StringComparison.Ordinal))
            {
                run.GovernanceScopeJson = updatedScopeJson;
                await _runRepository.UpdateAsync(run, cancellationToken).ConfigureAwait(false);
            }
        }

        return mapped
            .Select(static finding => finding.FindingId)
            .Where(static id => !string.IsNullOrWhiteSpace(id))
            .Distinct(StringComparer.Ordinal)
            .ToList();
    }
}
