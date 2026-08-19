namespace ArchLucid.Application.Findings;

/// <summary>
/// Reads extractor-grounded cost recommendation JSON from a Tier-1 AWS/GCP inventory ZIP.
/// Accepts Azure-named <c>advisor-cost.json</c> plus AWS/GCP aliases.
/// </summary>
internal static class CloudInventoryZipCostRecommendationReader
{
    private static readonly string[] CandidateEntryNames =
    [
        "advisor-cost.json",
        "cost-recommendations.json",
        "compute-optimizer.json",
        "recommender-cost.json"
    ];

    public static CloudInventoryCostRecommendationJson? TryRead(byte[] packageBytes)
    {
        if (packageBytes is null || packageBytes.Length == 0)
        {
            return null;
        }

        foreach (string entryName in CandidateEntryNames)
        {
            string? json = CloudInventoryZipResourcesJsonReader.TryReadEntry(packageBytes, entryName);

            if (string.IsNullOrWhiteSpace(json))
            {
                continue;
            }

            return new CloudInventoryCostRecommendationJson(json, entryName);
        }

        return null;
    }
}
