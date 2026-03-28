namespace ArchiForge.Api.Jobs;

public interface IBackgroundJobQueue
{
    string Enqueue(string? fileNameHint, string? contentTypeHint, Func<CancellationToken, Task<BackgroundJobFile>> work, int maxRetries = 0);
    BackgroundJobInfo? GetInfo(string jobId);
    BackgroundJobFile? GetFile(string jobId);
}

