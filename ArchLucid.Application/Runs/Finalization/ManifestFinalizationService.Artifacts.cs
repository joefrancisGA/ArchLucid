using System.Data;
using System.Text.Json;

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

    private static CommittedEffectiveGovernanceSnapshotCaptureOptions? BuildGovernanceSnapshotCaptureOptions(ManifestFinalizationRequest request)
    {
        if (request.PreloadedScopePolicyPackAssignments is null)
            return null;

        return new CommittedEffectiveGovernanceSnapshotCaptureOptions
        {
            PreloadedScopePolicyPackAssignments = request.PreloadedScopePolicyPackAssignments
        };
    }

    private async Task<ManifestDocument> PersistPipelineArtifactsForFinalizationAsync(
        ScopeContext scope,
        ManifestFinalizationRequest request,
        CancellationToken cancellationToken,
        IDbConnection? connection = null,
        IDbTransaction? transaction = null)
    {
        if (request.SkipPersistingPipelineArtifacts)
            return request.ManifestModel;

        await decisionTraceRepository.SaveAsync(
            DecisionTraceRecordMapper.ToDto(request.Trace),
            cancellationToken,
            connection,
            transaction);
        await _committedEffectiveGovernanceSnapshotCapturer.ApplyToManifestAsync(
            request.ManifestModel,
            BuildGovernanceSnapshotCaptureOptions(request),
            cancellationToken);

        if (request.PreloadedArchitectureRequest is not null && request.PreloadedFindingsSnapshot is not null)
        {
            _committedReviewStandardsSnapshotCapturer.ApplyToManifest(
                request.ManifestModel,
                request.PreloadedArchitectureRequest,
                request.PreloadedFindingsSnapshot);
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
