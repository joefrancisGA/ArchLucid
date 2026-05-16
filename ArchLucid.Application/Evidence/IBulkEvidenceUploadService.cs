using Microsoft.AspNetCore.Http;

namespace ArchLucid.Application.Evidence;

/// <summary>
///     Result of a bulk evidence upload operation.
/// </summary>
public sealed class BulkEvidenceUploadResult
{
    public bool Succeeded { get; init; }
    public string? FailureDetail { get; init; }
    public string? ErrorCode { get; init; }
    public IReadOnlyList<string> UploadedEvidenceItemIds { get; init; } = [];
}

/// <summary>
///     Service for processing bulk evidence file uploads.
/// </summary>
public interface IBulkEvidenceUploadService
{
    /// <summary>
    ///     Validates and uploads a batch of evidence files, associating them with the specified run.
    /// </summary>
    Task<BulkEvidenceUploadResult> UploadBulkEvidenceAsync(
        Guid runId,
        IFormFileCollection files,
        CancellationToken cancellationToken,
        string? correlationId = null);
}
