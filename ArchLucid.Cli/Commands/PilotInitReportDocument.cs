namespace ArchLucid.Cli.Commands;

internal sealed class PilotInitFixStep
{
    public required int StepNumber
    {
        get;
        init;
    }

    public required string CheckName
    {
        get;
        init;
    }

    public required string Detail
    {
        get;
        init;
    }

    public required string Remediation
    {
        get;
        init;
    }
}

internal sealed class PilotInitReportDocument
{
    public required DateTimeOffset GeneratedAtUtc
    {
        get;
        init;
    }

    public required string BaseUrl
    {
        get;
        init;
    }

    public required string OverallDisposition
    {
        get;
        init;
    }

    public required int BlockingCount
    {
        get;
        init;
    }

    public required int WarningCount
    {
        get;
        init;
    }

    public required IReadOnlyList<PilotInitFixStep> FixSteps
    {
        get;
        init;
    }

    public required IReadOnlyList<PilotPreflightStepResult> Checks
    {
        get;
        init;
    }
}
