using ArchLucid.Application.ArchitectureIntelligence;
using ArchLucid.Contracts.ArchitectureIntelligence;
using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Governance;
using ArchLucid.Contracts.Persistence.TechnologyLedger;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Models;

using Microsoft.Extensions.Options;

namespace ArchLucid.Application.Governance;

public sealed class PreFinalizeChecklistService(
    IScopeContextProvider scopeContextProvider,
    IRunRepository runRepository,
    IFindingsSnapshotRepository findingsSnapshotRepository,
    ITechnologyLedgerRepository technologyLedgerRepository,
    IFindingEvidenceLinkageFindingEngine findingEvidenceLinkageFindingEngine,
    IOptions<FindingEvidenceLinkageFindingEngineOptions> findingEvidenceLinkageFindingEngineOptions,
    IPreCommitGovernanceGate preCommitGovernanceGate,
    IArchitectureIntelligencePersistence? architectureIntelligencePersistence,
    IArchitectureIntelligenceFinalizeTrustEvaluator? finalizeTrustEvaluator = null,
    IBlockedReviewCheckProjector? blockedReviewCheckProjector = null,
    ISpecialistReviewService? specialistReviewService = null) : IPreFinalizeChecklistService
{
    private readonly IScopeContextProvider _scopeContextProvider =
        scopeContextProvider ?? throw new ArgumentNullException(nameof(scopeContextProvider));

    private readonly IRunRepository _runRepository =
        runRepository ?? throw new ArgumentNullException(nameof(runRepository));

    private readonly IFindingsSnapshotRepository _findingsSnapshotRepository =
        findingsSnapshotRepository ?? throw new ArgumentNullException(nameof(findingsSnapshotRepository));

    private readonly ITechnologyLedgerRepository _technologyLedgerRepository =
        technologyLedgerRepository ?? throw new ArgumentNullException(nameof(technologyLedgerRepository));

    private readonly IFindingEvidenceLinkageFindingEngine _findingEvidenceLinkageFindingEngine =
        findingEvidenceLinkageFindingEngine ?? throw new ArgumentNullException(nameof(findingEvidenceLinkageFindingEngine));

    private readonly IOptions<FindingEvidenceLinkageFindingEngineOptions> _findingEvidenceLinkageFindingEngineOptions =
        findingEvidenceLinkageFindingEngineOptions
        ?? throw new ArgumentNullException(nameof(findingEvidenceLinkageFindingEngineOptions));

    private readonly IPreCommitGovernanceGate _preCommitGovernanceGate =
        preCommitGovernanceGate ?? throw new ArgumentNullException(nameof(preCommitGovernanceGate));

    private readonly IArchitectureIntelligencePersistence? _architectureIntelligencePersistence =
        architectureIntelligencePersistence;

    private readonly IArchitectureIntelligenceFinalizeTrustEvaluator? _finalizeTrustEvaluator =
        finalizeTrustEvaluator;

    private readonly IBlockedReviewCheckProjector? _blockedReviewCheckProjector = blockedReviewCheckProjector;

    private readonly ISpecialistReviewService? _specialistReviewService = specialistReviewService;

    public async Task<PreFinalizeChecklistResult> BuildAsync(string runId, CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(runId);

        if (!Guid.TryParse(runId, out Guid runKey))
        {
            return EmptyResult(runId);
        }

        ScopeContext scope = _scopeContextProvider.GetCurrentScope();
        List<PreFinalizeChecklistItem> items = [];

        IReadOnlyList<TechnologyLedgerEntry> ledgerEntries =
            await _technologyLedgerRepository.GetByRunIdAsync(scope, runId, cancellationToken).ConfigureAwait(false);

        int assumedTechnologyCount = ledgerEntries.Count(entry => entry.Status == TechnologyLedgerStatus.Assumed);
        items.Add(BuildAssumedTechnologyItem(assumedTechnologyCount));

        List<Finding> findings = await LoadFindingsAsync(scope, runKey, cancellationToken).ConfigureAwait(false);
        int criticalCount = CountActiveFindings(findings, FindingSeverity.Critical);
        int errorCount = CountActiveFindings(findings, FindingSeverity.Error);

        items.Add(BuildSeverityItem(
            "open-critical-findings",
            "Critical findings resolved",
            "Unresolved critical findings",
            criticalCount,
            FindingSeverity.Critical));

        items.Add(BuildSeverityItem(
            "open-error-findings",
            "Error-severity findings reviewed",
            "Unresolved error-severity findings remain",
            errorCount,
            FindingSeverity.Error,
            blocking: false));

        items.Add(BuildEvidenceLinkageItem(runId, findings));

        items.Add(await BuildProvisionalSynthesisItemAsync(scope, runId, cancellationToken).ConfigureAwait(false));

        PreCommitGateResult gateResult =
            await _preCommitGovernanceGate.EvaluateAsync(runId, cancellationToken).ConfigureAwait(false);

        if (_blockedReviewCheckProjector is not null)
        {
            await _blockedReviewCheckProjector
                .ProjectBlockedChecksAsync(scope, runId, gateResult, cancellationToken)
                .ConfigureAwait(false);
        }

        items.Add(BuildPreCommitGateItem(gateResult));

        await AddArchitectureIntelligenceTrustItemsAsync(scope, runId, items, cancellationToken).ConfigureAwait(false);

        items.Add(await BuildPolicyPackCoverageProofItemAsync(scope, runKey, cancellationToken).ConfigureAwait(false));

        int advisoryCount = items.Count(item => item.Status == PreFinalizeChecklistItemStatus.Advisory);
        int blockingCount = items.Count(item => item.Status == PreFinalizeChecklistItemStatus.Blocking);

        return new PreFinalizeChecklistResult
        {
            RunId = runId,
            ReadyToFinalize = blockingCount == 0,
            Items = items,
            AdvisoryCount = advisoryCount,
            BlockingCount = blockingCount,
        };
    }

    private async Task<List<Finding>> LoadFindingsAsync(
        ScopeContext scope,
        Guid runKey,
        CancellationToken cancellationToken)
    {
        RunRecord? run = await _runRepository.GetByIdAsync(scope, runKey, cancellationToken).ConfigureAwait(false);

        if (run?.FindingsSnapshotId is not Guid snapshotId)
            return [];

        FindingsSnapshot? snapshot =
            await _findingsSnapshotRepository.GetByIdAsync(scope, snapshotId, cancellationToken).ConfigureAwait(false);

        return snapshot?.Findings is { Count: > 0 } ? snapshot.Findings.ToList() : [];
    }

    private async Task<FindingsSnapshot?> LoadFindingsSnapshotAsync(
        ScopeContext scope,
        Guid runKey,
        CancellationToken cancellationToken)
    {
        RunRecord? run = await _runRepository.GetByIdAsync(scope, runKey, cancellationToken).ConfigureAwait(false);

        if (run?.FindingsSnapshotId is not Guid snapshotId)
            return null;

        return await _findingsSnapshotRepository.GetByIdAsync(scope, snapshotId, cancellationToken).ConfigureAwait(false);
    }

    private static int CountActiveFindings(IReadOnlyList<Finding> findings, FindingSeverity severity) =>
        findings.Count(finding =>
            !finding.IsMuted
            && finding.Severity == severity
            && finding.EnforcementTier != FindingEnforcementTier.Advisory);

    private static PreFinalizeChecklistItem BuildAssumedTechnologyItem(int assumedCount) =>
        new()
        {
            ItemId = "technology-baseline-assumed",
            Title = "Technology baseline confirmed",
            Detail = assumedCount == 0
                ? "No Assumed technology rows remain."
                : $"{assumedCount} technology row{(assumedCount == 1 ? "" : "s")} still marked Assumed — confirm or lock Chosen values before finalize.",
            Status = assumedCount == 0
                ? PreFinalizeChecklistItemStatus.Clear
                : PreFinalizeChecklistItemStatus.Blocking,
            Count = assumedCount,
        };

    private static PreFinalizeChecklistItem BuildSeverityItem(
        string itemId,
        string clearTitle,
        string blockedDetailPrefix,
        int count,
        FindingSeverity severity,
        bool blocking = true)
    {
        if (count == 0)
        {
            return new PreFinalizeChecklistItem
            {
                ItemId = itemId,
                Title = clearTitle,
                Detail = $"No active {severity.ToString().ToLowerInvariant()}-severity findings.",
                Status = PreFinalizeChecklistItemStatus.Clear,
                Count = 0,
            };
        }

        PreFinalizeChecklistItemStatus status = blocking
            ? PreFinalizeChecklistItemStatus.Blocking
            : PreFinalizeChecklistItemStatus.Advisory;

        return new PreFinalizeChecklistItem
        {
            ItemId = itemId,
            Title = clearTitle,
            Detail = $"{blockedDetailPrefix}: {count}.",
            Status = status,
            Count = count,
        };
    }

    private PreFinalizeChecklistItem BuildEvidenceLinkageItem(string runId, IReadOnlyList<Finding> findings)
    {
        FindingEvidenceLinkageFindingEngineOptions options = _findingEvidenceLinkageFindingEngineOptions.Value;

        if (!options.Enabled)
        {
            return new PreFinalizeChecklistItem
            {
                ItemId = "evidence-linkage-gaps",
                Title = "Finding evidence linkage",
                Detail = "Evidence linkage validation is disabled for this environment.",
                Status = PreFinalizeChecklistItemStatus.Clear,
                Count = 0,
            };
        }

        int linkageGapCount = _findingEvidenceLinkageFindingEngine.Evaluate(runId, findings)?.Count ?? 0;

        return new PreFinalizeChecklistItem
        {
            ItemId = "evidence-linkage-gaps",
            Title = "Finding evidence linkage",
            Detail = linkageGapCount == 0
                ? "All high-severity findings have graph, trace, or policy anchors."
                : $"{linkageGapCount} high-severity finding{(linkageGapCount == 1 ? "" : "s")} lack evidence linkage anchors.",
            Status = linkageGapCount == 0
                ? PreFinalizeChecklistItemStatus.Clear
                : PreFinalizeChecklistItemStatus.Advisory,
            Count = linkageGapCount,
        };
    }

    private async Task<PreFinalizeChecklistItem> BuildProvisionalSynthesisItemAsync(
        ScopeContext scope,
        string runId,
        CancellationToken cancellationToken)
    {
        if (_architectureIntelligencePersistence is null)
        {
            return new PreFinalizeChecklistItem
            {
                ItemId = "provisional-synthesis",
                Title = "Framing completeness",
                Detail = "Knowledge model not available for this run.",
                Status = PreFinalizeChecklistItemStatus.Clear,
                Count = 0,
            };
        }

        ArchitectureKnowledgeModel? model = await _architectureIntelligencePersistence
            .GetModelByRunIdAsync(scope.TenantId.ToString("D"), runId, cancellationToken)
            .ConfigureAwait(false);

        if (model is null || !model.IsProvisionalSynthesis)
        {
            return new PreFinalizeChecklistItem
            {
                ItemId = "provisional-synthesis",
                Title = "Framing completeness",
                Detail = "Required framing questions are complete for synthesis.",
                Status = PreFinalizeChecklistItemStatus.Clear,
                Count = 0,
            };
        }

        int unresolvedQuestionCount = model.Elements.Count(element =>
            element.Kind == ArchitectureElementKind.UnresolvedQuestion);

        return new PreFinalizeChecklistItem
        {
            ItemId = "provisional-synthesis",
            Title = "Framing completeness",
            Detail =
                $"{unresolvedQuestionCount} required framing question{(unresolvedQuestionCount == 1 ? "" : "s")} remain unanswered — synthesis is provisional.",
            Status = PreFinalizeChecklistItemStatus.Advisory,
            Count = unresolvedQuestionCount,
        };
    }

    private static PreFinalizeChecklistItem BuildPreCommitGateItem(PreCommitGateResult gateResult)
    {
        if (gateResult.Blocked)
        {
            return new PreFinalizeChecklistItem
            {
                ItemId = "pre-commit-gate",
                Title = "Pre-finalize governance gate",
                Detail = gateResult.Reason ?? "Policy pack thresholds would block finalize.",
                Status = PreFinalizeChecklistItemStatus.Blocking,
                Count = gateResult.BlockingFindingIds.Count,
            };
        }

        if (gateResult.WarnOnly)
        {
            return new PreFinalizeChecklistItem
            {
                ItemId = "pre-commit-gate",
                Title = "Pre-finalize governance gate",
                Detail = gateResult.Warnings.Count > 0
                    ? string.Join(" ", gateResult.Warnings)
                    : "Findings meet the threshold but severities are warn-only.",
                Status = PreFinalizeChecklistItemStatus.Advisory,
                Count = gateResult.Warnings.Count,
            };
        }

        return new PreFinalizeChecklistItem
        {
            ItemId = "pre-commit-gate",
            Title = "Pre-finalize governance gate",
            Detail = "No enforcing policy-pack block applies to this run.",
            Status = PreFinalizeChecklistItemStatus.Clear,
            Count = 0,
        };
    }

    private static PreFinalizeChecklistResult EmptyResult(string runId) =>
        new()
        {
            RunId = runId,
            ReadyToFinalize = true,
            Items = [],
        };

    private async Task AddArchitectureIntelligenceTrustItemsAsync(
        ScopeContext scope,
        string runId,
        List<PreFinalizeChecklistItem> items,
        CancellationToken cancellationToken)
    {
        if (_finalizeTrustEvaluator is null
            || _architectureIntelligencePersistence is null
            || _specialistReviewService is null)
            return;

        ArchitectureKnowledgeModel? model = await _architectureIntelligencePersistence
            .GetModelByRunIdAsync(scope.TenantId.ToString("D"), runId, cancellationToken)
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
