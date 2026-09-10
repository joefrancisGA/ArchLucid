namespace ArchLucid.Decisioning.Analysis;

public sealed record RequirementSkuTierGap(
    string RequirementNodeId,
    string RequirementLabel,
    RequirementRedundancyLevel RequiredRedundancy,
    string DatastoreNodeId,
    string DatastoreLabel,
    string ObservedSku);
