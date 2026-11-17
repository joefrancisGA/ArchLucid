namespace ArchLucid.Decisioning.Analysis;

/// <summary>
///     Public-network values from ARM ("Enabled") and Terraform bools ("true").
/// </summary>
internal static class DeclarationSecurityEnabledToken
{
    public static bool IsPublicNetworkEnabled(string? value) =>
        DecisioningDeclarationTruthyToken.IsTruthy(value);
}
