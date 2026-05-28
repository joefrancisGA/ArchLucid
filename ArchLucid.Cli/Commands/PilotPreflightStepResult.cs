namespace ArchLucid.Cli.Commands;

internal sealed class PilotPreflightStepResult
{
    public required string Name
    {
        get;
        init;
    }

    public required PilotPreflightDisposition Disposition
    {
        get;
        init;
    }

    public required string Detail
    {
        get;
        init;
    }

    public string? Remediation
    {
        get;
        init;
    }

    public bool Passed => Disposition != PilotPreflightDisposition.Block;
}
