namespace ArchLucid.Cli.Commands;

/// <summary>Aggregate report for <c>archlucid real-mode smoke</c>.</summary>
public sealed class RealModeSmokeReport
{
    public IReadOnlyList<RealModeSmokeStepResult> Steps
    {
        get;
        init;
    } = [];

    public bool AllPassed
    {
        get;
        init;
    }

    public string? RunId
    {
        get;
        init;
    }

    public string? CorrelationId
    {
        get;
        init;
    }

    public string? FinalRunStatus
    {
        get;
        init;
    }

    public long TotalLlmTokens
    {
        get;
        init;
    }
}
