namespace ArchLucid.Contracts.Findings.Payloads;

public class PortfolioSharedTopologyFindingPayload
{
    public string ResourceIdNormalized
    {
        get;
        set;
    } = null!;

    public string OtherSystemId
    {
        get;
        set;
    } = null!;

    public string OtherRunId
    {
        get;
        set;
    } = null!;

    public string ThisPosture
    {
        get;
        set;
    } = null!;

    public string OtherPosture
    {
        get;
        set;
    } = null!;
}
