using ArchLucid.Application.Runs;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Governance;
using ArchLucid.Contracts.Persistence.TechnologyLedger;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Governance.PolicyPacks;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Decisioning.Models;
using ArchLucid.Decisioning.Validation;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Models;

using Microsoft.Extensions.Options;

namespace ArchLucid.Application.Governance;

/// <summary>
///     Blocks commit when an enabled assignment enforces a severity threshold and persisted findings meet that bar.
/// </summary>
public sealed class PreCommitGovernanceGate(
    IOptions<PreCommitGovernanceGateOptions> options,
    IScopeContextProvider scopeContextProvider,
    IRunRepository runRepository,
    IFindingsSnapshotRepository findingsSnapshotRepository,
    IPolicyPackAssignmentRepository policyPackAssignmentRepository,
    ISchemaValidationService schemaValidationService,
    IOptions<AuthorityCommitSchemaValidationOptions> authorityCommitSchemaValidationOptions,
    ITechnologyLedgerRepository technologyLedgerRepository,
    ITechnologyConsistencyFindingEngine technologyConsistencyFindingEngine,
    IOptions<TechnologyConsistencyFindingEngineOptions> technologyConsistencyFindingEngineOptions,
    IFindingEvidenceLinkageFindingEngine findingEvidenceLinkageFindingEngine,
    IOptions<FindingEvidenceLinkageFindingEngineOptions> findingEvidenceLinkageFindingEngineOptions)
    : IPreCommitGovernanceGate
{
    private readonly IOptions<AuthorityCommitSchemaValidationOptions> _authorityCommitSchemaValidationOptions =
        authorityCommitSchemaValidationOptions ?? throw new ArgumentNullException(nameof(authorityCommitSchemaValidationOptions));

    private readonly IFindingsSnapshotRepository _findingsSnapshotRepository =
        findingsSnapshotRepository ?? throw new ArgumentNullException(nameof(findingsSnapshotRepository));

    private readonly IOptions<PreCommitGovernanceGateOptions> _options = options ?? throw new ArgumentNullException(nameof(options));

    private readonly IPolicyPackAssignmentRepository _policyPackAssignmentRepository =
        policyPackAssignmentRepository ?? throw new ArgumentNullException(nameof(policyPackAssignmentRepository));

    private readonly IRunRepository _runRepository = runRepository ?? throw new ArgumentNullException(nameof(runRepository));

    private readonly ISchemaValidationService _schemaValidationService =
        schemaValidationService ?? throw new ArgumentNullException(nameof(schemaValidationService));

    private readonly IScopeContextProvider _scopeContextProvider = scopeContextProvider ?? throw new ArgumentNullException(nameof(scopeContextProvider));

    private readonly ITechnologyLedgerRepository _technologyLedgerRepository =
        technologyLedgerRepository ?? throw new ArgumentNullException(nameof(technologyLedgerRepository));

    private readonly ITechnologyConsistencyFindingEngine _technologyConsistencyFindingEngine =
        technologyConsistencyFindingEngine ?? throw new ArgumentNullException(nameof(technologyConsistencyFindingEngine));

    private readonly IOptions<TechnologyConsistencyFindingEngineOptions> _technologyConsistencyFindingEngineOptions =
        technologyConsistencyFindingEngineOptions ?? throw new ArgumentNullException(nameof(technologyConsistencyFindingEngineOptions));

    private readonly IFindingEvidenceLinkageFindingEngine _findingEvidenceLinkageFindingEngine =
        findingEvidenceLinkageFindingEngine ?? throw new ArgumentNullException(nameof(findingEvidenceLinkageFindingEngine));

    private readonly IOptions<FindingEvidenceLinkageFindingEngineOptions> _findingEvidenceLinkageFindingEngineOptions =
        findingEvidenceLinkageFindingEngineOptions ?? throw new ArgumentNullException(nameof(findingEvidenceLinkageFindingEngineOptions));

    /// <inheritdoc/>
    public Task<PreCommitGateResult> EvaluateAsync(string runId, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(runId);
        return SimulateSyntheticFindingsInternalAsync(runId, null, 0, null, null, requireScopedRun: false, cancellationToken);
    }

    /// <inheritdoc/>
    public Task<PreCommitGateResult> EvaluateAsync(string runId, string goldenManifestWireJson, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(runId);
        ArgumentException.ThrowIfNullOrWhiteSpace(goldenManifestWireJson);
        return SimulateSyntheticFindingsInternalAsync(runId, null, 0, goldenManifestWireJson, null, requireScopedRun: false, cancellationToken);
    }

    /// <inheritdoc/>
    public Task<PreCommitGateResult> EvaluateAsync(
        string runId,
        string goldenManifestWireJson,
        PreCommitGovernancePreloadedData? preloadedData,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(runId);
        ArgumentException.ThrowIfNullOrWhiteSpace(goldenManifestWireJson);
        return SimulateSyntheticFindingsInternalAsync(runId, null, 0, goldenManifestWireJson, preloadedData, requireScopedRun: false, cancellationToken);
    }

    /// <inheritdoc/>
    public Task<PreCommitGateResult> SimulateSyntheticFindingsAsync(string runId, FindingSeverity syntheticSeverity, int syntheticCount,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(runId);
        return syntheticCount < 0
            ? throw new ArgumentOutOfRangeException(nameof(syntheticCount), syntheticCount, "Count must be non-negative.")
            : SimulateSyntheticFindingsInternalAsync(runId, syntheticSeverity, syntheticCount, null, null, requireScopedRun: true, cancellationToken);
    }

    private async Task<PreCommitGateResult> SimulateSyntheticFindingsInternalAsync(
        string runId,
        FindingSeverity? syntheticSeverity,
        int syntheticCount,
        string? goldenManifestWireJson,
        PreCommitGovernancePreloadedData? preloadedData,
        bool requireScopedRun,
        CancellationToken cancellationToken)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(runId);

        if (goldenManifestWireJson is not null && _authorityCommitSchemaValidationOptions.Value.ValidateGoldenManifestSchema)
        {
            SchemaValidationResult manifestSchemaResult = _schemaValidationService.ValidateGoldenManifestJson(goldenManifestWireJson);

            if (!manifestSchemaResult.IsValid)
                throw new GoldenManifestSchemaValidationException(manifestSchemaResult);
        }

        if (!_options.Value.PreCommitGateEnabled || !Guid.TryParse(runId, out Guid runKey))
            return PreCommitGateResult.Allowed();
        ScopeContext scope = _scopeContextProvider.GetCurrentScope();

        bool needsRunHeader = preloadedData?.ScopePolicyPackAssignments is null
            || preloadedData.FindingsSnapshotFindings is null
            || requireScopedRun;

        RunRecord? runHeader = needsRunHeader
            ? await _runRepository.GetByIdAsync(scope, runKey, cancellationToken).ConfigureAwait(false)
            : null;

        IReadOnlyList<PolicyPackAssignment> assignments = preloadedData?.ScopePolicyPackAssignments
            ?? (runHeader is not null
                ? await RunHeaderPinnedPolicyPackAssignmentFactory
                    .ResolveCommitTimeAssignmentsWithEnforcementAsync(
                        runHeader,
                        scope,
                        _policyPackAssignmentRepository,
                        cancellationToken)
                    .ConfigureAwait(false)
                : []);

        PolicyPackAssignment? enforcing = assignments.Where(static a => a.IsEnabled && (a.BlockCommitOnCritical || a.BlockCommitMinimumSeverity.HasValue))
            .OrderByDescending(static a => a.AssignedUtc).FirstOrDefault();

        List<Finding> findings;

        if (preloadedData?.FindingsSnapshotFindings is { } preloadedFindings)
        {
            findings = preloadedFindings.Count > 0 ? preloadedFindings.ToList() : [];
        }
        else
        {
            if (runHeader is null)
                return requireScopedRun
                    ? throw new RunNotFoundException(runId)
                    : PreCommitGateResult.Allowed();

            if (runHeader.FindingsSnapshotId.HasValue)
            {
                FindingsSnapshot? snapshot = await _findingsSnapshotRepository.GetByIdAsync(scope, runHeader.FindingsSnapshotId.Value, cancellationToken);
                findings = snapshot?.Findings is { Count: > 0 } ? snapshot.Findings.ToList() : [];
            }
            else
            {
                findings = [];
            }
        }

        if (syntheticSeverity is { } sev && syntheticCount > 0)
        {
            for (int i = 0; i < syntheticCount; i++)
                findings.Add(CreateSyntheticFinding(runId, i, sev));
        }

        await PreCommitSupplementalFindingsAppender.AppendAsync(
            runId,
            scope,
            findings,
            _technologyLedgerRepository,
            _technologyConsistencyFindingEngine,
            _technologyConsistencyFindingEngineOptions.Value,
            _findingEvidenceLinkageFindingEngine,
            _findingEvidenceLinkageFindingEngineOptions.Value,
            cancellationToken).ConfigureAwait(false);

        if (enforcing is not null)
            return PreCommitGateEvaluator.EvaluateForAssignment(findings, enforcing, _options.Value);

        FindingSeverity? globalThreshold = PreCommitGateThresholdParser.TryParseMinimumSeverity(_options.Value.PreCommitGateThreshold);

        if (globalThreshold is null)
            return PreCommitGateResult.Allowed();

        return PreCommitGateEvaluator.Evaluate(
            findings,
            blockCommitOnCritical: false,
            blockCommitMinimumSeverity: (int)globalThreshold.Value,
            policyPackIdLabel: "global-pre-commit-threshold",
            _options.Value.WarnOnlySeverities);
    }

    private static Finding CreateSyntheticFinding(string runId, int index, FindingSeverity severity)
    {
        return new Finding
        {
            FindingId = $"synthetic-precommit-{index}-{Guid.NewGuid():N}",
            FindingType = "SyntheticPreCommitSimulation",
            Category = "GovernanceSimulation",
            EngineType = "Synthetic",
            Severity = severity,
            Title = "Synthetic finding (pre-commit simulation)",
            Rationale = $"Ephemeral-only; not persisted. Run {runId}.",
            RunIdRef = runId
        };
    }
}
