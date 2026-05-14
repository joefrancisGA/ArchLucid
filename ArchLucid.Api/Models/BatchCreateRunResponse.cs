namespace ArchLucid.Api.Models;

/// <summary>Response envelope for <c>POST /v1/architecture/request/batch</c>.</summary>
public sealed class BatchCreateRunResponse
{
    /// <summary>Per-item results, one entry per input request (same order).</summary>
    public IReadOnlyList<BatchCreateRunItemResult> Items { get; init; } = [];
}
