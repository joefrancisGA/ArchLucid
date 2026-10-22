namespace ArchLucid.Contracts.Roi;

/// <summary>Freshness of uploaded Azure extractor cost evidence used for ROI labeling (not savings math).</summary>
public static class RoiCostEvidenceFreshness
{
    public const string Fresh = "Fresh";

    public const string Stale = "Stale";

    public const string Missing = "Missing";
}
