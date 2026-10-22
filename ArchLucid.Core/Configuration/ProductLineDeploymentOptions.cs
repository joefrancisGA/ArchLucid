using ArchLucid.Core.ProductLine;

namespace ArchLucid.Core.Configuration;

/// <summary>
///     Host deployment product-line default (<c>ProductLine:Deployment</c>). Local dual-UI stays <c>both</c>
///     so one API process serves Architecture and SecureNow shells.
/// </summary>
public sealed class ProductLineDeploymentOptions
{
    public const string SectionName = "ProductLine";

    /// <summary><c>architecture</c>, <c>security</c>, or <c>both</c> (default).</summary>
    public string Deployment { get; set; } = "both";

    public ProductLineDeploymentKind ResolveDeploymentKind()
    {
        if (TryParseDeploymentKind(Deployment, out ProductLineDeploymentKind kind))
        {
            return kind;
        }

        return ProductLineDeploymentKind.Both;
    }

    public static bool TryParseDeploymentKind(string? raw, out ProductLineDeploymentKind kind)
    {
        if (string.IsNullOrWhiteSpace(raw))
        {
            kind = ProductLineDeploymentKind.Both;

            return false;
        }

        string trimmed = raw.Trim();

        if (string.Equals(trimmed, "architecture", StringComparison.OrdinalIgnoreCase))
        {
            kind = ProductLineDeploymentKind.Architecture;

            return true;
        }

        if (string.Equals(trimmed, "security", StringComparison.OrdinalIgnoreCase))
        {
            kind = ProductLineDeploymentKind.Security;

            return true;
        }

        if (string.Equals(trimmed, "both", StringComparison.OrdinalIgnoreCase))
        {
            kind = ProductLineDeploymentKind.Both;

            return true;
        }

        kind = ProductLineDeploymentKind.Both;

        return false;
    }
}
