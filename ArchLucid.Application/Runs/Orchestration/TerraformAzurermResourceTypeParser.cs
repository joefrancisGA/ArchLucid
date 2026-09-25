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
        Match azurerm = AzurermToken().Match(trimmed);

        if (azurerm.Success)
            return azurerm.Groups[1].Value;

        Match azuread = AzureadToken().Match(trimmed);

        if (!azuread.Success)
            return null;

        return "azuread_" + azuread.Groups[1].Value;
    }
}
