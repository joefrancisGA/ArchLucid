using ArchLucid.Application.ArchitectureIntelligence;
using ArchLucid.Contracts.ArchitectureIntelligence;
using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Governance;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Models;

namespace ArchLucid.Application.Governance;

public sealed partial class PreFinalizeChecklistService
{
    private async Task AddArchitectureIntelligenceTrustItemsAsync(
        ScopeContext scope,
        string runId,
        List<PreFinalizeChecklistItem> items,
        CancellationToken cancellationToken)
    {
        if (_finalizeTrustEvaluator is null
            || _knowledgeModelAccess is null
            || _specialistReviewService is null
            || !Guid.TryParse(runId, out Guid parsedRunId))
            return;

        ArchitectureKnowledgeModel? model = await _knowledgeModelAccess
            .GetForRunAsync(scope, parsedRunId, cancellationToken)
            .ConfigureAwait(false);

        if (model is null)
            return;

        SpecialistReviewResult review = _specialistReviewService.Review(model);
        List<SpecialistReviewFinding> specialistFindings = review.Findings;

        items.Add(_finalizeTrustEvaluator.EvaluateMustNotFail(specialistFindings, []));
        items.Add(_finalizeTrustEvaluator.EvaluateTrustPublish(specialistFindings, []));
    }

    private async Task<PreFinalizeChecklistItem> BuildPolicyPackCoverageProofItemAsync(
        ScopeContext scope,
        Guid runKey,
        CancellationToken cancellationToken)
    {
        RunRecord? run = await _runRepository.GetByIdAsync(scope, runKey, cancellationToken).ConfigureAwait(false);

        if (run is null || string.IsNullOrWhiteSpace(run.GovernanceScopeJson))
        {
            return new PreFinalizeChecklistItem
            {
                ItemId = "policy-pack-coverage-proof",
                Title = "Policy pack evaluation coverage",
                Detail = "No execute-time governance scope captured for this run.",
                Status = PreFinalizeChecklistItemStatus.Clear,
                Count = 0,
            };
        }

        List<Finding> findings = await LoadFindingsAsync(scope, runKey, cancellationToken).ConfigureAwait(false);
        FindingsSnapshot? findingsSnapshot =
            await LoadFindingsSnapshotAsync(scope, runKey, cancellationToken).ConfigureAwait(false);

        string updatedScopeJson = PolicyPackAssignmentOutcomeRecorder.ApplyOutcomes(
            run.GovernanceScopeJson,
            findings,
            findingsSnapshot);

        if (!string.Equals(updatedScopeJson, run.GovernanceScopeJson, StringComparison.Ordinal))
        {
            run.GovernanceScopeJson = updatedScopeJson;
            await _runRepository.UpdateAsync(run, cancellationToken).ConfigureAwait(false);
        }

        PolicyPackCoverageProofResult proof = PolicyPackCoverageProofEvaluator.Evaluate(
            updatedScopeJson,
            findings);

        if (proof.UnprovenAssignmentCount == 0)
        {
            return new PreFinalizeChecklistItem
            {
                ItemId = "policy-pack-coverage-proof",
                Title = "Policy pack evaluation coverage",
                Detail = $"All {proof.AssignmentCount} in-scope pack assignment(s) have evaluation signals.",
                Status = PreFinalizeChecklistItemStatus.Clear,
                Count = 0,
            };
        }

        return new PreFinalizeChecklistItem
        {
            ItemId = "policy-pack-coverage-proof",
            Title = "Policy pack evaluation coverage",
            Detail =
                $"{proof.UnprovenAssignmentCount} assigned pack(s) lack evaluation proof — evidence of scope, not compliance certification.",
            Status = PreFinalizeChecklistItemStatus.Advisory,
            Count = proof.UnprovenAssignmentCount,
        };
    }
}
