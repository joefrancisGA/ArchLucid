using ArchLucid.Contracts.Diagnostics;

namespace ArchLucid.Host.Composition.Services.Probes;

internal static class WorkspaceAiAvailabilityProbeResponses
{
    internal static WorkspaceAiAvailabilityResponse Unavailable(
        string aiSource,
        string summary,
        List<WorkspaceAiAvailabilityCheckRow> checks,
        Dictionary<string, string> debug,
        DateTime asOfUtc) =>
        new()
        {
            IsAvailable = false,
            Validated = true,
            AiSource = aiSource,
            Summary = summary,
            AsOfUtc = asOfUtc,
            Checks = checks,
            Debug = debug,
        };

    internal static string TryHost(string endpoint)
    {
        if (!Uri.TryCreate(endpoint.Trim(), UriKind.Absolute, out Uri? uri))
        {
            return "(invalid-uri)";
        }

        return uri.Host;
    }
}
