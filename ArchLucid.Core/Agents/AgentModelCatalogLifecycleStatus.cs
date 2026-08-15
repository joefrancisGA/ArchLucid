namespace ArchLucid.Core.Agents;

/// <summary>Catalog row lifecycle (TB-2103). Independent from evaluation state (TB-2105).</summary>
public enum AgentModelCatalogLifecycleStatus
{
    Available = 0,
    Deprecated = 1,
    Retired = 2,
}
