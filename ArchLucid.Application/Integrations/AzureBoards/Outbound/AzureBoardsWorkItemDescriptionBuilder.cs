namespace ArchLucid.Application.Integrations.AzureBoards.Outbound;

/// <summary>Builds plain-text Azure Boards work-item descriptions with an ArchLucid deep link.</summary>
public static class AzureBoardsWorkItemDescriptionBuilder
{
    public static string Build(string? description, string? publicBaseUrl, string runId, string findingId)
    {
        string trimmedBase = NormalizeBase(publicBaseUrl);
        string body = (description ?? string.Empty).TrimEnd();

        if (trimmedBase.Length == 0 || string.IsNullOrWhiteSpace(runId) || string.IsNullOrWhiteSpace(findingId))
            return body;

        string r = runId.Trim();
        string f = findingId.Trim();
        string url = $"{trimmedBase}/reviews/{Uri.EscapeDataString(r)}/findings/{Uri.EscapeDataString(f)}";
        string block =
            "\n\n---\nArchLucid finding (deep link):\n" + url + "\n";

        return body + block;
    }

    private static string NormalizeBase(string? raw)
    {
        if (string.IsNullOrWhiteSpace(raw))
            return string.Empty;

        string trimmed = raw.Trim().TrimEnd('/');

        return trimmed.Length == 0 ? string.Empty : trimmed;
    }
}
