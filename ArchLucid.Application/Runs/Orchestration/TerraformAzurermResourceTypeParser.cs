using System.Text.RegularExpressions;

namespace ArchLucid.Application.Runs.Orchestration;

/// <summary>
/// Reads the resource type token from a Terraform source id.
/// The lookbehind keeps the token from matching inside a longer identifier.
/// <c>azurerm_</c> returns the slug. <c>azuread_</c> returns the full
/// <c>azuread_&lt;slug&gt;</c> token so it cannot collide with an azurerm slug.
/// </summary>
internal static partial class TerraformAzurermResourceTypeParser
{
    [GeneratedRegex(@"(?i)(?<![A-Za-z0-9_])azurerm_([A-Za-z0-9_]+)", RegexOptions.CultureInvariant)]
    private static partial Regex AzurermToken();

    [GeneratedRegex(@"(?i)(?<![A-Za-z0-9_])azuread_([A-Za-z0-9_]+)", RegexOptions.CultureInvariant)]
    private static partial Regex AzureadToken();

    internal static string? TryParseSlug(string? sourceId)
    {
        if (string.IsNullOrWhiteSpace(sourceId))
            return null;

        string trimmed = sourceId.Trim();
        MatchCollection azurermMatches = AzurermToken().Matches(trimmed);
        MatchCollection azureadMatches = AzureadToken().Matches(trimmed);

        Match? azurerm = azurermMatches.Count == 0 ? null : azurermMatches[azurermMatches.Count - 1];
        Match? azuread = azureadMatches.Count == 0 ? null : azureadMatches[azureadMatches.Count - 1];

        if (azurerm is null && azuread is null)
            return null;

        if (azuread is null || (azurerm is not null && azurerm.Index > azuread.Index))
            return azurerm!.Groups[1].Value;

        return "azuread_" + azuread.Groups[1].Value;
    }

    /// <summary>
    ///     Returns the root Terraform resource address suffix (e.g. <c>azurerm_app_service.main</c>)
    ///     when <paramref name="sourceId" /> is module-qualified.
    /// </summary>
    internal static string? TryParseLeafResourceAddress(string? sourceId)
    {
        if (string.IsNullOrWhiteSpace(sourceId))
            return null;

        string trimmed = sourceId.Trim();
        MatchCollection azurermMatches = AzurermToken().Matches(trimmed);
        MatchCollection azureadMatches = AzureadToken().Matches(trimmed);

        Match? azurerm = azurermMatches.Count == 0 ? null : azurermMatches[^1];
        Match? azuread = azureadMatches.Count == 0 ? null : azureadMatches[^1];

        if (azurerm is null && azuread is null)
            return null;

        int leafStart;

        if (azuread is null || (azurerm is not null && azurerm.Index > azuread.Index))
            leafStart = azurerm!.Index;
        else
            leafStart = azuread!.Index;

        string leaf = trimmed[leafStart..];

        if (leaf.IndexOf('.', StringComparison.Ordinal) < 0)
            return null;

        return leaf;
    }

    /// <summary>
    ///     Drops a trailing Terraform instance key (<c>[0]</c> or <c>[key]</c>) from a resource address.
    ///     Count and for_each addresses stay distinct until this strip; the resource address is the span before the key.
    /// </summary>
    internal static string? TryStripTrailingInstanceKey(string? terraformAddress)
    {
        if (string.IsNullOrWhiteSpace(terraformAddress))
            return null;

        string trimmed = terraformAddress.Trim();
        int bracket = trimmed.LastIndexOf('[');

        if (bracket <= 0 || trimmed[^1] != ']')
            return null;

        string resourceAddress = trimmed[..bracket];

        if (resourceAddress.IndexOf('.', StringComparison.Ordinal) < 0)
            return null;

        return resourceAddress;
    }
}
