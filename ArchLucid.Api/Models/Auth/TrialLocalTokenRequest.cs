using System.Diagnostics.CodeAnalysis;

namespace ArchLucid.Api.Models.Auth;

[ExcludeFromCodeCoverage(Justification = "API request/response DTO; auto-properties only.")]
public sealed class TrialLocalTokenRequest
{
    public string? Email
    {
        get;
        set;
    }

    public string? Password
    {
        get;
        set;
    }

    /// <summary>Ignored for token issuance — scope is fixed to platform defaults (TB-274).</summary>
    public Guid? TenantId
    {
        get;
        set;
    }

    /// <summary>Ignored for token issuance — scope is fixed to platform defaults (TB-274).</summary>
    public Guid? WorkspaceId
    {
        get;
        set;
    }

    /// <summary>Ignored for token issuance — scope is fixed to platform defaults (TB-274).</summary>
    public Guid? ProjectId
    {
        get;
        set;
    }
}
