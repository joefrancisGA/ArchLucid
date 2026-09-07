namespace ArchLucid.Decisioning.Governance.PolicyPacks;

/// <summary>
///     Maps graph actor security engines to declaration theme tokens for pack gating (DX-39).
/// </summary>
internal static class GraphSecurityEnginePolicyThemeMap
{
    // External exposure and trust-boundary both model perimeter / NSG / public-actor segmentation → network-isolation.
    // Privileged-access models internal human / workload principals → workload-isolation.
    internal static bool TryGetTheme(string engineType, out string theme)
    {
        if (string.Equals(engineType, "external-exposure", StringComparison.OrdinalIgnoreCase)
            || string.Equals(engineType, "trust-boundary", StringComparison.OrdinalIgnoreCase))
        {
            theme = "network-isolation";
            return true;
        }

        if (string.Equals(engineType, "privileged-access", StringComparison.OrdinalIgnoreCase))
        {
            theme = "workload-isolation";
            return true;
        }

        theme = string.Empty;
        return false;
    }
}
