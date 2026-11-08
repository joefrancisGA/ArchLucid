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

public partial class DefaultGoldenManifestBuilder(
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
                Name = string.Empty,
                Version = string.Empty,
                Status = string.Empty,
                Summary = string.Empty,
            }
        };

        PopulateManifestSections(manifest, graphSnapshot, findingsSnapshot, audit);

        NormalizeManifestOrdering(manifest);

        return manifest;
    }
}
