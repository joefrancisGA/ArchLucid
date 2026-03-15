namespace ArchiForge.Contracts.Agents;

public sealed class ServiceCatalogEvidence
{
    public string ServiceId { get; set; } = string.Empty;

    public string ServiceName { get; set; } = string.Empty;

    public string Category { get; set; } = string.Empty;

    public string Summary { get; set; } = string.Empty;

    public List<string> Tags { get; set; } = [];

    public List<string> RecommendedUseCases { get; set; } = [];
}
