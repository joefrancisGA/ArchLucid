using System.Diagnostics.CodeAnalysis;

namespace ArchLucid.Api.Models.Auth;

[ExcludeFromCodeCoverage(Justification = "API request/response DTO; auto-properties only.")]
public sealed class TrialLocalRegisterRequest
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
}
