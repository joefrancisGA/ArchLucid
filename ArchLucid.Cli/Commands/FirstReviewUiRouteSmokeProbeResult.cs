namespace ArchLucid.Cli.Commands;

internal sealed class FirstReviewUiRouteSmokeProbeResult
{
    public required string RouteId
    {
        get;
        init;
    }

    public required string Path
    {
        get;
        init;
    }

    public required bool Success
    {
        get;
        init;
    }

    public required string Detail
    {
        get;
        init;
    }
}
