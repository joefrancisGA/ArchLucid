using System.Diagnostics.CodeAnalysis;

namespace ArchLucid.Api.Controllers.Admin;

/// <summary>Body for <c>POST /v1/admin/runs/archive-batch</c>.</summary>
[ExcludeFromCodeCoverage(Justification = "API request/response DTO; auto-properties only.")]
public sealed class AdminArchiveRunsBatchRequest
{
    /// <summary>Runs with <c>CreatedUtc</c> strictly before this instant are soft-archived.</summary>
    public DateTimeOffset CreatedBeforeUtc
    {
        get;
        set;
    }
}
