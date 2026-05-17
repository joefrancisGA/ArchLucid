namespace ArchLucid.Core.AzureExtractor;

/// <summary>Minimal ARM inventory row surfaced from extractor <c>resources.json</c> for costing.</summary>
public sealed record AzureExtractorInventoryResourceLine(
    string Name,
    string ResourceType,
    string? Location,
    string? SkuName);
