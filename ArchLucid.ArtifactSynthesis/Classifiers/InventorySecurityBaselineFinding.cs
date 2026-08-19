namespace ArchLucid.ArtifactSynthesis.Classifiers;

/// <summary>Security baseline gap grounded in inventory <c>resources.json</c> rows.</summary>
public sealed record InventorySecurityBaselineFinding(
    string ResourceId,
    string ResourceType,
    string Message,
    string ControlFamily);
