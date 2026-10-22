using ArchLucid.Contracts.Manifest;
using ArchLucid.Core.Manifest.Sections;

namespace ArchLucid.Application.Runs.Finalization;

/// <summary>
///     Wave-15 suggestion 141: project sealed inventory rows into Hasher B fingerprint rows.
/// </summary>
public static class CommittedArtifactInventoryFingerprintProjector
{
    public static IReadOnlyList<CommittedArtifactInventoryFingerprintRow> FromEntries(
        IEnumerable<CommittedArtifactInventoryEntry> entries)
    {
        ArgumentNullException.ThrowIfNull(entries);

        return entries
            .OrderBy(static row => row.ArtifactName, StringComparer.Ordinal)
            .Select(static row => new CommittedArtifactInventoryFingerprintRow(
                row.ArtifactName,
                row.ContentType,
                row.ContentHashSha256,
                row.Producer,
                row.CapturedUtc))
            .ToList();
    }
}
