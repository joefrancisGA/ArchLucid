using ArchLucid.Host.Core.ProblemDetails;

namespace ArchLucid.Application.Evidence;

/// <summary>
/// Represents the result of validating a bulk evidence upload request.
/// </summary>
public sealed class BulkEvidenceUploadValidationResult
{
    public bool IsValid { get; }
    public string? ErrorCode { get; }
    public string? ErrorMessage { get; }

    private BulkEvidenceUploadValidationResult(bool isValid, string? errorCode, string? errorMessage)
    {
        IsValid = isValid;
        ErrorCode = errorCode;
        ErrorMessage = errorMessage;
    }

    public static BulkEvidenceUploadValidationResult Success() => new(true, null, null);
    public static BulkEvidenceUploadValidationResult Failure(string errorCode, string errorMessage) => new(false, errorCode, errorMessage);
}

/// <summary>
/// Validates constraints for bulk evidence upload endpoints.
/// </summary>
public sealed class BulkEvidenceUploadValidator
{
    /// <summary>
    /// Validates the uploaded file count against the configured maximum.
    /// </summary>
    public BulkEvidenceUploadValidationResult ValidateBulkUpload(int fileCount, int maxAllowed)
    {
        if (fileCount <= 0)
        {
            return BulkEvidenceUploadValidationResult.Failure(ProblemErrorCodes.ValidationFailed, "At least 1 file is required.");
        }

        if (fileCount > maxAllowed)
        {
            return BulkEvidenceUploadValidationResult.Failure(ProblemErrorCodes.EvidenceBulkUploadLimitExceeded, $"Upload exceeds the maximum allowed file count of {maxAllowed}.");
        }

        return BulkEvidenceUploadValidationResult.Success();
    }
}
