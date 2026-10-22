namespace ArchLucid.Cli;

public sealed partial class ArchLucidApiClient
{
    public sealed record DraftApiResult<T>(
        bool Success,
        T? Value,
        string? Error,
        int? HttpStatusCode = null,
        string? CorrelationId = null)
    {
        public static DraftApiResult<T> Ok(T value) => new(true, value, null);

        public static DraftApiResult<T> Fail(int? httpStatusCode, string? error, string? correlationId = null) =>
            new(false, default, error, httpStatusCode, correlationId);
    }
}
