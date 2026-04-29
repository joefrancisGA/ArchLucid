namespace ArchLucid.Api.Controllers.Authority;

/// <summary>Source-generated structured log methods for <see cref="RunsController" />.</summary>
public sealed partial class RunsController
{
    [LoggerMessage(EventId = 2001, Level = LogLevel.Information,
        Message = "Run created: RunId={RunId}, RequestId={RequestId}, User={User}, CorrelationId={CorrelationId}")]
    private partial void LogRunCreated(string runId, string requestId, string user, string correlationId);

    [LoggerMessage(EventId = 2002, Level = LogLevel.Information,
        Message = "Run executed: RunId={RunId}, ResultCount={ResultCount}, User={User}, CorrelationId={CorrelationId}")]
    private partial void LogRunExecuted(string runId, int resultCount, string user, string correlationId);

    [LoggerMessage(EventId = 2004, Level = LogLevel.Information,
        Message =
            "Run committed: RunId={RunId}, ManifestVersion={ManifestVersion}, WarningCount={WarningCount}, User={User}, CorrelationId={CorrelationId}")]
    private partial void LogRunCommitted(string runId, string? manifestVersion, int warningCount, string user,
        string correlationId);

}
