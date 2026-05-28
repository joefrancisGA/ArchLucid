namespace ArchLucid.Cli.Commands;

internal sealed class PilotPreflightReport
{
    public required string BaseUrl
    {
        get;
        init;
    }

    public required IReadOnlyList<PilotPreflightStepResult> Steps
    {
        get;
        init;
    }

    public bool AllBlockingPassed => Steps.All(static s => s.Passed);

    public int BlockCount => Steps.Count(static s => s.Disposition == PilotPreflightDisposition.Block);

    public int WarnCount => Steps.Count(static s => s.Disposition == PilotPreflightDisposition.Warn);
}
