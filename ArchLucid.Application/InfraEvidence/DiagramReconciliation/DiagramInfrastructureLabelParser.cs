using System.Text.RegularExpressions;

namespace ArchLucid.Application.InfraEvidence.DiagramReconciliation;

internal sealed class DiagramInfrastructureLabelProfile
{
    public string NormalizedName
    {
        get;
        init;
    } = string.Empty;

    public string? NormalizedResourceGroup
    {
        get;
        init;
    }

    public IReadOnlyList<string> TypeTokens
    {
        get;
        init;
    } = [];

    public bool ImpliesPrivateExposure
    {
        get;
        init;
    }
}

internal static class DiagramInfrastructureLabelParser
{
    private static readonly Regex ResourceGroupInParensRegex = new(
        @"\(([^)]+)\)",
        RegexOptions.Compiled | RegexOptions.CultureInvariant);

    private static readonly string[] PrivateExposureTokens =
    [
        "private",
        "internal",
        "intranet",
        "no public",
        "not public",
    ];

    public static DiagramInfrastructureLabelProfile Parse(string label)
    {
        if (string.IsNullOrWhiteSpace(label))
        {
            return new DiagramInfrastructureLabelProfile();
        }

        string trimmed = label.Trim();
        string namePart = trimmed;
        string? resourceGroup = null;

        Match match = ResourceGroupInParensRegex.Match(trimmed);

        if (match.Success)
        {
            resourceGroup = match.Groups[1].Value.Trim();
            namePart = trimmed[..match.Index].Trim();
        }

        if (string.IsNullOrWhiteSpace(namePart))
        {
            namePart = trimmed;
        }

        bool impliesPrivate = PrivateExposureTokens.Any(token =>
            trimmed.Contains(token, StringComparison.OrdinalIgnoreCase));

        return new DiagramInfrastructureLabelProfile
        {
            NormalizedName = NormalizeToken(namePart),
            NormalizedResourceGroup = string.IsNullOrWhiteSpace(resourceGroup) ? null : NormalizeToken(resourceGroup),
            TypeTokens = ExtractTypeTokens(trimmed),
            ImpliesPrivateExposure = impliesPrivate,
        };
    }

    private static IReadOnlyList<string> ExtractTypeTokens(string label)
    {
        List<string> tokens = [];
        string lower = label.ToLowerInvariant();

        if (lower.Contains("sql", StringComparison.Ordinal) || lower.Contains("database", StringComparison.Ordinal))
            tokens.Add("sql");

        if (lower.Contains("storage", StringComparison.Ordinal) || lower.Contains("blob", StringComparison.Ordinal))
            tokens.Add("storage");

        if (lower.Contains("vnet", StringComparison.Ordinal) || lower.Contains("virtual network", StringComparison.Ordinal))
            tokens.Add("vnet");

        if (lower.Contains("vm", StringComparison.Ordinal) || lower.Contains("virtual machine", StringComparison.Ordinal))
            tokens.Add("vm");

        if (lower.Contains("key vault", StringComparison.Ordinal) || lower.Contains("keyvault", StringComparison.Ordinal))
            tokens.Add("keyvault");

        if (lower.Contains("public ip", StringComparison.Ordinal) || lower.Contains("publicip", StringComparison.Ordinal))
            tokens.Add("publicip");

        if (lower.Contains("app service", StringComparison.Ordinal) || lower.Contains("web app", StringComparison.Ordinal))
            tokens.Add("appservice");

        return tokens;
    }

    private static string NormalizeToken(string value) =>
        value.Trim().ToLowerInvariant();
}
