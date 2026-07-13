namespace ArchLucid.Contracts.Operations;

public sealed class TrialFunnelDataQualityResponse
{
    public DateTimeOffset GeneratedAtUtc
    {
        get;
        init;
    }

    public int PeriodDays
    {
        get;
        init;
    }

    public bool ComparePreviousPeriod
    {
        get;
        init;
    }

    public bool ExcludesDemoWorkspaces
    {
        get;
        init;
    } = true;

    public string ConversionDefinition
    {
        get;
        init;
    } = string.Empty;

    public string? InstrumentationWarning
    {
        get;
        init;
    }

    public IReadOnlyList<string> StageDefinitions
    {
        get;
        init;
    } = Array.Empty<string>();
}
