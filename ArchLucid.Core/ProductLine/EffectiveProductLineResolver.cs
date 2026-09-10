namespace ArchLucid.Core.ProductLine;

/// <summary>
///     Pure resolver for OP-03 effective product line. Request headers may narrow <see cref="ProductLineDeploymentKind.Both" />
///     but cannot escalate past a single-line deployment.
/// </summary>
public static class EffectiveProductLineResolver
{
    public static EffectiveProductLineKind Resolve(
        ProductLineDeploymentKind deployment,
        string? requestHeaderValue)
    {
        if (deployment == ProductLineDeploymentKind.Both
            && TryParseRequestHeader(requestHeaderValue, out ProductLineId requestLine))
        {
            return requestLine == ProductLineId.Security
                ? EffectiveProductLineKind.Security
                : EffectiveProductLineKind.Architecture;
        }

        return deployment switch
        {
            ProductLineDeploymentKind.Architecture => EffectiveProductLineKind.Architecture,
            ProductLineDeploymentKind.Security => EffectiveProductLineKind.Security,
            _ => EffectiveProductLineKind.Both,
        };
    }

    public static bool TryParseRequestHeader(string? raw, out ProductLineId productLine)
    {
        if (string.IsNullOrWhiteSpace(raw))
        {
            productLine = default;

            return false;
        }

        string trimmed = raw.Trim();

        if (string.Equals(trimmed, "architecture", StringComparison.OrdinalIgnoreCase))
        {
            productLine = ProductLineId.Architecture;

            return true;
        }

        if (string.Equals(trimmed, "security", StringComparison.OrdinalIgnoreCase))
        {
            productLine = ProductLineId.Security;

            return true;
        }

        productLine = default;

        return false;
    }
}
