namespace ArchLucid.Core.AzureExtractor;

/// <summary>NR-05 classifier output for a standalone inventory diagram node.</summary>
public sealed class InventoryDiagramConnectionStateResult
{
    public InventoryDiagramConnectionState? State
    {
        get;
        init;
    }

    /// <summary>Missing requirement when <see cref="State" /> is <see cref="InventoryDiagramConnectionState.Orphaned" />.</summary>
    public string? MissingRequirementMessage
    {
        get;
        init;
    }

    /// <summary>Partially unresolved relationships that do not orphan the parent resource (e.g. workflow actions).</summary>
    public IReadOnlyList<string> UnresolvedRelationshipDetails
    {
        get;
        init;
    } = [];

    public static InventoryDiagramConnectionStateResult None => new();

    public static InventoryDiagramConnectionStateResult Unconnected() =>
        new() { State = InventoryDiagramConnectionState.Unconnected };

    public static InventoryDiagramConnectionStateResult Orphaned(string missingRequirementMessage) =>
        new()
        {
            State = InventoryDiagramConnectionState.Orphaned,
            MissingRequirementMessage = missingRequirementMessage,
        };

    public static InventoryDiagramConnectionStateResult WithUnresolvedDetails(
        IReadOnlyList<string> unresolvedRelationshipDetails,
        InventoryDiagramConnectionState state = InventoryDiagramConnectionState.Unconnected) =>
        new()
        {
            State = state,
            UnresolvedRelationshipDetails = unresolvedRelationshipDetails,
        };
}
