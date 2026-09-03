namespace ArchLucid.Cli;

public sealed partial class ArchLucidApiClient
{
    public sealed record SeedFakeResultsResult(
        bool Success,
        int ResultCount,
        string? Error,
        int? HttpStatusCode = null);

    public sealed class SeedFakeResultsResponse
    {
        public string Message
        {
            get;
            set;
        } = "";

        public string RunId
        {
            get;
            set;
        } = "";

        public int ResultCount
        {
            get;
            set;
        }
    }

    public sealed record SubmitResultResult(bool Success, string? ResultId, string? Error, int? HttpStatusCode = null);

    public sealed class SubmitResultResponse
    {
        public string Message
        {
            get;
            set;
        } = "";

        public string RunId
        {
            get;
            set;
        } = "";

        public string ResultId
        {
            get;
            set;
        } = "";
    }
}
