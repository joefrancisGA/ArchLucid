using System.Text.Json;

using ArchLucid.Application.Governance.Coverage;
using ArchLucid.Application.Common;
using ArchLucid.Application.Runs;
using ArchLucid.Contracts.Governance.Coverage;
using ArchLucid.Contracts.Governance.Resolution;
using ArchLucid.Contracts.Requests;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Diagnostics;
using ArchLucid.Core.Governance.PolicyPacks;
using ArchLucid.Core.Governance.Resolution;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Models;

using Microsoft.Extensions.Logging;

namespace ArchLucid.Application.Governance;

/// <inheritdoc cref="IExecuteTimeGovernanceScopeCaptureService" />
public sealed class ExecuteTimeGovernanceScopeCaptureService(
    IRunRepository runRepository,
    IScopeContextProvider scopeContextProvider,
    IEffectiveGovernanceResolver effectiveGovernanceResolver,
    IPolicyPackAssignmentRepository policyPackAssignmentRepository,
    IPolicyPackRepository policyPackRepository,
    IPolicyPackVersionRepository policyPackVersionRepository,
    ICoverageAssignmentRepository coverageAssignmentRepository,
    CoverageAssignmentValidator coverageAssignmentValidator,
    IActorContext actorContext,
    IAuditService auditService,
    ILogger<ExecuteTimeGovernanceScopeCaptureService> logger) : IExecuteTimeGovernanceScopeCaptureService
{
    private readonly IRunRepository _runRepository =
        runRepository ?? throw new ArgumentNullException(nameof(runRepository));

    private readonly IScopeContextProvider _scopeContextProvider =
        scopeContextProvider ?? throw new ArgumentNullException(nameof(scopeContextProvider));

    private readonly IEffectiveGovernanceResolver _effectiveGovernanceResolver =
        effectiveGovernanceResolver ?? throw new ArgumentNullException(nameof(effectiveGovernanceResolver));

    private readonly IPolicyPackAssignmentRepository _policyPackAssignmentRepository =
        policyPackAssignmentRepository ?? throw new ArgumentNullException(nameof(policyPackAssignmentRepository));

    private readonly IPolicyPackRepository _policyPackRepository =
        policyPackRepository ?? throw new ArgumentNullException(nameof(policyPackRepository));

    private readonly IPolicyPackVersionRepository _policyPackVersionRepository =
        policyPackVersionRepository ?? throw new ArgumentNullException(nameof(policyPackVersionRepository));

    private readonly ICoverageAssignmentRepository _coverageAssignmentRepository =
        coverageAssignmentRepository ?? throw new ArgumentNullException(nameof(coverageAssignmentRepository));

    private readonly CoverageAssignmentValidator _coverageAssignmentValidator =
        coverageAssignmentValidator ?? throw new ArgumentNullException(nameof(coverageAssignmentValidator));

    private readonly IActorContext _actorContext =
        actorContext ?? throw new ArgumentNullException(nameof(actorContext));

    private readonly IAuditService _auditService =
        auditService ?? throw new ArgumentNullException(nameof(auditService));

    private readonly ILogger<ExecuteTimeGovernanceScopeCaptureService> _logger =
        logger ?? throw new ArgumentNullException(nameof(logger));

    private readonly EffectiveGovernanceSnapshotBuilder _snapshotBuilder = new();

    /// <inheritdoc />
    public async Task TryCaptureAndPersistAsync(
        string runId,
        ArchitectureRequest request,
        CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(runId);
        ArgumentNullException.ThrowIfNull(request);

        if (!TryParseRunGuid(runId, out Guid runGuid))
            return;

        ScopeContext scope = _scopeContextProvider.GetCurrentScope();
        RunRecord? header = await _runRepository.GetByIdAsync(scope, runGuid, cancellationToken).ConfigureAwait(false);

        if (header is null)
            return;

        if (!string.IsNullOrWhiteSpace(header.GovernanceScopeJson))
            return;

        RunAcknowledgedCoverageDocument? acknowledgedCoverage =
            RunAcknowledgedCoverageJson.TryDeserialize(header.AcknowledgedCoverageJson);

        IReadOnlyDictionary<Guid, RunCoverageAcknowledgementEntry> acknowledgementMap =
            RunCoverageOverrideApplicator.ToAcknowledgementMap(acknowledgedCoverage);

        EffectiveGovernanceSnapshotResolution resolution = await _snapshotBuilder.ResolveAsync(
            scope,
            request,
            _effectiveGovernanceResolver,
            _policyPackAssignmentRepository,
            _policyPackRepository,
            preloadedScopePolicyPackAssignments:
                RunHeaderPinnedPolicyPackAssignmentFactory.ResolveCommitTimeAssignmentsOrThrow(header, scope),
            cancellationToken,
            _policyPackVersionRepository,
            acknowledgementMap).ConfigureAwait(false);

        ExecutedEffectiveGovernanceSnapshotDescriptor snapshot = new()
        {
            GeneratedUtc = TimeProvider.System.UtcNowDateTime(),
            FocusedPilotModeEnabled = FocusedPilotModePolicyPacks.ReferencesIncludeFocusedPilotToken(request.PolicyReferences),
            CloudProvider = request.CloudProvider.ToString(),
            ComplianceRuleKeyCount = resolution.ComplianceRuleKeys.Count,
            ComplianceRuleKeys = resolution.ComplianceRuleKeys,
            ConflictCount = resolution.ConflictCount,
            PackAssignments = resolution.PackAssignments,
            CoverageAssignments = resolution.CoverageAssignments,
            NotAssessedQualityDimensions = resolution.NotAssessedQualityDimensions,
            HasEffectivePolicy = resolution.HasEffectivePolicy,
            RequestFingerprintHex = Convert.ToHexString(ArchitectureRunIdempotencyHashing.FingerprintRequest(request)),
            GovernanceAssignmentsHashHex = PreFinalizeExecuteBaselineDriftEvaluator.HashPackAssignments(resolution.PackAssignments),
        };

        header.GovernanceScopeJson = ExecutedEffectiveGovernanceSnapshotJson.Serialize(snapshot);
        await _runRepository.UpdateAsync(header, cancellationToken).ConfigureAwait(false);

        await TryPersistCoverageAssignmentsAsync(
            scope,
            runId,
            resolution.CoverageAssignments,
            cancellationToken).ConfigureAwait(false);

        await TryAuditScopeResolvedAsync(scope, runGuid, snapshot, cancellationToken).ConfigureAwait(false);
    }

    private async Task TryPersistCoverageAssignmentsAsync(
        ScopeContext scope,
        string runId,
        IReadOnlyList<CommittedCoverageAssignmentSnapshot> coverageRows,
        CancellationToken cancellationToken)
    {
        if (coverageRows.Count == 0)
            return;

        IReadOnlyList<CoverageAssignment> existing =
            await _coverageAssignmentRepository.ListByRunIdAsync(scope, runId, cancellationToken).ConfigureAwait(false);

        if (existing.Count > 0)
            return;

        string actor = _actorContext.GetActor();
        DateTime createdUtc = TimeProvider.System.UtcNowDateTime();
        Dictionary<Guid, ArchLucid.Contracts.Governance.PolicyPacks.PolicyPack> packsById = [];

        foreach (CommittedCoverageAssignmentSnapshot row in coverageRows)
        {
            if (!packsById.TryGetValue(row.PolicyPackId, out ArchLucid.Contracts.Governance.PolicyPacks.PolicyPack? pack))
            {
                IReadOnlyList<ArchLucid.Contracts.Governance.PolicyPacks.PolicyPack> loaded =
                    await _policyPackRepository
                        .GetByIdsAsync([row.PolicyPackId], cancellationToken)
                        .ConfigureAwait(false);

                pack = loaded.FirstOrDefault();

                if (pack is not null)
                    packsById[row.PolicyPackId] = pack;
            }

            CoverageAssignment assignment = new()
            {
                TenantId = scope.TenantId,
                WorkspaceId = scope.WorkspaceId,
                ProjectId = scope.ProjectId,
                RunId = runId,
                PolicyPackId = row.PolicyPackId,
                PolicyPackVersion = row.PolicyPackVersion,
                CoverageType = Enum.Parse<CoverageType>(row.CoverageType),
                SelectionState = Enum.Parse<CoverageSelectionState>(row.SelectionState),
                ExclusionReason = row.ExclusionReason,
                ActorUserId = actor,
                CreatedUtc = createdUtc,
                EvaluationVersion = row.EvaluationVersion
            };

            CoverageAssignmentValidationResult validation =
                _coverageAssignmentValidator.Validate(assignment, pack);

            if (!validation.IsValid)
            {
                if (_logger.IsEnabled(LogLevel.Warning))
                {
                    _logger.LogWarningWithThreeSanitizedUserStrings(
                        "Skipping invalid execute-time coverage row for RunId={RunId}, PolicyPackId={PolicyPackId}: {Errors}",
                        runId,
                        row.PolicyPackId.ToString(),
                        string.Join("; ", validation.Errors));
                }

                continue;
            }

            await _coverageAssignmentRepository.AddAsync(assignment, cancellationToken).ConfigureAwait(false);
        }
    }

    private async Task TryAuditScopeResolvedAsync(
        ScopeContext scope,
        Guid runGuid,
        ExecutedEffectiveGovernanceSnapshotDescriptor snapshot,
        CancellationToken cancellationToken)
    {
        try
        {
            await _auditService.LogAsync(
                new AuditEvent
                {
                    EventType = AuditEventTypes.RunGovernanceScopeResolved,
                    TenantId = scope.TenantId,
                    WorkspaceId = scope.WorkspaceId,
                    ProjectId = scope.ProjectId,
                    RunId = runGuid,
                    DataJson = JsonSerializer.Serialize(new
                    {
                        runId = runGuid.ToString("N"),
                        packAssignmentCount = snapshot.PackAssignments.Count,
                        coverageAssignmentCount = snapshot.CoverageAssignments.Count,
                        notAssessedDimensionCount = snapshot.NotAssessedQualityDimensions.Count,
                        conflictCount = snapshot.ConflictCount,
                        focusedPilotModeEnabled = snapshot.FocusedPilotModeEnabled,
                        cloudProvider = snapshot.CloudProvider
                    })
                },
                cancellationToken).ConfigureAwait(false);
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            if (_logger.IsEnabled(LogLevel.Warning))
            {
                _logger.LogWarning(
                    ex,
                    "Run governance scope audit failed for RunId={RunId}; execute outcome unchanged.",
                    runGuid.ToString("N"));
            }
        }
    }

    private static bool TryParseRunGuid(string runId, out Guid runGuid) =>
        Guid.TryParseExact(runId, "N", out runGuid) || Guid.TryParse(runId, out runGuid);
}
