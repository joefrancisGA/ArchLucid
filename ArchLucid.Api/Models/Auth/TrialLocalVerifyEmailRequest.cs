using System.Diagnostics.CodeAnalysis;

namespace ArchLucid.Api.Models.Auth;

[ExcludeFromCodeCoverage(Justification = "API request/response DTO; auto-properties only.")]
public sealed class TrialLocalVerifyEmailRequest
{
    public string? Email
    {
        get;
        set;
    }

    public string? Token
    {
        get;
        set;
    }
}
