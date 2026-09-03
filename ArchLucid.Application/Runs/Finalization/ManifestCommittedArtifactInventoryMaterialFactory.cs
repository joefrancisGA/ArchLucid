using System.Text;
using System.Text.Json;

using ArchLucid.Application;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Manifest;
using ArchLucid.Decisioning.DecisionTraces;
using ArchLucid.Decisioning.Interfaces;

namespace ArchLucid.Application.Runs.Finalization;

/// <summary>
///     Wave-14 suggestion 133: build canonical UTF-8 artifact bytes for inventory hashing.
/// </summary>
internal static class ManifestCommittedArtifactInventoryMaterialFactory
{
    public static ManifestCommittedArtifactInventoryMaterial Build(ManifestFinalizationRequest request)
    {
        ArgumentNullException.ThrowIfNull(request);

        if (request.PreloadedFindingsSnapshot is null)
        {
            throw new ConflictException(
                "Finalization blocked: findings snapshot bytes are required to seal committed artifact inventory.");
        }

        byte[] goldenManifestUtf8 = Encoding.UTF8.GetBytes(
            JsonSerializer.Serialize(request.Contract, ContractJson.Default));

        byte[] findingsSnapshotUtf8 = Encoding.UTF8.GetBytes(
            JsonSerializer.Serialize(request.PreloadedFindingsSnapshot, ContractJson.Default));

        byte[] decisionTraceUtf8 = Encoding.UTF8.GetBytes(
            JsonSerializer.Serialize(DecisionTraceRecordMapper.ToDto(request.Trace), ContractJson.Default));

        byte[]? artifactBundleUtf8 = null;

        if (request.ExpectedArtifactBundleId is Guid bundleId)
        {
            artifactBundleUtf8 = Encoding.UTF8.GetBytes(
                JsonSerializer.Serialize(new { artifactBundleId = bundleId.ToString("D") }, ContractJson.Default));
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
