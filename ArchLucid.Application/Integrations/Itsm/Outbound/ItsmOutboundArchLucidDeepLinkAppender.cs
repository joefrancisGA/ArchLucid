namespace ArchLucid.Application.Integrations.Itsm.Outbound;

/// <summary>Appends operator deep-links to outbound ITSM descriptions (<c>ArchLucid:PublicSite:BaseUrl</c>).</summary>
internal static class ItsmOutboundArchLucidDeepLinkAppender
{
    public static string AppendFindingDeepLink(string? description, string? publicBaseUrl, string runId, string findingId)
    {
        string trimmedBase = NormalizeBase(publicBaseUrl);

        if (trimmedBase.Length == 0 || string.IsNullOrWhiteSpace(runId) || string.IsNullOrWhiteSpace(findingId))
            return description ?? string.Empty;

        string r = runId.Trim();
        string f = findingId.Trim();
        string url = $"{trimmedBase}/reviews/{Uri.EscapeDataString(r)}/findings/{Uri.EscapeDataString(f)}";
        string block =
            "\n\n---\nArchLucid finding (deep link):\n" + url + "\n";

        return (description ?? string.Empty).TrimEnd() + block;
    }

    private static string NormalizeBase(string? raw)
    {
        if (string.IsNullOrWhiteSpace(raw))
            return string.Empty;

        string t = raw.Trim().TrimEnd('/');

        return t.Length == 0 ? string.Empty : t;
    }
}
