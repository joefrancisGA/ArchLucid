namespace ArchLucid.Decisioning.Analysis;

/// <summary>Redundancy tier parsed from requirement text (DX-25).</summary>
public enum RequirementRedundancyLevel
{
    Zone = 1,
    Geo = 2,
    MultiRegion = 3,
}
