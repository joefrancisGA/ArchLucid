namespace ArchLucid.Cli;

internal readonly record struct CliPilotRunDeltasFetchResult(
    int StatusCode,
    bool NotFound,
    bool Success,
    string Body);
