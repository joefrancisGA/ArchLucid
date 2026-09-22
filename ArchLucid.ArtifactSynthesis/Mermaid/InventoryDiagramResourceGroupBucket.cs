namespace ArchLucid.ArtifactSynthesis.Mermaid;

internal sealed class InventoryDiagramResourceGroupBucket
{
    public InventoryDiagramResourceGroupBucket(string name, string? subscriptionId)
    {
        Name = name;
        SubscriptionId = subscriptionId;
    }

    public string Name { get; }

    public string? SubscriptionId { get; }

    public int ResourceCount { get; set; }
}
