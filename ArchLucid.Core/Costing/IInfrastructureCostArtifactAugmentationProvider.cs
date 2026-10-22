namespace ArchLucid.Core.Costing;

/// <summary>Produces <see cref="InfrastructureCostArtifactAugmentation"/> for synthesized cost-summary artifacts.</summary>
public interface IInfrastructureCostArtifactAugmentationProvider
{
    /// <param name="nodes">Workload nodes (manifest topology rows and/or extractor inventory).</param>
    Task<InfrastructureCostArtifactAugmentation> AugmentNodesAsync(IReadOnlyList<InfrastructureCostQueryNode> nodes,
        CancellationToken cancellationToken);
}
