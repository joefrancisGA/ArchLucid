using ArchLucid.Contracts.Architecture;

namespace ArchLucid.Application.Exports.ArchitectureReviewBoard;

/// <summary>
///     Resolves manifest version for board exports. When a manifest is present, metadata is authoritative so a
///     whitespace-only stored version is not replaced by the run header stamp.
/// </summary>
internal static class ArchitectureReviewBoardExportManifestVersionResolver
{
    internal static string? Resolve(ArchitectureRunDetail detail)
    {
        ArgumentNullException.ThrowIfNull(detail);

        if (detail.Manifest?.Metadata is { } metadata)
        {
            string? fromMetadata = metadata.ManifestVersion;

            if (string.IsNullOrWhiteSpace(fromMetadata))
                return null;

            return fromMetadata.Trim();
        }

        string? fromRun = detail.Run.CurrentManifestVersion;

        if (string.IsNullOrWhiteSpace(fromRun))
            return null;

        return fromRun.Trim();
    }
}
