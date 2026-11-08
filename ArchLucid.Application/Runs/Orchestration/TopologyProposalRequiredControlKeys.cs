namespace ArchLucid.Application.Runs.Orchestration;

internal static class TopologyProposalRequiredControlKeys
{
    internal static string NormalizeKey(string control)
    {
        if (string.IsNullOrWhiteSpace(control))
            return string.Empty;

        string[] segments = control.Trim().Split((char[]?)null, StringSplitOptions.RemoveEmptyEntries);

        return segments.Length == 0 ? string.Empty : string.Join(' ', segments);
    }
}
