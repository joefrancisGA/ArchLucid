namespace ArchLucid.Cli.Commands;

/// <summary>Outcome for one step in <c>archlucid real-mode smoke</c>.</summary>
public sealed class RealModeSmokeStepResult
{
    public string Name
    {
        get;
        init;
    } = string.Empty;

    public bool Passed
    {
        get;
        init;
    }

    public string Detail
    {
        get;
        init;
    } = string.Empty;

    public string? FailureHint
    {
        get;
        init;
    }
}
