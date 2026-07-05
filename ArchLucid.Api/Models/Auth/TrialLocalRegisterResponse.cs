using System.Diagnostics.CodeAnalysis;

namespace ArchLucid.Api.Models.Auth;

[ExcludeFromCodeCoverage(Justification = "API request/response DTO; auto-properties only.")]
public sealed class TrialLocalRegisterResponse
{
    public Guid UserId
    {
        get;
        set;
    }
}
