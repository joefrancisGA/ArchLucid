using System.Text.Json;

using ArchLucid.Application.Integration;
using ArchLucid.Contracts.Common;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Integration;
using ArchLucid.Core.Runs;
using ArchLucid.Core.Runs.Finalization;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Transactions;
using ArchLucid.Decisioning.DecisionTraces;
using ArchLucid.Decisioning.Models;
using ArchLucid.Persistence.IntegrationOutbox;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Models;

namespace ArchLucid.Application.Runs.Finalization;

public sealed partial class ManifestFinalizationService
{
    private async Task<ManifestFinalizationResult> FinalizeLegacyAsync(ScopeContext scope, ManifestFinalizationRequest request, IArchLucidUnitOfWork uow,
        CancellationToken cancellationToken)
    {
        RunRecord? header = await runRepository.GetByIdAsync(scope, request.RunId, cancellationToken);

        if (header is null)
            throw new RunNotFoundException(request.RunId.ToString("N"));

        if (string.Equals(header.LegacyRunStatus, nameof(ArchitectureRunStatus.Committed), StringComparison.OrdinalIgnoreCase))
        {
            if (header.GoldenManifestId is not { } mid)
                throw new ConflictException($"Run '{request.RunId:D}' is Committed but GoldenManifestId is missing on the run record.");
            await uow.CommitAsync(cancellationToken);
            return new ManifestFinalizationResult(mid, true, header.CurrentManifestVersion ?? string.Empty, null);
        }

        RunStateTransitionEnforcement.EnsureCommitAllowedLegacy(_runStateTransitionService, request.RunId, header.LegacyRunStatus);

        if (!ArchitectureRunStatusTransitionTable.TryParseStatus(header.LegacyRunStatus, out ArchitectureRunStatus currentStatus))
            throw new InvalidOperationException($"Run '{request.RunId:D}' has an unrecognized LegacyRunStatus '{header.LegacyRunStatus}'.");

        ArchitectureRunStatusTransitionTable.AssertLegal(
            currentStatus,
            ArchitectureRunStatusLifecycleEvent.CommitFinalized,
            ArchitectureRunStatus.Committed);

        if (header.FindingsSnapshotId is null || header.FindingsSnapshotId.Value != request.ExpectedFindingsSnapshotId)
            throw new InvalidOperationException("Findings snapshot on the run record does not match the expected findings for finalization.");
        await EnsureFindingsSnapshotFinalizableAsync(request.ExpectedFindingsSnapshotId, request.PreloadedFindingsSnapshot, cancellationToken);

        if (request.ExpectedArtifactBundleId is { } expectedBundle)
        {
            if (header.ArtifactBundleId is null || header.ArtifactBundleId.Value != expectedBundle)
                throw new InvalidOperationException("Artifact bundle on the run record does not match the expected bundle for finalization.");
        }

        ManifestDocument persisted = await PersistPipelineArtifactsForFinalizationAsync(scope, request, cancellationToken);
        RuleAuditTracePayload audit = request.Trace.RequireRuleAudit();
        header.LegacyRunStatus = nameof(ArchitectureRunStatus.Committed);
        header.CurrentManifestVersion = request.Contract.Metadata.ManifestVersion;
        header.GoldenManifestId = persisted.ManifestId;
        header.DecisionTraceId = audit.DecisionTraceId;
        header.CompletedUtc ??= TimeProvider.System.UtcNowDateTime();
        await runRepository.UpdateAsync(header, cancellationToken);

        AuditEvent finalized = scope.CreateAuditEvent(
            AuditEventTypes.ManifestFinalized,
            request.ActorUserId,
            request.ActorUserName,
            JsonSerializer.Serialize(
                new
                {
                    manifestVersion = request.Contract.Metadata.ManifestVersion,
                    findingsSnapshotId = request.ExpectedFindingsSnapshotId,
                    artifactBundleId = request.ExpectedArtifactBundleId,
                    decisionTraceId = audit.DecisionTraceId
                }, IntegrationEventJson.Options));
        finalized.RunId = request.RunId;
        finalized.ManifestId = persisted.ManifestId;
        finalized.CorrelationId = request.CorrelationId;

        await DurableAuditLogRetry.LogOrThrowAsync(
            ct => auditService.LogAsync(finalized, ct),
            _logger,
            $"ManifestFinalized:{request.RunId:N}",
            cancellationToken,
            auditEventTypeForMetrics: AuditEventTypes.ManifestFinalized);
        string? verifiedManifestHash = await RunIntegrationEventManifestHashResolver.TryResolveVerifiedManifestHashAsync(
            request.RunId,
            scope,
            _authorityQueryService,
            _manifestHashService,
            cancellationToken);
        object outboxPayload = new
        {
            schemaVersion = 1,
            runId = request.RunId,
            manifestId = persisted.ManifestId,
            manifestHash = verifiedManifestHash,
            decisionTraceId = audit.DecisionTraceId,
            tenantId = scope.TenantId,
            workspaceId = scope.WorkspaceId,
            projectId = scope.ProjectId,
            findingsSnapshotId = request.ExpectedFindingsSnapshotId,
            artifactBundleId = request.ExpectedArtifactBundleId,
            manifestVersion = request.Contract.Metadata.ManifestVersion
        };
        byte[] utf8 = JsonSerializer.SerializeToUtf8Bytes(outboxPayload, IntegrationEventJson.Options);
        string messageId = $"{request.RunId:N}:{IntegrationEventTypes.ManifestFinalizedV1}";
        await integrationEventOutbox.EnqueueAsync(request.RunId, IntegrationEventTypes.ManifestFinalizedV1, messageId, utf8, scope.TenantId, scope.WorkspaceId,
            scope.ProjectId, cancellationToken);
        await uow.CommitAsync(cancellationToken);

        IReadOnlyList<Guid> supersededManifestIds =
            await goldenManifestRepository.SupersedeUnreferencedActiveGoldenManifestsAsync(scope, persisted.ManifestId, null, null, cancellationToken);

        await EmitManifestSupersededAuditsAsync(scope, request, supersededManifestIds, persisted.ManifestId, cancellationToken);

        return new ManifestFinalizationResult(persisted.ManifestId, false, request.Contract.Metadata.ManifestVersion, persisted);
    }
}
