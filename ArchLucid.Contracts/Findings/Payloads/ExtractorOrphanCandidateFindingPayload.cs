namespace ArchLucid.Contracts.Findings.Payloads;

public class ExtractorOrphanCandidateFindingPayload
{
    public string ExtractorArtifactFileName
    {
        get;
        set;
    } = "orphan-candidates.json";

    public int EntryIndex
    {
        get;
        set;
    }

    public string ResourceId
    {
        get;
        set;
    } = null!;

    public string ResourceType
    {
        get;
        set;
    } = null!;

    public string Reason
    {
        get;
        set;
    } = null!;

    public decimal? EstimatedAnnualSavingsUsd
    {
        get;
        set;
    }
}
