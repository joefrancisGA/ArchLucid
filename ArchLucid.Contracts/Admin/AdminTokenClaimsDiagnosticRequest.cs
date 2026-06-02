namespace ArchLucid.Contracts.Admin;

/// <summary>Admin-only request to evaluate JWT role claims without validating the token signature.</summary>
public sealed class AdminTokenClaimsDiagnosticRequest
{
    /// <summary>Raw JWT or <c>Bearer &lt;jwt&gt;</c> string. Never logged or persisted.</summary>
    public string BearerToken
    {
        get;
        set;
    } = string.Empty;
}
