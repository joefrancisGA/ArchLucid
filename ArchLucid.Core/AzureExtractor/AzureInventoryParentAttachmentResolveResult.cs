namespace ArchLucid.Core.AzureExtractor;

/// <summary>Resolved parent attachment targets for an inventory child resource (NR-03).</summary>
public sealed class AzureInventoryParentAttachmentResolveResult
{
    public IReadOnlyList<string> ParentArmIds { get; init; } = [];

    public string? ExternalTargetArmId { get; init; }

    public bool ExcludeFromTopology { get; init; }

    public bool HasProvenParent => ParentArmIds.Count > 0;
}
