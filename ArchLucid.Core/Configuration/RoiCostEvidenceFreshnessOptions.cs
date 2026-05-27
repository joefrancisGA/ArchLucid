namespace ArchLucid.Core.Configuration;

/// <summary>Thresholds for labeling stale uploaded Azure extractor cost evidence on ROI surfaces.</summary>
public sealed class RoiCostEvidenceFreshnessOptions
{
    public const string SectionPath = "ExecutiveRoi:CostEvidenceFreshness";

    /// <summary>Days after collection UTC before uploaded extractor cost evidence is labeled stale.</summary>
    public int StaleAfterDays
    {
        get;
        init;
    } = 90;
}
