namespace ArchLucid.Decisioning.Analysis;

/// <summary>Requirement with a parsed recovery objective linked to a datastore missing replica evidence.</summary>
public sealed record DrRpoTopologyGap(
    string RequirementNodeId,
    string RequirementLabel,
    int? RpoMinutes,
    int? RtoMinutes,
    string DatastoreNodeId,
    string DatastoreLabel);
