namespace ArchLucid.ArtifactSynthesis.Models;

/// <summary>View modes when compiling an inventory <see cref="ArchLucid.Contracts.Persistence.Graph.GraphSnapshot" /> to <see cref="DiagramAst" />.</summary>
public enum DiagramMode
{
    Executive,
    Architecture,
    Network,
    Security,
    BusinessContinuity,
    Identity,
    Data,
    DataFlow,
    DataArchitecture,
    FullSubscription,
    ResourceGroup,
    SelectedResources,
    DependencyNeighborhood,
}
