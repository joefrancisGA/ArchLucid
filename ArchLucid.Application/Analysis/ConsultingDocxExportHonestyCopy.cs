namespace ArchLucid.Application.Analysis;

/// <summary>
///     Shared omission copy for consulting DOCX and aligned markdown exports.
/// </summary>
internal static class ConsultingDocxExportHonestyCopy
{
    internal const string SystemNameNotStored = "System name was not stored.";

    internal const string CommittedManifestNotStored = "Committed manifest was not stored.";

    internal const string ManifestServiceCountNotStored = "Service count was not stored.";

    internal const string ManifestDatastoreCountNotStored = "Datastore count was not stored.";

    internal const string ManifestRequiredControlCountNotStored = "Required control count was not stored.";

    internal const string ManifestVersionNotStored = "Manifest version was not stored.";

    internal const string RequestIdNotStored = "Request ID was not stored.";

    internal const string ConclusionsWithoutManifest =
        "Conclusions were not stored because a committed manifest was not available for this run.";

    internal static string ResolveSystemName(string? evidenceSystemName, string? manifestSystemName)
    {
        string? trimmed = evidenceSystemName?.Trim();

        if (!string.IsNullOrWhiteSpace(trimmed))
        {
            return trimmed!;
        }

        trimmed = manifestSystemName?.Trim();

        return !string.IsNullOrWhiteSpace(trimmed) ? trimmed! : SystemNameNotStored;
    }

    internal static string ResolveSystemName(ArchitectureAnalysisReport report) =>
        ResolveSystemName(report.Evidence?.SystemName, report.Manifest?.SystemName);

    internal static string ResolveRequestId(string? requestId) =>
        string.IsNullOrWhiteSpace(requestId) ? RequestIdNotStored : requestId.Trim();

    internal static string ResolveManifestVersionLabel(string? manifestVersion) =>
        string.IsNullOrWhiteSpace(manifestVersion) ? ManifestVersionNotStored : manifestVersion.Trim();
}
