namespace ArchLucid.Application.Findings;

/// <summary>Cost-recommendation JSON plus the ZIP entry name it was read from.</summary>
internal sealed record CloudInventoryCostRecommendationJson(string Json, string EntryName);
