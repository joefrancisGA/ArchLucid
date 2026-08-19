namespace ArchLucid.Contracts.Admin;

/// <summary>Cached health snapshot for a single identity provider integration surface.</summary>
public sealed class AdminIdentityProviderHealthProbe
{
    public string Status
    {
        get;
        init;
    } = IdentityProviderDiagnosticsHealthStatus.NotApplicable;

    public string Summary
    {
        get;
        init;
    } = string.Empty;
}
