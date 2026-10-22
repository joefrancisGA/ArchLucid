namespace ArchLucid.Decisioning.Analysis;

public sealed class RequiredCapabilityCoverageResult
{
    public List<string> RequiredCapabilities
    {
        get;
        set;
    } = [];

    public List<string> SatisfiedCapabilities
    {
        get;
        set;
    } = [];

    public List<string> MissingCapabilities
    {
        get;
        set;
    } = [];

    public int CoverageScorePercent =>
        RequiredCapabilities.Count == 0
            ? 100
            : (int)Math.Round(100.0 * SatisfiedCapabilities.Count / RequiredCapabilities.Count);
}
