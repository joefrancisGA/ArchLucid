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
    IOptions<TechnologyConsistencyFindingEngineOptions> technologyConsistencyFindingEngineOptions)
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

    /// <inheritdoc/>
    public Task<PreCommitGateResult> EvaluateAsync(string runId, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(runId);
        return SimulateSyntheticFindingsInternalAsync(runId, null, 0, null, null, cancellationToken);
    }

    /// <inheritdoc/>
    public Task<PreCommitGateResult> EvaluateAsync(string runId, string goldenManifestWireJson, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(runId);
        ArgumentException.ThrowIfNullOrWhiteSpace(goldenManifestWireJson);
        return SimulateSyntheticFindingsInternalAsync(runId, null, 0, goldenManifestWireJson, null, cancellationToken);
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
        return SimulateSyntheticFindingsInternalAsync(runId, null, 0, goldenManifestWireJson, preloadedData, cancellationToken);
    }

    /// <inheritdoc/>
    public Task<PreCommitGateResult> SimulateSyntheticFindingsAsync(string runId, FindingSeverity syntheticSeverity, int syntheticCount,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(runId);
        return syntheticCount < 0
            ? throw new ArgumentOutOfRangeException(nameof(syntheticCount), syntheticCount, "Count must be non-negative.")
            : SimulateSyntheticFindingsInternalAsync(runId, syntheticSeverity, syntheticCount, null, null, cancellationToken);
    }

    private async Task<PreCommitGateResult> SimulateSyntheticFindingsInternalAsync(
        string runId,
        FindingSeverity? syntheticSeverity,
        int syntheticCount,
        string? goldenManifestWireJson,
        PreCommitGovernancePreloadedData? preloadedData,
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
        IReadOnlyList<PolicyPackAssignment> assignments = preloadedData?.ScopePolicyPackAssignments
            ?? await _policyPackAssignmentRepository.ListByScopeAsync(scope.TenantId, scope.WorkspaceId, scope.ProjectId, cancellationToken);

        PolicyPackAssignment? enforcing = assignments.Where(static a => a.IsEnabled && (a.BlockCommitOnCritical || a.BlockCommitMinimumSeverity.HasValue))
            .OrderByDescending(static a => a.AssignedUtc).FirstOrDefault();

        List<Finding> findings;

        if (preloadedData?.FindingsSnapshotFindings is { } preloadedFindings)
        {
            findings = preloadedFindings.Count > 0 ? preloadedFindings.ToList() : [];
        }
        else
        {
            RunRecord? run = await _runRepository.GetByIdAsync(scope, runKey, cancellationToken);

            if (run is null)
                return PreCommitGateResult.Allowed();

            if (run.FindingsSnapshotId.HasValue)
            {
                FindingsSnapshot? snapshot = await _findingsSnapshotRepository.GetByIdAsync(scope, run.FindingsSnapshotId.Value, cancellationToken);
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

        await AppendTechnologyConsistencyFindingsAsync(runId, scope, findings, cancellationToken);

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

    private async Task AppendTechnologyConsistencyFindingsAsync(
        string runId,
        ScopeContext scope,
        List<Finding> findings,
        CancellationToken cancellationToken)
    {
        TechnologyConsistencyFindingEngineOptions consistencyOptions = _technologyConsistencyFindingEngineOptions.Value;
        consistencyOptions.Normalize();

        if (!consistencyOptions.Enabled)
            return;

        IReadOnlyList<TechnologyLedgerEntry> ledgerEntries =
            await _technologyLedgerRepository.GetByRunIdAsync(scope, runId, cancellationToken).ConfigureAwait(false);

        IReadOnlyList<Finding> consistencyFindings =
            _technologyConsistencyFindingEngine.Evaluate(runId, ledgerEntries, consistencyOptions);

        if (consistencyFindings.Count == 0)
            return;

        findings.AddRange(consistencyFindings);
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
