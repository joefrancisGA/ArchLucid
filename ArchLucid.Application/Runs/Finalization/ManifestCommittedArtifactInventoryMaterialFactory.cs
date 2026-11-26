using System.Text;
using System.Text.Json;

using ArchLucid.Application;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Manifest;
using ArchLucid.Contracts.Persistence.Artifacts;
using ArchLucid.Contracts.Persistence.DecisionTraces;
using ArchLucid.Core.Findings.Serialization;
using ArchLucid.Decisioning.DecisionTraces;
using ArchLucid.Decisioning.Interfaces;

namespace ArchLucid.Application.Runs.Finalization;

/// <summary>
///     Wave-14 suggestion 133 / wave-15 suggestion 142: build canonical UTF-8 artifact bytes for inventory hashing.
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

        ArtifactBundle? bundle = null;
        if (request.ExpectedArtifactBundleId is Guid bundleId)
        {
            bundle = request.PreloadedArtifactBundle
                ?? throw new ConflictException(
                    "Finalization blocked: artifact bundle bytes are required to seal committed artifact inventory.");

            if (bundle.BundleId != bundleId)
            {
                throw new ConflictException(
                    "Finalization blocked: preloaded artifact bundle id does not match the expected bundle id.");
            }
        }

        return Build(
            request.Contract, request.PreloadedFindingsSnapshot, DecisionTraceRecordMapper.ToDto(request.Trace), bundle);
    }

    internal static ManifestCommittedArtifactInventoryMaterial Build(
        GoldenManifest contract,
        FindingsSnapshot findingsSnapshot,
        DecisionTraceDto trace,
        ArtifactBundle? bundle)
    {
        byte[] goldenManifestUtf8 = Encoding.UTF8.GetBytes(JsonSerializer.Serialize(contract, ContractJson.Default));
        byte[] findingsSnapshotUtf8 = Encoding.UTF8.GetBytes(FindingsSerialization.SerializeSnapshot(findingsSnapshot));
        byte[] decisionTraceUtf8 = Encoding.UTF8.GetBytes(JsonSerializer.Serialize(trace, ContractJson.Default));
        byte[]? artifactBundleUtf8 = bundle is null
            ? null
            : ManifestCommittedArtifactInventoryBundleMaterialSerializer.SerializeCanonicalUtf8(bundle);

        return new ManifestCommittedArtifactInventoryMaterial
        {
            GoldenManifestUtf8 = goldenManifestUtf8,
            FindingsSnapshotUtf8 = findingsSnapshotUtf8,
            DecisionTraceUtf8 = decisionTraceUtf8,
            ArtifactBundleUtf8 = artifactBundleUtf8,
        };
    }
}
