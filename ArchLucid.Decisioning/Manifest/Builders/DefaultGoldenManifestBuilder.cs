using ArchLucid.Decisioning.DecisionTraces;
using ArchLucid.Decisioning.Findings;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Decisioning.Manifest;
using ArchLucid.Core.Manifest;
using ArchLucid.Core.Manifest.Sections;
using ArchLucid.Decisioning.Models;
using ArchLucid.KnowledgeGraph;
using ArchLucid.KnowledgeGraph.Models;

namespace ArchLucid.Decisioning.Manifest.Builders;

public class DefaultGoldenManifestBuilder(
    TopologyManifestSectionPopulator topologySectionPopulator,
    SecurityManifestSectionPopulator securitySectionPopulator,
    CostManifestSectionPopulator costSectionPopulator,
    RequirementsManifestSectionPopulator requirementsSectionPopulator,
    ComplianceManifestSectionPopulator complianceSectionPopulator,
    PolicyManifestSectionPopulator policySectionPopulator,
    CoverageManifestSectionPopulator coverageSectionPopulator,
    ConstraintsManifestSectionPopulator constraintsSectionPopulator,
    ProvenanceManifestSectionPopulator provenanceSectionPopulator) : IGoldenManifestBuilder
{
    private readonly TopologyManifestSectionPopulator _topologySectionPopulator =
        topologySectionPopulator ?? throw new ArgumentNullException(nameof(topologySectionPopulator));

    private readonly SecurityManifestSectionPopulator _securitySectionPopulator =
        securitySectionPopulator ?? throw new ArgumentNullException(nameof(securitySectionPopulator));

    private readonly CostManifestSectionPopulator _costSectionPopulator =
        costSectionPopulator ?? throw new ArgumentNullException(nameof(costSectionPopulator));

    private readonly RequirementsManifestSectionPopulator _requirementsSectionPopulator =
        requirementsSectionPopulator ?? throw new ArgumentNullException(nameof(requirementsSectionPopulator));

    private readonly ComplianceManifestSectionPopulator _complianceSectionPopulator =
        complianceSectionPopulator ?? throw new ArgumentNullException(nameof(complianceSectionPopulator));

    private readonly PolicyManifestSectionPopulator _policySectionPopulator =
        policySectionPopulator ?? throw new ArgumentNullException(nameof(policySectionPopulator));

    private readonly CoverageManifestSectionPopulator _coverageSectionPopulator =
        coverageSectionPopulator ?? throw new ArgumentNullException(nameof(coverageSectionPopulator));

    private readonly ConstraintsManifestSectionPopulator _constraintsSectionPopulator =
        constraintsSectionPopulator ?? throw new ArgumentNullException(nameof(constraintsSectionPopulator));

    private readonly ProvenanceManifestSectionPopulator _provenanceSectionPopulator =
        provenanceSectionPopulator ?? throw new ArgumentNullException(nameof(provenanceSectionPopulator));

    public ManifestDocument Build(
        Guid runId,
        Guid contextSnapshotId,
        GraphSnapshot graphSnapshot,
        FindingsSnapshot findingsSnapshot,
        DecisionTrace trace,
        DecisionRuleSet ruleSet)
    {
        RuleAuditTracePayload audit = trace.RequireRuleAudit();

        ManifestDocument manifest = new()
        {
            ManifestId = Guid.NewGuid(),
            RunId = runId,
            ContextSnapshotId = contextSnapshotId,
            GraphSnapshotId = graphSnapshot.GraphSnapshotId,
            FindingsSnapshotId = findingsSnapshot.FindingsSnapshotId,
            DecisionTraceId = audit.DecisionTraceId,
            CreatedUtc = TimeProvider.System.UtcNowDateTime(),
            RuleSetId = ruleSet.RuleSetId,
            RuleSetVersion = ruleSet.Version,
            RuleSetHash = ruleSet.RuleSetHash,
            Metadata = new ManifestMetadata
            {
                Name = $"ArchLucid Manifest {runId:N}",
                Version = "1.0.0",
                Status = "Draft",
                Summary = "Resolved architecture state generated from graph findings and rule evaluation."
            }
        };

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

        manifest.Metadata.Status = manifest.UnresolvedIssues.Items.Count == 0
            ? "Resolved"
            : "NeedsAttention";

        NormalizeManifestOrdering(manifest);

        return manifest;
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

    private static void NormalizeManifestOrdering(ManifestDocument manifest)
    {
        manifest.Requirements.Covered = manifest.Requirements.Covered
            .OrderBy(x => x.RequirementName, StringComparer.OrdinalIgnoreCase)
            .ToList();
        manifest.Requirements.Uncovered = manifest.Requirements.Uncovered
            .OrderBy(x => x.RequirementName, StringComparer.OrdinalIgnoreCase)
            .ToList();

        manifest.Topology.SelectedPatterns = manifest.Topology.SelectedPatterns
            .OrderBy(x => x, StringComparer.OrdinalIgnoreCase)
            .ToList();
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
        manifest.Topology.Gaps = manifest.Topology.Gaps
            .OrderBy(x => x, StringComparer.OrdinalIgnoreCase)
            .ToList();

        manifest.Security.Controls = manifest.Security.Controls
            .OrderBy(x => x.ControlName, StringComparer.OrdinalIgnoreCase)
            .ToList();
        manifest.Security.Gaps = manifest.Security.Gaps
            .OrderBy(x => x, StringComparer.OrdinalIgnoreCase)
            .ToList();

        manifest.Compliance.Controls = manifest.Compliance.Controls
            .OrderBy(x => x.ControlName, StringComparer.OrdinalIgnoreCase)
            .ToList();
        manifest.Compliance.Gaps = manifest.Compliance.Gaps
            .OrderBy(x => x, StringComparer.OrdinalIgnoreCase)
            .ToList();

        manifest.Cost.CostRisks = manifest.Cost.CostRisks
            .OrderBy(x => x, StringComparer.OrdinalIgnoreCase)
            .ToList();
        manifest.Cost.Notes = manifest.Cost.Notes
            .OrderBy(x => x, StringComparer.OrdinalIgnoreCase)
            .ToList();

        manifest.UnresolvedIssues.Items = manifest.UnresolvedIssues.Items
            .OrderBy(x => x.Title, StringComparer.OrdinalIgnoreCase)
            .ToList();

        manifest.Decisions = manifest.Decisions
            .OrderBy(x => x.Category, StringComparer.OrdinalIgnoreCase)
            .ThenBy(x => x.Title, StringComparer.OrdinalIgnoreCase)
            .ToList();

        manifest.Assumptions = manifest.Assumptions
            .OrderBy(x => x, StringComparer.OrdinalIgnoreCase)
            .ToList();

        manifest.Warnings = manifest.Warnings
            .OrderBy(x => x, StringComparer.OrdinalIgnoreCase)
            .ToList();

        manifest.Constraints.MandatoryConstraints = manifest.Constraints.MandatoryConstraints
            .OrderBy(x => x, StringComparer.OrdinalIgnoreCase)
            .ToList();
        manifest.Constraints.Preferences = manifest.Constraints.Preferences
            .OrderBy(x => x, StringComparer.OrdinalIgnoreCase)
            .ToList();

        manifest.Provenance.SourceFindingIds = manifest.Provenance.SourceFindingIds
            .OrderBy(x => x, StringComparer.OrdinalIgnoreCase)
            .ToList();
        manifest.Provenance.SourceGraphNodeIds = manifest.Provenance.SourceGraphNodeIds
            .OrderBy(x => x, StringComparer.OrdinalIgnoreCase)
            .ToList();
        manifest.Provenance.AppliedRuleIds = manifest.Provenance.AppliedRuleIds
            .OrderBy(x => x, StringComparer.OrdinalIgnoreCase)
            .ToList();

        manifest.Policy.SatisfiedControls = manifest.Policy.SatisfiedControls
            .OrderBy(x => x.ControlName, StringComparer.OrdinalIgnoreCase)
            .ToList();
        manifest.Policy.Violations = manifest.Policy.Violations
            .OrderBy(x => x.ControlName, StringComparer.OrdinalIgnoreCase)
            .ToList();
        manifest.Policy.Exemptions = manifest.Policy.Exemptions
            .OrderBy(x => x.ControlId, StringComparer.OrdinalIgnoreCase)
            .ToList();
        manifest.Policy.Notes = manifest.Policy.Notes
            .OrderBy(x => x, StringComparer.OrdinalIgnoreCase)
            .ToList();
    }
}
