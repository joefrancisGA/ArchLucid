using System.Diagnostics.CodeAnalysis;

namespace ArchLucid.Api.Models;

[ExcludeFromCodeCoverage(Justification = "API request/response DTO; no business logic.")]
public sealed class ApproveGovernanceRequest
{
    public string ReviewedBy
    {
        get;
        set;
    } = string.Empty;

    public string? ReviewComment
    {
        get;
        set;
    }
}
