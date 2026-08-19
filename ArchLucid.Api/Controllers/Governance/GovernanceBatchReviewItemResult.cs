using System.Diagnostics.CodeAnalysis;

namespace ArchLucid.Api.Controllers.Governance;

/// <summary>Per-item outcome for governance batch review.</summary>
[ExcludeFromCodeCoverage(Justification = "API request/response DTO; auto-properties only.")]
public sealed class GovernanceBatchReviewItemResult
{
    public string ApprovalRequestId
    {
        get;
        set;
    } = "";

    public bool Succeeded
    {
        get;
        set;
    }

    /// <summary>Problem type or short code when <see cref="Succeeded" /> is false.</summary>
    public string? ErrorCode
    {
        get;
        set;
    }

    public string? Message
    {
        get;
        set;
    }
}
