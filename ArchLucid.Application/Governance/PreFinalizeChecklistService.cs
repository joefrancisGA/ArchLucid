using ArchLucid.Application.ArchitectureIntelligence;
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

public sealed partial class PreFinalizeChecklistService(
    IScopeContextProvider scopeContextProvider,
    IRunRepository runRepository,
    IFindingsSnapshotRepository findingsSnapshotRepository,
    ITechnologyLedgerRepository technologyLedgerRepository,
    IFindingEvidenceLinkageFindingEngine findingEvidenceLinkageFindingEngine,
    IOptions<FindingEvidenceLinkageFindingEngineOptions> findingEvidenceLinkageFindingEngineOptions,
    IPreCommitGovernanceGate preCommitGovernanceGate,
    IArchitectureKnowledgeModelAccess? knowledgeModelAccess,
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

    private readonly IArchitectureKnowledgeModelAccess? _knowledgeModelAccess = knowledgeModelAccess;

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

        return snapshot?.Findings is { Count: > 0 }
            ? AuthorityFindingRollupFilter.ForAuthorityRollup(snapshot.Findings)
            : [];
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

    private static PreFinalizeChecklistResult EmptyResult(string runId) =>
        new()
        {
            RunId = runId,
            ReadyToFinalize = true,
            Items = [],
        };
}
