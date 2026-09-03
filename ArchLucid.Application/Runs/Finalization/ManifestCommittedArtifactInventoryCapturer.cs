using System.Security.Cryptography;
using System.Text;

using ArchLucid.Application;
using ArchLucid.Core.Manifest;
using ArchLucid.Core.Manifest.Sections;
using ArchLucid.Persistence.Models;

namespace ArchLucid.Application.Runs.Finalization;

/// <summary>
///     Wave-13 suggestion 124 / wave-14 suggestion 133: seal immutable artifact inventory rows on the committed manifest.
/// </summary>
public static class ManifestCommittedArtifactInventoryCapturer
{
    public static void ApplyToManifest(
        ManifestDocument manifest,
        ManifestCommittedArtifactInventoryMaterial material,
        DateTime capturedUtc)
    {
        ArgumentNullException.ThrowIfNull(manifest);
        ArgumentNullException.ThrowIfNull(material);

        List<CommittedArtifactInventoryEntry> rows =
        [
            CreateEntry(
                "golden-manifest",
                "application/vnd.archlucid.golden-manifest+json",
                HashUtf8(material.GoldenManifestUtf8),
                "ManifestFinalizationService",
                capturedUtc),
            CreateEntry(
                "findings-snapshot",
                "application/vnd.archlucid.findings-snapshot+json",
                HashUtf8(material.FindingsSnapshotUtf8),
                "ManifestFinalizationService",
                capturedUtc),
            CreateEntry(
                "decision-trace",
                "application/vnd.archlucid.decision-trace+json",
                HashUtf8(material.DecisionTraceUtf8),
                "ManifestFinalizationService",
                capturedUtc),
        ];

        if (material.ArtifactBundleUtf8 is not null)
        {
            rows.Add(
                CreateEntry(
                    "artifact-bundle",
                    "application/vnd.archlucid.artifact-bundle+json",
                    HashUtf8(material.ArtifactBundleUtf8),
                    "ManifestFinalizationService",
                    capturedUtc));
        }

        manifest.CommittedArtifactInventory = rows
            .OrderBy(static row => row.ArtifactName, StringComparer.Ordinal)
            .ToList();
    }

    /// <summary>Wave-14 suggestion 139: detect partial commits where inventory rows diverge from persisted pointers.</summary>
    public static void EnsureStoredInventoryMatchesPointersOrThrow(ManifestDocument persistedManifest, RunRecord header, string runIdLabel)
    {
        ArgumentNullException.ThrowIfNull(persistedManifest);
        ArgumentNullException.ThrowIfNull(header);
        ArgumentException.ThrowIfNullOrWhiteSpace(runIdLabel);

        if (persistedManifest.CommittedArtifactInventory.Count == 0)
        {
            throw new ConflictException(
                $"Commit recovery blocked for run '{runIdLabel}': committed manifest is missing artifact inventory rows.");
        }

        if (header.FindingsSnapshotId != persistedManifest.FindingsSnapshotId)
        {
            throw new ConflictException(
                $"Commit recovery blocked for run '{runIdLabel}': run header findings snapshot id diverges from committed manifest.");
        }

        if (header.GraphSnapshotId != persistedManifest.GraphSnapshotId)
        {
            throw new ConflictException(
                $"Commit recovery blocked for run '{runIdLabel}': run header graph snapshot id diverges from committed manifest.");
        }

        if (header.ContextSnapshotId != persistedManifest.ContextSnapshotId)
        {
            throw new ConflictException(
                $"Commit recovery blocked for run '{runIdLabel}': run header context snapshot id diverges from committed manifest.");
        }

        HashSet<string> requiredNames =
        [
            "golden-manifest",
            "findings-snapshot",
            "decision-trace",
        ];

        foreach (string requiredName in requiredNames)
        {
            if (persistedManifest.CommittedArtifactInventory.All(row =>
                    !string.Equals(row.ArtifactName, requiredName, StringComparison.Ordinal)))
            {
                throw new ConflictException(
                    $"Commit recovery blocked for run '{runIdLabel}': committed artifact inventory is missing '{requiredName}'.");
            }
        }
    }

    public static string HashUtf8(byte[] utf8) =>
        Convert.ToHexString(SHA256.HashData(utf8));

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
}
