namespace ArchLucid.KnowledgeGraph.Inventory;

/// <summary>
///     Canonical stage names for SecureNow data-flow diagrams (SN-DF-02).
/// </summary>
public static class AzureInventoryDataFlowStageNames
{
    public const string Source = "Source";

    public const string Application = "Application";

    public const string Ingestion = "Ingestion";

    public const string Storage = "Storage";

    public const string Transform = "Transform";

    public const string Consumer = "Consumer";

    public static readonly IReadOnlyList<string> OrderedStages =
    [
        Source,
        Application,
        Ingestion,
        Storage,
        Transform,
        Consumer,
    ];

    public static bool EqualsStage(string? left, string? right)
    {
        return string.Equals(left, right, StringComparison.OrdinalIgnoreCase);
    }
}
