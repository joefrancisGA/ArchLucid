using ArchLucid.Decisioning.Findings;
using ArchLucid.Decisioning.Models;

namespace ArchLucid.Decisioning.Manifest.Builders;

/// <summary>
///     Populates one manifest section from findings and/or graph snapshots.
/// </summary>
public interface IManifestSectionPopulator
{
    string SectionName { get; }

    void Populate(ManifestDocument manifest, FindingsSnapshotTypeIndex findingsByType);
}

internal static class ManifestSectionPopulatorSupport
{
    internal static void WarnSkippedFindingPayload(ManifestDocument manifest, Finding finding, string section)
    {
        manifest.Warnings.Add(
            $"Manifest section '{section}' skipped finding '{finding.FindingId}' ({finding.Title}): typed payload could not be resolved.");
    }
}
