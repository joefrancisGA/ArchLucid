using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Manifest;

namespace ArchLucid.Application.Evidence;

/// <summary>
///     Maps a committed <see cref="GoldenManifest" /> contract into bounded
///     <see cref="PriorManifestEvidence" /> summaries for agent packages (no manifest payload dump).
/// </summary>
public static class PriorManifestEvidenceMapper
{
    private const int MaxChangeDescriptionChars = 240;

    /// <summary>
    ///     Builds prior-manifest evidence from <paramref name="manifest" /> using version labels,
    ///     names, and merged required-control hints only.
    /// </summary>
    public static PriorManifestEvidence Map(GoldenManifest manifest)
    {
        ArgumentNullException.ThrowIfNull(manifest);
        ArgumentNullException.ThrowIfNull(manifest.Metadata);
        ArgumentNullException.ThrowIfNull(manifest.Governance);

        string manifestVersion = string.IsNullOrWhiteSpace(manifest.Metadata.ManifestVersion)
            ? string.Empty
            : manifest.Metadata.ManifestVersion.Trim();

        string systemLabel = string.IsNullOrWhiteSpace(manifest.SystemName)
            ? "Unknown system"
            : manifest.SystemName.Trim();

        IReadOnlyList<ManifestService> services = manifest.Services;
        IReadOnlyList<ManifestDatastore> datastores = manifest.Datastores;

        string summary = BuildSummary(systemLabel, manifestVersion, services, datastores, manifest.Metadata);

        HashSet<string> requiredControls = new(StringComparer.Ordinal);

        foreach (string c in manifest.Governance.RequiredControls.Where(c => !string.IsNullOrWhiteSpace(c)))
            requiredControls.Add(c.Trim());

        foreach (ManifestService service in services)
        {
            foreach (string c in service.RequiredControls.Where(c => !string.IsNullOrWhiteSpace(c)))
            {
                requiredControls.Add(c.Trim());
            }
        }

        return new PriorManifestEvidence
        {
            ManifestVersion = manifestVersion,
            Summary = summary,
            ExistingServices = DistinctSortedNames(
                services.Where(s => !string.IsNullOrWhiteSpace(s.ServiceName))
                    .Select(s => s.ServiceName)),
            ExistingDatastores = DistinctSortedNames(
                datastores.Where(d => !string.IsNullOrWhiteSpace(d.DatastoreName))
                    .Select(d => d.DatastoreName)),
            ExistingRequiredControls = requiredControls.OrderBy(x => x, StringComparer.Ordinal).ToList()
        };
    }

    private static string BuildSummary(
        string systemLabel,
        string manifestVersion,
        IReadOnlyList<ManifestService> services,
        IReadOnlyList<ManifestDatastore> datastores,
        ManifestMetadata metadata)
    {
        string versionPart = string.IsNullOrEmpty(manifestVersion) ? "(no version label)" : manifestVersion;
        string baseSummary = FormattableString.Invariant(
            $"{systemLabel} committed manifest {versionPart} ({services.Count} services, {datastores.Count} datastores).");

        if (string.IsNullOrWhiteSpace(metadata.ChangeDescription))
            return baseSummary;

        string change = metadata.ChangeDescription.Trim();

        if (change.Length > MaxChangeDescriptionChars)
            change = change.Substring(0, MaxChangeDescriptionChars) + "…";

        return baseSummary + " Change note: " + change;
    }

    private static List<string> DistinctSortedNames(IEnumerable<string> names)
    {
        return names
            .Select(n => n.Trim())
            .Where(n => n.Length > 0)
            .Distinct(StringComparer.Ordinal)
            .OrderBy(n => n, StringComparer.Ordinal)
            .ToList();
    }
}
