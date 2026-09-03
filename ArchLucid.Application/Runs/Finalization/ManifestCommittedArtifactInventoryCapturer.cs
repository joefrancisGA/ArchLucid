using System.Security.Cryptography;
using System.Text;

using ArchLucid.Core.Manifest;
using ArchLucid.Core.Manifest.Sections;
using ArchLucid.Decisioning.Interfaces;

namespace ArchLucid.Application.Runs.Finalization;

/// <summary>
///     Wave-13 suggestion 124: seal immutable artifact inventory rows on the committed manifest.
/// </summary>
public static class ManifestCommittedArtifactInventoryCapturer
{
    public static void ApplyToManifest(ManifestDocument manifest, ManifestFinalizationRequest request)
    {
        ArgumentNullException.ThrowIfNull(manifest);
        ArgumentNullException.ThrowIfNull(request);

        DateTime capturedUtc = manifest.CreatedUtc;
        List<CommittedArtifactInventoryEntry> rows =
        [
            CreateEntry(
                "golden-manifest",
                "application/vnd.archlucid.golden-manifest+json",
                HashContentId(request.Contract.Metadata.ManifestVersion),
                "ManifestFinalizationService",
                capturedUtc),
            CreateEntry(
                "findings-snapshot",
                "application/vnd.archlucid.findings-snapshot+json",
                HashContentId(request.ExpectedFindingsSnapshotId.ToString("D")),
                "ManifestFinalizationService",
                capturedUtc),
            CreateEntry(
                "decision-trace",
                "application/vnd.archlucid.decision-trace+json",
                HashContentId(request.Keying.DecisionTraceId.ToString("D")),
                "ManifestFinalizationService",
                capturedUtc),
        ];

        if (request.ExpectedArtifactBundleId is Guid bundleId)
        {
            rows.Add(
                CreateEntry(
                    "artifact-bundle",
                    "application/vnd.archlucid.artifact-bundle+json",
                    HashContentId(bundleId.ToString("D")),
                    "ManifestFinalizationService",
                    capturedUtc));
        }

        manifest.CommittedArtifactInventory = rows
            .OrderBy(static row => row.ArtifactName, StringComparer.Ordinal)
            .ToList();
    }

    private static CommittedArtifactInventoryEntry CreateEntry(
        string artifactName,
        string contentType,
        string contentHashSha256,
        string producer,
        DateTime capturedUtc) =>
        new()
        {
            ArtifactName = artifactName,
            ContentType = contentType,
            ContentHashSha256 = contentHashSha256,
            Producer = producer,
            CapturedUtc = capturedUtc,
        };

    private static string HashContentId(string contentId) =>
        Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(contentId)));
}
