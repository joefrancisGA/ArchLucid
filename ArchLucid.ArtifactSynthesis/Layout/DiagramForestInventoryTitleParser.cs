using ArchLucid.ArtifactSynthesis.Models;

namespace ArchLucid.ArtifactSynthesis.Layout;

/// <summary>Parses inventory-forest titles emitted by <see cref="Compilers.DiagramAstFromGraphCompiler" />.</summary>
internal static class DiagramForestInventoryTitleParser
{
    private const string Prefix = "Azure inventory (";

    public static bool TryParseMode(string title, out DiagramMode mode)
    {
        mode = default;

        if (string.IsNullOrWhiteSpace(title)
            || !title.StartsWith(Prefix, StringComparison.Ordinal))
        {
            return false;
        }

        int close = title.IndexOf(')', Prefix.Length);

        if (close < 0)
        {
            return false;
        }

        string modeToken = title[Prefix.Length..close].Trim();

        return Enum.TryParse(modeToken, ignoreCase: true, out mode);
    }

    public static bool IsSubscriptionScopedMode(DiagramMode mode)
    {
        return mode is not DiagramMode.ResourceGroup
            and not DiagramMode.SelectedResources
            and not DiagramMode.DependencyNeighborhood;
    }

    public static string ResolveSubscriptionFrameLabel(string title)
    {
        const string separator = " — ";

        if (title.Contains(separator, StringComparison.Ordinal))
        {
            string rawSuffix = title[(title.IndexOf(separator, StringComparison.Ordinal) + separator.Length)..];

            if (rawSuffix.Length == 0)
            {
                return "Subscription name was not stored.";
            }

            string suffix = rawSuffix.Trim();

            if (suffix.Length > 0)
            {
                return suffix;
            }

            return "Subscription name was stored empty.";
        }

        return "Subscription name was not stored.";
    }
}
