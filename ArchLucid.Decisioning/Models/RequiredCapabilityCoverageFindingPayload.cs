namespace ArchLucid.Decisioning.Models;

public sealed class RequiredCapabilityCoverageFindingPayload
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

    public int CoverageScorePercent
    {
        get;
        set;
    }
}
