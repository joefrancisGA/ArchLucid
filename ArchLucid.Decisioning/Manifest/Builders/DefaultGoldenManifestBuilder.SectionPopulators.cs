using ArchLucid.Decisioning.DecisionTraces;
using ArchLucid.Decisioning.Findings;
using ArchLucid.Decisioning.Models;
using ArchLucid.Core.Manifest;
using ArchLucid.KnowledgeGraph.Models;

namespace ArchLucid.Decisioning.Manifest.Builders;

public partial class DefaultGoldenManifestBuilder
{
    private void PopulateManifestSections(
        ManifestDocument manifest,
        GraphSnapshot graphSnapshot,
        FindingsSnapshot findingsSnapshot,
        RuleAuditTracePayload audit)
    {
        FindingsSnapshotTypeIndex findingsByType = new(findingsSnapshot);
        FindingsSnapshotIdIndex findingsById = new(findingsSnapshot);

        _requirementsSectionPopulator.Populate(manifest, findingsByType);
        _topologySectionPopulator.PopulateFromGraph(manifest, graphSnapshot);
        _topologySectionPopulator.Populate(manifest, findingsByType);
        _securitySectionPopulator.Populate(manifest, findingsByType);
        _complianceSectionPopulator.Populate(manifest, findingsByType);
        _costSectionPopulator.Populate(manifest, findingsByType);
        _policySectionPopulator.Populate(manifest, findingsByType);
        _coverageSectionPopulator.Populate(manifest, findingsByType);
        _constraintsSectionPopulator.Populate(manifest, findingsById, audit);
        _provenanceSectionPopulator.Populate(manifest, findingsSnapshot, audit);
    }

    /// <inheritdoc />
    public void RefreshGraphDerivedTopology(ManifestDocument manifest, GraphSnapshot graphSnapshot)
    {
        ArgumentNullException.ThrowIfNull(manifest);
        ArgumentNullException.ThrowIfNull(graphSnapshot);

        manifest.Topology.Resources.Clear();
        manifest.Topology.Services.Clear();
        manifest.Topology.Datastores.Clear();

        _topologySectionPopulator.PopulateFromGraph(manifest, graphSnapshot);

        manifest.Topology.Resources = manifest.Topology.Resources
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .OrderBy(x => x, StringComparer.OrdinalIgnoreCase)
            .ToList();
        manifest.Topology.Services = manifest.Topology.Services
            .OrderBy(x => x.ServiceName, StringComparer.OrdinalIgnoreCase)
            .ToList();
        manifest.Topology.Datastores = manifest.Topology.Datastores
            .OrderBy(x => x.DatastoreName, StringComparer.OrdinalIgnoreCase)
            .ToList();
    }
}
