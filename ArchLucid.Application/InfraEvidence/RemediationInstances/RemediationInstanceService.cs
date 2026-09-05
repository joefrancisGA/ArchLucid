using System.Text.Json;

using ArchLucid.Application.InfraEvidence.RemediationPatterns;
using ArchLucid.Core.Audit;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Persistence.InfraEvidence;
using ArchLucid.Persistence.Queries;
using ArchLucid.Persistence.Serialization;

namespace ArchLucid.Application.InfraEvidence.RemediationInstances;

public sealed class RemediationInstanceService(
    IRemediationInstanceRepository instanceRepository,
    IRemediationPatternMatchRepository matchRepository,
    IRemediationPatternRepository patternRepository,
    IOperationalSecurityExceptionRepository exceptionRepository,
    IAzureInventorySnapshotRepository snapshotRepository,
    IAdvisoryTerraformRepresentationService advisoryTerraformService,
    IAuditService auditService,
    IOperationalSecurityFindingRepository operationalFindingRepository,
    IAuditManualEvidenceRepository auditManualEvidenceRepository,
    IAuthorityQueryService authorityQueryService,
    IManifestHashService manifestHashService) : IRemediationInstanceService
{
    public async Task<RemediationInstanceOperationResult> CreateFromMatchAsync(
        ScopeContext scope,
        Guid findingId,
        string actorKey,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);

        if (string.IsNullOrWhiteSpace(actorKey))
        {
            return Failed("ActorKey is required.");
        }

        RemediationInstanceOperationResult? sealedManifestFailure =
            await TryEnsureSealedManifestForFindingAsync(scope, findingId, cancellationToken);

        if (sealedManifestFailure is not null)
            return sealedManifestFailure;

        RemediationPatternMatchResultRecord? activeMatch =
            await matchRepository.TryGetActiveMatchAsync(scope.TenantId, findingId, cancellationToken);

        if (activeMatch is null)
            return Failed("No active remediation pattern match exists for the finding.");

        if (activeMatch.MatchKind == RemediationPatternMatchKind.Conflict)
            return Blocked("Remediation pattern match conflict must be resolved before creating an instance.");

        if (!RemediationInstanceGuard.IsStrongMatch(activeMatch.MatchKind))
            return Blocked("Only ExactMatch or ProbableMatch patterns may be used for remediation instances.");

        RemediationPatternVersionRecord? version = await patternRepository.TryGetVersionAsync(
            scope.TenantId,
            activeMatch.PatternId,
            activeMatch.PatternVersion,
            cancellationToken);

        if (!RemediationPatternFactoryGuard.TryValidateForFactoryUse(version, out string? rejection))
            return Blocked(rejection!);

        DateTime utcNow = TimeProvider.System.UtcNowDateTime();
        Guid instanceId = Guid.NewGuid();

        RemediationInstanceRecord instance = new()
        {
            InstanceId = instanceId,
            TenantId = scope.TenantId,
            WorkspaceId = scope.WorkspaceId,
            ProjectId = scope.ProjectId,
            FindingId = findingId,
            PatternId = activeMatch.PatternId,
            PatternVersionId = activeMatch.VersionId,
            PatternKey = activeMatch.PatternKey,
            FrozenPatternVersion = activeMatch.PatternVersion,
            AutomationLevel = version!.AutomationLevel,
            Status = RemediationInstanceStatus.Classified,
            CreatedByActorKey = actorKey.Trim(),
            CreatedUtc = utcNow,
            UpdatedUtc = utcNow,
        };

        await instanceRepository.InsertInstanceAsync(instance, cancellationToken);

        await LogAuditAsync(scope, actorKey, AuditEventTypes.RemediationInstanceCreated, instanceId, cancellationToken);

        return Succeeded(instanceId, RemediationInstanceStatus.Classified);
    }

    public async Task<RemediationInstanceOperationResult> RunPreflightAsync(
        ScopeContext scope,
        Guid instanceId,
        Guid inventorySnapshotId,
        string actorKey,
        CancellationToken cancellationToken = default)
    {
        RemediationInstanceRecord? instance = await RequireInstance(scope, instanceId, cancellationToken);

        if (instance is null)
            return Failed("Remediation instance was not found.");

        RemediationInstanceOperationResult? sealedManifestFailure =
            await TryEnsureSealedManifestForFindingAsync(scope, instance.FindingId, cancellationToken);

        if (sealedManifestFailure is not null)
            return sealedManifestFailure;

        if (instance.Status != RemediationInstanceStatus.Classified)
            return Failed("Preflight is only available while the instance is Classified.");

        RemediationPatternVersionRecord? version = await LoadFrozenVersionAsync(scope.TenantId, instance, cancellationToken);

        if (version is null)
            return Failed("Frozen remediation pattern version was not found.");

        AzureInventorySnapshotDetailReadModel? snapshot =
            await snapshotRepository.TryGetSnapshotDetailAsync(scope, inventorySnapshotId, cancellationToken);

        if (snapshot is null)
            return Failed("Inventory snapshot was not found.");

        RemediationPatternMatchResultRecord? activeMatch =
            await matchRepository.TryGetActiveMatchAsync(scope.TenantId, instance.FindingId, cancellationToken);

        bool hasActiveException = await exceptionRepository.HasActiveExceptionForFindingAsync(
            scope.TenantId,
            instance.FindingId,
            TimeProvider.System.UtcNowDateTime(),
            cancellationToken);

        RemediationInstancePreflightResult preflight = RemediationInstancePreflightEvaluator.Evaluate(
            scope,
            instance,
            version,
            activeMatch,
            hasActiveException,
            snapshot);

        DateTime utcNow = TimeProvider.System.UtcNowDateTime();
        RemediationInstanceStatus nextStatus = preflight.Passed
            ? RemediationInstanceStatus.PreflightPassed
            : RemediationInstanceStatus.PreflightBlocked;

        if (!RemediationInstanceGuard.CanTransition(instance.Status, nextStatus, out string? transitionError))
            return Failed(transitionError ?? "Invalid remediation instance transition.");

        RemediationInstanceRecord updated = CloneInstance(
            instance,
            status: nextStatus,
            preflightSnapshotId: inventorySnapshotId,
            preflightResultJson: preflight.ResultJson,
            updatedUtc: utcNow);

        await instanceRepository.UpdateInstanceAsync(updated, cancellationToken);

        if (!preflight.Passed)
            return Blocked(preflight.Blockers.ToArray());

        return Succeeded(instanceId, nextStatus);
    }

    public async Task<RemediationInstanceOperationResult> ApproveAsync(
        ScopeContext scope,
        Guid instanceId,
        string approverActorKey,
        CancellationToken cancellationToken = default)
    {
        RemediationInstanceRecord? instance = await RequireInstance(scope, instanceId, cancellationToken);

        if (instance is null)
            return Failed("Remediation instance was not found.");

        RemediationInstanceOperationResult? sealedManifestFailure =
            await TryEnsureSealedManifestForFindingAsync(scope, instance.FindingId, cancellationToken);

        if (sealedManifestFailure is not null)
            return sealedManifestFailure;

        if (instance.Status != RemediationInstanceStatus.PreflightPassed)
            return Failed("Only preflight-passed instances may be approved.");

        if (string.IsNullOrWhiteSpace(approverActorKey))
            return Failed("ApproverActorKey is required.");

        if (string.Equals(instance.CreatedByActorKey, approverActorKey.Trim(), StringComparison.OrdinalIgnoreCase))
            return Failed("Approver cannot be the same actor as the instance creator.");

        if (!RemediationInstanceGuard.CanTransition(
                instance.Status,
                RemediationInstanceStatus.Approved,
                out string? transitionError))
        {
            return Failed(transitionError ?? "Invalid remediation instance transition.");
        }

        DateTime utcNow = TimeProvider.System.UtcNowDateTime();

        RemediationInstanceRecord updated = CloneInstance(
            instance,
            status: RemediationInstanceStatus.Approved,
            approvedByActorKey: approverActorKey.Trim(),
            approvedUtc: utcNow,
            updatedUtc: utcNow);

        await instanceRepository.UpdateInstanceAsync(updated, cancellationToken);

        return Succeeded(instanceId, RemediationInstanceStatus.Approved);
    }

    public async Task<RemediationInstanceOperationResult> AssignWaveAsync(
        ScopeContext scope,
        Guid instanceId,
        Guid waveId,
        string actorKey,
        CancellationToken cancellationToken = default)
    {
        RemediationInstanceRecord? instance = await RequireInstance(scope, instanceId, cancellationToken);

        if (instance is null)
            return Failed("Remediation instance was not found.");

        RemediationInstanceOperationResult? sealedManifestFailure =
            await TryEnsureSealedManifestForFindingAsync(scope, instance.FindingId, cancellationToken);

        if (sealedManifestFailure is not null)
            return sealedManifestFailure;

        if (instance.Status != RemediationInstanceStatus.Approved)
            return Failed("Only approved instances may be assigned to a wave.");

        if (waveId == Guid.Empty)
            return Failed("WaveId is required.");

        if (!RemediationInstanceGuard.CanTransition(
                instance.Status,
                RemediationInstanceStatus.WaveAssigned,
                out string? transitionError))
        {
            return Failed(transitionError ?? "Invalid remediation instance transition.");
        }

        DateTime utcNow = TimeProvider.System.UtcNowDateTime();

        RemediationInstanceRecord updated = CloneInstance(
            instance,
            status: RemediationInstanceStatus.WaveAssigned,
            waveId: waveId,
            updatedUtc: utcNow);

        await instanceRepository.UpdateInstanceAsync(updated, cancellationToken);

        return Succeeded(instanceId, RemediationInstanceStatus.WaveAssigned);
    }

    public async Task<RemediationInstanceOperationResult> ExecuteAsync(
        ScopeContext scope,
        Guid instanceId,
        Guid inventorySnapshotId,
        string actorKey,
        string correlationId,
        CancellationToken cancellationToken = default)
    {
        RemediationInstanceRecord? instance = await RequireInstance(scope, instanceId, cancellationToken);

        if (instance is null)
            return Failed("Remediation instance was not found.");

        RemediationInstanceOperationResult? sealedManifestFailure =
            await TryEnsureSealedManifestForFindingAsync(scope, instance.FindingId, cancellationToken);

        if (sealedManifestFailure is not null)
            return sealedManifestFailure;

        if (instance.Status != RemediationInstanceStatus.WaveAssigned)
            return Failed("Only wave-assigned instances may be executed.");

        if (string.IsNullOrWhiteSpace(correlationId))
            return Failed("CorrelationId is required.");

        RemediationPatternVersionRecord? version = await LoadFrozenVersionAsync(scope.TenantId, instance, cancellationToken);

        if (version is null)
            return Failed("Frozen remediation pattern version was not found.");

        if (!RemediationInstanceGuard.TryParsePatternContent(version, out RemediationPatternVersionContent? content, out string? parseError))
            return Failed(parseError ?? "Invalid remediation pattern content.");

        DateTime utcNow = TimeProvider.System.UtcNowDateTime();

        await AppendEvidenceAsync(
            scope.TenantId,
            instanceId,
            RemediationEvidencePhase.Before,
            JsonSerializer.Serialize(new { inventorySnapshotId, instance.Status }),
            actorKey,
            correlationId,
            utcNow,
            cancellationToken);

        object executeRequest = new
        {
            mode = instance.AutomationLevel.ToString(),
            advisoryOnly = true,
            patternKey = instance.PatternKey,
            frozenVersion = instance.FrozenPatternVersion,
        };

        await AppendEvidenceAsync(
            scope.TenantId,
            instanceId,
            RemediationEvidencePhase.ExecuteRequest,
            JsonSerializer.Serialize(executeRequest),
            actorKey,
            correlationId,
            utcNow,
            cancellationToken);

        string executeResultPayload;

        if (instance.AutomationLevel is RemediationAutomationLevel.SemiAutomated
            or RemediationAutomationLevel.Automated)
        {
            AdvisoryTerraformRepresentationResult advisory =
                await advisoryTerraformService.TryBuildFromSnapshotAsync(
                    scope,
                    inventorySnapshotId,
                    aztfexportAvailable: false,
                    cancellationToken);

            executeResultPayload = JsonSerializer.Serialize(new
            {
                result = "emitted",
                advisoryOnly = true,
                advisorySucceeded = advisory.Succeeded,
                advisoryError = advisory.ErrorMessage,
                contentHashSha256 = Convert.ToHexString(advisory.ContentHashSha256),
            });
        }
        else
        {
            executeResultPayload = JsonSerializer.Serialize(new
            {
                result = "emitted",
                mode = "manual-checklist",
                runbookRef = content?.Execution?.RunbookRef,
            });
        }

        await AppendEvidenceAsync(
            scope.TenantId,
            instanceId,
            RemediationEvidencePhase.ExecuteResult,
            executeResultPayload,
            actorKey,
            correlationId,
            utcNow,
            cancellationToken);

        if (!RemediationInstanceGuard.CanTransition(instance.Status, RemediationInstanceStatus.Executed, out string? transitionError))
            return Failed(transitionError ?? "Invalid remediation instance transition.");

        RemediationInstanceRecord updated = CloneInstance(
            instance,
            status: RemediationInstanceStatus.Executed,
            executionSnapshotId: inventorySnapshotId,
            executedUtc: utcNow,
            updatedUtc: utcNow);

        await instanceRepository.UpdateInstanceAsync(updated, cancellationToken);

        await LogAuditAsync(scope, actorKey, AuditEventTypes.RemediationInstanceExecuted, instanceId, cancellationToken);

        return Succeeded(instanceId, RemediationInstanceStatus.Executed);
    }

    public async Task<RemediationInstanceOperationResult> VerifyAsync(
        ScopeContext scope,
        Guid instanceId,
        Guid verificationSnapshotId,
        string actorKey,
        CancellationToken cancellationToken = default)
    {
        RemediationInstanceRecord? instance = await RequireInstance(scope, instanceId, cancellationToken);

        if (instance is null)
            return Failed("Remediation instance was not found.");

        RemediationInstanceOperationResult? sealedManifestFailure =
            await TryEnsureSealedManifestForFindingAsync(scope, instance.FindingId, cancellationToken);

        if (sealedManifestFailure is not null)
            return sealedManifestFailure;

        if (instance.Status != RemediationInstanceStatus.Executed)
            return Failed("Only executed instances may be verified.");

        if (instance.ExecutionSnapshotId is null)
            return Failed("Execution snapshot is required before verification.");

        RemediationPatternVersionRecord? version = await LoadFrozenVersionAsync(scope.TenantId, instance, cancellationToken);

        if (version is null)
            return Failed("Frozen remediation pattern version was not found.");

        if (!RemediationInstanceGuard.TryParsePatternContent(version, out RemediationPatternVersionContent? content, out string? parseError))
            return Failed(parseError ?? "Invalid remediation pattern content.");

        AzureInventorySnapshotDetailReadModel? verificationSnapshot =
            await snapshotRepository.TryGetSnapshotDetailAsync(scope, verificationSnapshotId, cancellationToken);

        if (verificationSnapshot is null)
            return Failed("Verification inventory snapshot was not found.");

        RemediationInstanceVerificationResult verification = RemediationInstanceVerificationEvaluator.Evaluate(
            instance,
            content!,
            verificationSnapshot,
            instance.ExecutionSnapshotId.Value);

        DateTime utcNow = TimeProvider.System.UtcNowDateTime();

        await AppendEvidenceAsync(
            scope.TenantId,
            instanceId,
            RemediationEvidencePhase.Verify,
            verification.ResultJson,
            actorKey,
            correlationId: instance.InstanceId.ToString("N"),
            utcNow,
            cancellationToken);

        RemediationInstanceStatus nextStatus = verification.Passed
            ? RemediationInstanceStatus.Verified
            : RemediationInstanceStatus.VerificationFailed;

        if (!RemediationInstanceGuard.CanTransition(instance.Status, nextStatus, out string? transitionError))
            return Failed(transitionError ?? "Invalid remediation instance transition.");

        RemediationInstanceRecord updated = CloneInstance(
            instance,
            status: nextStatus,
            verificationSnapshotId: verificationSnapshotId,
            verificationResultJson: verification.ResultJson,
            verifiedUtc: utcNow,
            updatedUtc: utcNow);

        await instanceRepository.UpdateInstanceAsync(updated, cancellationToken);

        if (!verification.Passed)
            return Blocked(verification.Failures.ToArray());

        return Succeeded(instanceId, nextStatus);
    }

    public async Task<RemediationInstanceOperationResult> CloseAsync(
        ScopeContext scope,
        Guid instanceId,
        string actorKey,
        CancellationToken cancellationToken = default)
    {
        RemediationInstanceRecord? instance = await RequireInstance(scope, instanceId, cancellationToken);

        if (instance is null)
            return Failed("Remediation instance was not found.");

        RemediationInstanceOperationResult? sealedManifestFailure =
            await TryEnsureSealedManifestForFindingAsync(scope, instance.FindingId, cancellationToken);

        if (sealedManifestFailure is not null)
            return sealedManifestFailure;

        if (instance.Status != RemediationInstanceStatus.Verified)
            return Failed("Only verified instances may be closed.");

        if (!RemediationInstanceGuard.CanTransition(instance.Status, RemediationInstanceStatus.Closed, out string? transitionError))
            return Failed(transitionError ?? "Invalid remediation instance transition.");

        DateTime utcNow = TimeProvider.System.UtcNowDateTime();

        RemediationInstanceRecord updated = CloneInstance(
            instance,
            status: RemediationInstanceStatus.Closed,
            closedUtc: utcNow,
            updatedUtc: utcNow);

        await instanceRepository.UpdateInstanceAsync(updated, cancellationToken);

        await LogAuditAsync(scope, actorKey, AuditEventTypes.RemediationInstanceClosed, instanceId, cancellationToken);

        return Succeeded(instanceId, RemediationInstanceStatus.Closed);
    }

    private async Task<RemediationInstanceRecord?> RequireInstance(
        ScopeContext scope,
        Guid instanceId,
        CancellationToken cancellationToken) =>
        await instanceRepository.TryGetByIdAsync(scope.TenantId, instanceId, cancellationToken);

    private async Task<RemediationInstanceOperationResult?> TryEnsureSealedManifestForFindingAsync(
        ScopeContext scope,
        Guid findingId,
        CancellationToken cancellationToken)
    {
        try
        {
            await RemediationInstanceSealedManifestHashGuard.EnsureFindingLinkedRunSealedManifestHashOrThrowAsync(
                findingId,
                scope,
                operationalFindingRepository,
                auditManualEvidenceRepository,
                authorityQueryService,
                manifestHashService,
                cancellationToken);

            return null;
        }
        catch (ConflictException ex)
        {
            return Failed(ex.Message);
        }
    }

    private async Task<RemediationPatternVersionRecord?> LoadFrozenVersionAsync(
        Guid tenantId,
        RemediationInstanceRecord instance,
        CancellationToken cancellationToken) =>
        await patternRepository.TryGetVersionAsync(
            tenantId,
            instance.PatternId,
            instance.FrozenPatternVersion,
            cancellationToken);

    private async Task AppendEvidenceAsync(
        Guid tenantId,
        Guid instanceId,
        RemediationEvidencePhase phase,
        string payloadJson,
        string actorKey,
        string correlationId,
        DateTime utcNow,
        CancellationToken cancellationToken)
    {
        RemediationEvidenceRecord evidence = new()
        {
            EvidenceId = Guid.NewGuid(),
            InstanceId = instanceId,
            TenantId = tenantId,
            Phase = phase,
            PayloadJson = payloadJson,
            ActorKey = actorKey.Trim(),
            CorrelationId = correlationId.Trim(),
            CreatedUtc = utcNow,
        };

        await instanceRepository.InsertEvidenceAsync(evidence, cancellationToken);
    }

    private async Task LogAuditAsync(
        ScopeContext scope,
        string actorKey,
        string eventType,
        Guid instanceId,
        CancellationToken cancellationToken)
    {
        await auditService.LogAsync(
            new AuditEvent
            {
                EventType = eventType,
                ActorUserId = actorKey.Trim(),
                ActorUserName = actorKey.Trim(),
                TenantId = scope.TenantId,
                WorkspaceId = scope.WorkspaceId,
                ProjectId = scope.ProjectId,
                DataJson = JsonSerializer.Serialize(
                    new { instanceId },
                    AuditJsonSerializationOptions.Instance),
            },
            cancellationToken);
    }

    private static RemediationInstanceRecord CloneInstance(
        RemediationInstanceRecord source,
        RemediationInstanceStatus? status = null,
        Guid? preflightSnapshotId = null,
        string? preflightResultJson = null,
        Guid? executionSnapshotId = null,
        Guid? verificationSnapshotId = null,
        Guid? waveId = null,
        string? verificationResultJson = null,
        string? approvedByActorKey = null,
        DateTime? approvedUtc = null,
        DateTime? executedUtc = null,
        DateTime? verifiedUtc = null,
        DateTime? closedUtc = null,
        DateTime? updatedUtc = null) =>
        new()
        {
            InstanceId = source.InstanceId,
            TenantId = source.TenantId,
            WorkspaceId = source.WorkspaceId,
            ProjectId = source.ProjectId,
            FindingId = source.FindingId,
            PatternId = source.PatternId,
            PatternVersionId = source.PatternVersionId,
            PatternKey = source.PatternKey,
            FrozenPatternVersion = source.FrozenPatternVersion,
            AutomationLevel = source.AutomationLevel,
            Status = status ?? source.Status,
            CloudResourceId = source.CloudResourceId,
            AssessmentId = source.AssessmentId,
            ControlId = source.ControlId,
            PreflightSnapshotId = preflightSnapshotId ?? source.PreflightSnapshotId,
            ExecutionSnapshotId = executionSnapshotId ?? source.ExecutionSnapshotId,
            VerificationSnapshotId = verificationSnapshotId ?? source.VerificationSnapshotId,
            WaveId = waveId ?? source.WaveId,
            PreflightResultJson = preflightResultJson ?? source.PreflightResultJson,
            VerificationResultJson = verificationResultJson ?? source.VerificationResultJson,
            CreatedByActorKey = source.CreatedByActorKey,
            ApprovedByActorKey = approvedByActorKey ?? source.ApprovedByActorKey,
            CreatedUtc = source.CreatedUtc,
            UpdatedUtc = updatedUtc ?? source.UpdatedUtc,
            ApprovedUtc = approvedUtc ?? source.ApprovedUtc,
            ExecutedUtc = executedUtc ?? source.ExecutedUtc,
            VerifiedUtc = verifiedUtc ?? source.VerifiedUtc,
            ClosedUtc = closedUtc ?? source.ClosedUtc,
        };

    private static RemediationInstanceOperationResult Succeeded(Guid instanceId, RemediationInstanceStatus status) =>
        new() { Succeeded = true, InstanceId = instanceId, Status = status };

    private static RemediationInstanceOperationResult Failed(string message) =>
        new() { Succeeded = false, ErrorMessage = message };

    private static RemediationInstanceOperationResult Blocked(params string[] blockers) =>
        new() { Succeeded = false, Blockers = blockers, ErrorMessage = blockers.FirstOrDefault() };
}
