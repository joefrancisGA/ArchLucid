namespace ArchLucid.Application.Jobs;
public sealed record BackgroundJobInfo(string JobId, BackgroundJobState State, DateTimeOffset CreatedUtc, DateTimeOffset? StartedUtc, DateTimeOffset? CompletedUtc, string? Error, string? FileName, string? ContentType, int RetryCount = 0, int MaxRetries = 0)
{
    private readonly byte _primaryConstructorArgumentValidation = __ValidatePrimaryConstructorArguments(JobId, Error, FileName, ContentType);
    private static byte __ValidatePrimaryConstructorArguments(System.String jobId, System.String? error, System.String? fileName, System.String? contentType)
    {
        ArgumentNullException.ThrowIfNull(jobId);
        return (byte)0;
    }
}