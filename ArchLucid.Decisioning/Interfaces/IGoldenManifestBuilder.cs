using ArchLucid.Decisioning.DecisionTraces;
using ArchLucid.Decisioning.Models;
using ArchLucid.KnowledgeGraph.Models;

namespace ArchLucid.Decisioning.Interfaces;

public interface IGoldenManifestBuilder
{
    ManifestDocument Build(
        Guid runId,
        Guid contextSnapshotId,
        GraphSnapshot graphSnapshot,
        FindingsSnapshot findingsSnapshot,
        DecisionTrace trace,
        DecisionRuleSet ruleSet);

    /// <summary>
    ///     Rebuilds graph-derived topology slices on an existing manifest after post-seed topology merge (TB-575).
    /// </summary>
    void RefreshGraphDerivedTopology(ManifestDocument manifest, GraphSnapshot graphSnapshot);
}
