namespace ArchLucid.Cli.Commands;

internal sealed class PilotReadinessBundleReport
{
    public required string RepositoryRoot
    {
        get;
        init;
    }

    public required DateTime GeneratedUtc
    {
        get;
        init;
    }

    public string? RunId
    {
        get;
        init;
    }

    public required PilotReadinessBundleVerdict OverallVerdict
    {
        get;
        init;
    }

    public required IReadOnlyList<PilotReadinessBundleSlotResult> Slots
    {
        get;
        init;
    }

    public string? JsonArtifactPath
    {
        get;
        init;
    }

    public string? MarkdownArtifactPath
    {
        get;
        init;
    }

    public bool AnyFail => OverallVerdict == PilotReadinessBundleVerdict.Fail;

    internal PilotReadinessBundleReport WithOutputMetadata(
        string? jsonArtifactPath,
        string? markdownArtifactPath) =>
        new()
        {
            RepositoryRoot = RepositoryRoot,
            GeneratedUtc = GeneratedUtc,
            RunId = RunId,
            OverallVerdict = OverallVerdict,
            Slots = Slots,
            JsonArtifactPath = jsonArtifactPath,
            MarkdownArtifactPath = markdownArtifactPath,
        };
}
