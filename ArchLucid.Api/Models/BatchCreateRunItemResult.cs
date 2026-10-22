namespace ArchLucid.Api.Models;

/// <summary>Single item result within <see cref="BatchCreateRunResponse" />.</summary>
public sealed class BatchCreateRunItemResult
{
    /// <summary>Original <c>RequestId</c> from the input item, when present.</summary>
    public string? RequestId { get; init; }

    /// <summary>Assigned run identifier, set when <see cref="Succeeded" /> is <c>true</c>.</summary>
    public string? RunId { get; init; }

    /// <summary>Whether the run was created successfully.</summary>
    public bool Succeeded { get; init; }

    /// <summary>Problem type code when <see cref="Succeeded" /> is <c>false</c>.</summary>
    public string? ErrorCode { get; init; }

    /// <summary>Human-readable error description when <see cref="Succeeded" /> is <c>false</c>.</summary>
    public string? ErrorMessage { get; init; }
}
