using System.Data;
using System.Text.Json;

using ArchLucid.Application;
using ArchLucid.Application.Governance;
using ArchLucid.Contracts.Findings;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Integration;
using ArchLucid.Core.Runs.Finalization;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.DecisionTraces;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Decisioning.Models;
using ArchLucid.Persistence.Interfaces;

namespace ArchLucid.Application.Runs.Finalization;

public sealed partial class ManifestFinalizationService
{
    /// <summary>
    ///     Emits one durable audit row per superseded golden manifest (repository performs SQL transition; application owns audit semantics).
    /// </summary>
    private async Task EmitManifestSupersededAuditsAsync(
        ScopeContext scope,
        ManifestFinalizationRequest request,
        IReadOnlyList<Guid> supersededManifestIds,
        Guid supersedingManifestId,
        CancellationToken cancellationToken)
    {
        if (supersededManifestIds is null || supersededManifestIds.Count == 0)
            return;

        foreach (Guid supersededManifestId in supersededManifestIds)
        {
            string dataJson = JsonSerializer.Serialize(
                new
                {
                    supersedingManifestId,
                    runId = request.RunId,
                    reason = "unreferenced_after_finalize"
                },
                IntegrationEventJson.Options);

            AuditEvent auditEvent = scope.CreateAuditEvent(
                AuditEventTypes.ManifestSuperseded,
                request.ActorUserId,
                request.ActorUserName,
                dataJson);
            auditEvent.RunId = request.RunId;
            auditEvent.ManifestId = supersededManifestId;

            await auditService.LogAsync(auditEvent, cancellationToken);
        }
    }

    private static CommittedEffectiveGovernanceSnapshotCaptureOptions BuildGovernanceSnapshotCaptureOptions(
        ManifestFinalizationRequest request)
    {
        if (request.PreloadedScopePolicyPackAssignments is null)
        {
            throw new ConflictException(
                "Finalization blocked: pin-derived policy pack assignments are required.");
        }

        return new CommittedEffectiveGovernanceSnapshotCaptureOptions
        {
            PreloadedScopePolicyPackAssignments = request.PreloadedScopePolicyPackAssignments,
            PinnedFocusedPilotModeEnabled = request.PinnedFocusedPilotModeEnabled,
            PinnedFocusedPilotCloudProvider = request.PinnedFocusedPilotCloudProvider,
        };
    }

    private async Task<ManifestDocument> PersistPipelineArtifactsForFinalizationAsync(
        ScopeContext scope,
        ManifestFinalizationRequest request,
        CancellationToken cancellationToken,
        IDbConnection? connection = null,
        IDbTransaction? transaction = null)
    {
        ManifestCommittedArtifactInventoryMaterial inventoryMaterial =
            ManifestCommittedArtifactInventoryMaterialFactory.Build(request);
        ManifestCommittedArtifactInventoryCapturer.ApplyToManifest(
            request.ManifestModel,
            inventoryMaterial,
            request.ManifestModel.CreatedUtc);

        await _committedEffectiveGovernanceSnapshotCapturer.ApplyToManifestAsync(
            request.ManifestModel,
            BuildGovernanceSnapshotCaptureOptions(request),
            cancellationToken);

        if (request.PreloadedArchitectureRequest is null || request.PreloadedFindingsSnapshot is null)
        {
            throw new ConflictException(
                "Finalization blocked: review standards snapshot requires preloaded architecture request and findings snapshot.");
        }

        _committedReviewStandardsSnapshotCapturer.ApplyToManifest(
            request.ManifestModel,
            request.PreloadedArchitectureRequest,
            request.PreloadedFindingsSnapshot);

        ManifestDecisionReceiptHashCapturer.ApplyToManifest(
            request.ManifestModel,
            request.RunId,
            request.Contract.Metadata.ManifestVersion,
            manifestHashService);

        await decisionTraceRepository.SaveAsync(
            DecisionTraceRecordMapper.ToDto(request.Trace),
            cancellationToken,
            connection,
            transaction);

        ManifestCommittedArtifactInventoryCapturer.EnsureDecisionTraceInventoryMaterialOrThrow(
            inventoryMaterial,
            request.RunId.ToString("N"));

        if (request.SkipPersistingPipelineArtifacts)
        {
            if (connection is not null)
            {
                return await goldenManifestRepository.SaveAsync(
                    request.Contract,
                    scope,
                    request.Keying,
                    manifestHashService,
                    cancellationToken,
                    connection,
                    transaction,
                    request.ManifestModel);
            }

            return await goldenManifestRepository.SaveAsync(
                request.Contract,
                scope,
                request.Keying,
                manifestHashService,
                cancellationToken,
                authorityPersistBody: request.ManifestModel);
        }

        if (connection is not null)
        {
            return await goldenManifestRepository.SaveAsync(
                request.Contract,
                scope,
                request.Keying,
                manifestHashService,
                cancellationToken,
                connection,
                transaction,
                request.ManifestModel);
        }

        return await goldenManifestRepository.SaveAsync(
            request.Contract,
            scope,
            request.Keying,
            manifestHashService,
            cancellationToken,
            authorityPersistBody: request.ManifestModel);
    }

    private async Task EnsureFindingsSnapshotFinalizableAsync(
        Guid findingsSnapshotId,
        FindingsSnapshot? preloadedSnapshot,
        CancellationToken cancellationToken)
    {
        FindingsSnapshot? snapshot = preloadedSnapshot;

        if (snapshot is null)
        {
            ScopeContext scope = scopeContextProvider.GetCurrentScope();
            snapshot = await findingsSnapshotRepository.GetByIdAsync(scope, findingsSnapshotId, cancellationToken);
        }

        if (snapshot is null)
            throw new InvalidOperationException($"Findings snapshot '{findingsSnapshotId:D}' was not found for finalization.");

        if (snapshot.GenerationStatus is FindingsSnapshotGenerationStatus.Generating or FindingsSnapshotGenerationStatus.Failed)
            throw new InvalidOperationException(
                $"Findings snapshot '{findingsSnapshotId:D}' is not eligible for finalization (GenerationStatus={snapshot.GenerationStatus}).");
    }
}
