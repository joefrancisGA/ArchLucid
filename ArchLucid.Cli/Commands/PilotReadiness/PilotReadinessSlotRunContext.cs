namespace ArchLucid.Cli.Commands.PilotReadiness;

internal sealed class PilotReadinessSlotRunContext
{
    public required string RepositoryRoot { get; init; }

    public required PilotReadinessBundleOptions Options { get; init; }

    public HttpClient? HttpClient { get; init; }

    public ArchLucidProjectScaffolder.ArchLucidCliConfig? Config { get; init; }

    public required string[] RawArgs { get; init; }
}
