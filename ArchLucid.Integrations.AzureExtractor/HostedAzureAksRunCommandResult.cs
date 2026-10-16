namespace ArchLucid.Integrations.AzureExtractor;

public enum HostedAzureAksRunCommandStatus
{
    Succeeded,

    InsufficientRbac,

    MissingLogs,

    RunCommandFailed,

    HttpError,

    PollTimeout,

    Unavailable,

    Error,
}

public sealed class HostedAzureAksRunCommandResult
{
    public HostedAzureAksRunCommandStatus Status { get; init; }

    public string? Logs { get; init; }

    public int? HttpStatusCode { get; init; }

    public static HostedAzureAksRunCommandResult SucceededWithLogs(string logs)
    {
        return new HostedAzureAksRunCommandResult
        {
            Status = HostedAzureAksRunCommandStatus.Succeeded,
            Logs = logs,
        };
    }

    public static HostedAzureAksRunCommandResult Failed(
        HostedAzureAksRunCommandStatus status,
        int? httpStatusCode = null)
    {
        return new HostedAzureAksRunCommandResult
        {
            Status = status,
            HttpStatusCode = httpStatusCode,
        };
    }
}
