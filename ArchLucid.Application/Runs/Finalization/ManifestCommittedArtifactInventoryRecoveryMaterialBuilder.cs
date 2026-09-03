using System.Text;
using System.Text.Json;

using ArchLucid.Application;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Persistence.Artifacts;
using ArchLucid.Contracts.Persistence.DecisionTraces;
using ArchLucid.Contracts.Requests;
using ArchLucid.Core.Findings.Serialization;
using ArchLucid.Core.Manifest;
using ArchLucid.Core.Persistence.Ports;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.DecisionTraces;
using ArchLucid.Persistence.Models;

using Cm = ArchLucid.Contracts.Manifest;

namespace ArchLucid.Application.Runs.Finalization;

/// <summary>
///     Wave-16 suggestion 151: recompute committed artifact inventory bytes during commit recovery.
/// </summary>
internal static class ManifestCommittedArtifactInventoryRecoveryMaterialBuilder
{
    public static async Task<ManifestCommittedArtifactInventoryMaterial> BuildAsync(
        ScopeContext scope,
        ManifestDocument persistedManifest,
        RunRecord header,
        ArchitectureRequest request,
        IFindingsSnapshotRepository findingsSnapshotRepository,
        IDecisionTraceRepository decisionTraceRepository,
        IArtifactBundleRepository artifactBundleRepository,
        IAuthorityCommitProjectionBuilder projectionBuilder,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(scope);
        ArgumentNullException.ThrowIfNull(persistedManifest);
        ArgumentNullException.ThrowIfNull(header);
        ArgumentNullException.ThrowIfNull(request);
        ArgumentNullException.ThrowIfNull(findingsSnapshotRepository);
        ArgumentNullException.ThrowIfNull(decisionTraceRepository);
        ArgumentNullException.ThrowIfNull(artifactBundleRepository);
        ArgumentNullException.ThrowIfNull(projectionBuilder);

        if (header.FindingsSnapshotId is not Guid findingsSnapshotId)
        {
            throw new ConflictException(
                "Commit recovery blocked: findings snapshot id is required to recompute committed artifact inventory.");
        }

        FindingsSnapshot? findingsSnapshot =
            await findingsSnapshotRepository.GetByIdAsync(scope, findingsSnapshotId, cancellationToken);

        if (findingsSnapshot is null)
        {
            throw new ConflictException(
                $"Commit recovery blocked: findings snapshot '{findingsSnapshotId:D}' was not found.");
        }

        DecisionTraceDto? traceDto =
            await decisionTraceRepository.GetByIdAsync(scope, persistedManifest.DecisionTraceId, cancellationToken);

        if (traceDto is null)
        {
            throw new ConflictException(
                $"Commit recovery blocked: decision trace '{persistedManifest.DecisionTraceId:D}' was not found.");
        }

        Cm.GoldenManifest contract = await projectionBuilder.BuildAsync(
            persistedManifest,
            new AuthorityCommitProjectionInput { SystemName = request.SystemName },
            cancellationToken);

        byte[] goldenManifestUtf8 = Encoding.UTF8.GetBytes(
            JsonSerializer.Serialize(contract, ContractJson.Default));

        byte[] findingsSnapshotUtf8 = Encoding.UTF8.GetBytes(
            FindingsSerialization.SerializeSnapshot(findingsSnapshot));

        byte[] decisionTraceUtf8 = Encoding.UTF8.GetBytes(
            JsonSerializer.Serialize(traceDto, ContractJson.Default));

        byte[]? artifactBundleUtf8 = null;

        if (header.ArtifactBundleId is Guid)
        {
            ArtifactBundle? bundle = await artifactBundleRepository.GetByManifestIdAsync(
                scope,
                persistedManifest.ManifestId,
                loadArtifactBodies: true,
                cancellationToken);

            if (bundle is null)
            {
                throw new ConflictException(
                    "Commit recovery blocked: artifact bundle bytes are required to recompute committed artifact inventory.");
            }

            artifactBundleUtf8 = ManifestCommittedArtifactInventoryBundleMaterialSerializer.SerializeCanonicalUtf8(
                bundle);
        }

        return new ManifestCommittedArtifactInventoryMaterial
        {
            GoldenManifestUtf8 = goldenManifestUtf8,
            FindingsSnapshotUtf8 = findingsSnapshotUtf8,
            DecisionTraceUtf8 = decisionTraceUtf8,
            ArtifactBundleUtf8 = artifactBundleUtf8,
        };
    }
}
