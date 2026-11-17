using ArchLucid.Application.Analysis;
using ArchLucid.Contracts.Architecture;

namespace ArchLucid.Application.Exports.ArchitectureReviewBoard;

/// <summary>
///     Resolves system name for board exports. When a manifest is present on the run detail, stored manifest metadata is
///     authoritative so a whitespace-only system name is not replaced by analysis evidence.
/// </summary>
internal static class ArchitectureReviewBoardExportSystemNameResolver
{
    internal static string? Resolve(ArchitectureRunDetail detail, ArchitectureAnalysisReport report)
    {
        ArgumentNullException.ThrowIfNull(detail);
        ArgumentNullException.ThrowIfNull(report);

        if (detail.Manifest is { } storedManifest)
        {
            string? fromStored = storedManifest.SystemName;

            if (string.IsNullOrWhiteSpace(fromStored))
                return null;

            return fromStored.Trim();
        }

        string? fromReportManifest = report.Manifest?.SystemName;

        if (!string.IsNullOrWhiteSpace(fromReportManifest))
            return fromReportManifest.Trim();

        string? fromEvidence = report.Evidence?.SystemName;

        if (string.IsNullOrWhiteSpace(fromEvidence))
            return null;

        return fromEvidence.Trim();
    }
}
