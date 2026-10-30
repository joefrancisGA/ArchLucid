using ArchLucid.Contracts.Persistence.DecisionTraces;
using ArchLucid.Core.Artifacts;
using ArchLucid.Decisioning.Models;
namespace ArchLucid.Provenance;

public sealed class ProvenanceBuilder : IProvenanceBuilder
{
    public DecisionProvenanceGraph Build(ProvenanceBuildInput input)
    {
        if (input is null)
            throw new ArgumentNullException(nameof(input));

        Guid runId = input.RunId;
        FindingsSnapshot findings = input.Findings;
        GraphSnapshot graph = input.Graph;
        ManifestDocument manifest = input.Manifest;
        DecisionTraceDto decisionTrace = input.DecisionTrace;
        IReadOnlyList<SynthesizedArtifact> artifacts = input.Artifacts;

        if (decisionTrace is not RuleAuditTraceDto ruleAuditTrace)
            throw new InvalidOperationException("Expected a RuleAudit trace (authority pipeline).");

        RuleAuditTracePayload trace = ruleAuditTrace.RuleAudit;

        IReadOnlyList<GraphNode> graphNodes = (graph.Nodes ?? [])
            .Where(static node => node is not null)
            .ToArray();
        IReadOnlyList<Finding> findingRows = findings.Findings ?? [];
        IReadOnlyList<ResolvedArchitectureDecision> manifestDecisions = manifest.Decisions ?? [];

        DecisionProvenanceGraph result = new() { Id = Guid.NewGuid(), RunId = runId };

        Dictionary<string, Guid> nodeMap = new(StringComparer.OrdinalIgnoreCase);

        HashSet<string> graphNodeIds = new(
            graphNodes.Select(n => NormalizeId(n.NodeId)),
            StringComparer.OrdinalIgnoreCase);

        IEnumerable<string> DistinctDecisionKeys()
        {
            return manifestDecisions
                .Select(d => NormalizeId(d.DecisionId))
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .Select(id => $"decision:{id}");
        }

        foreach (GraphNode n in graphNodes)

            AddNode(
                $"graph:{NormalizeId(n.NodeId)}",
                new ProvenanceNode
                {
                    Type = ProvenanceNodeType.GraphNode,
                    ReferenceId = NormalizeId(n.NodeId),
                    Name = ResolveGraphNodeDisplayName(n),
                    Metadata = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                    {
                        ["nodeType"] = NormalizeProvenanceMetadataValue(n.NodeType),
                        ["category"] = NormalizeProvenanceMetadataValue(n.Category),
                    }
                });


        foreach (Finding f in findingRows)

            AddNode(
                $"finding:{NormalizeId(f.FindingId)}",
                CreateFindingNode(f));


        foreach (string ruleId in DistinctAppliedRuleIds(trace.AppliedRuleIds))

            AddNode(
                $"rule:{ruleId}",
                new ProvenanceNode { Type = ProvenanceNodeType.Rule, ReferenceId = ruleId, Name = ruleId });


        foreach (ResolvedArchitectureDecision d in manifestDecisions)

            AddNode(
                $"decision:{NormalizeId(d.DecisionId)}",
                new ProvenanceNode
                {
                    Type = ProvenanceNodeType.Decision,
                    ReferenceId = NormalizeId(d.DecisionId),
                    Name = ResolveDecisionDisplayTitle(d),
                    Metadata = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                    {
                        ["category"] = NormalizeProvenanceMetadataValue(d.Category),
                    }
                });


        foreach (SynthesizedArtifact a in artifacts)

            AddNode(
                $"artifact:{a.ArtifactId:N}",
                new ProvenanceNode
                {
                    Type = ProvenanceNodeType.Artifact,
                    ReferenceId = a.ArtifactId.ToString("N"),
                    Name = ResolveArtifactDisplayName(a),
                    Metadata = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                    {
                        ["artifactType"] = NormalizeProvenanceMetadataValue(a.ArtifactType),
                        ["format"] = NormalizeProvenanceMetadataValue(a.Format),
                    }
                });


        Guid manifestNodeId = AddNode(
            $"manifest:{manifest.ManifestId:N}",
            new ProvenanceNode
            {
                Type = ProvenanceNodeType.Manifest,
                ReferenceId = manifest.ManifestId.ToString("N"),
                Name = "ManifestDocument",
                Metadata = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                {
                    ["manifestHash"] = NormalizeProvenanceMetadataValue(manifest.ManifestHash),
                }
            });

        // Findings → Decisions (decision supported by findings)

        foreach (IGrouping<string, ResolvedArchitectureDecision> decisionGroup in manifestDecisions.GroupBy(
                     d => NormalizeId(d.DecisionId),
                     StringComparer.OrdinalIgnoreCase))
        {
            string decisionKey = $"decision:{decisionGroup.Key}";

            if (!nodeMap.TryGetValue(decisionKey, out Guid to))
                continue;

            foreach (string fk in decisionGroup
                         .SelectMany(d => d.SupportingFindingIds)
                         .Select(NormalizeId)
                         .Distinct(StringComparer.OrdinalIgnoreCase)
                         .Select(fId => $"finding:{fId}"))
            {
                if (!nodeMap.TryGetValue(fk, out Guid from))
                    continue;

                AddEdge(from, to, ProvenanceEdgeType.SupportedBy);
            }
        }

        // Graph nodes → Findings (finding influenced by graph context)

        foreach (IGrouping<string, Finding> findingGroup in findingRows.GroupBy(
                     f => NormalizeId(f.FindingId),
                     StringComparer.OrdinalIgnoreCase))
        {

            string fk = $"finding:{findingGroup.Key}";

            if (!nodeMap.TryGetValue(fk, out Guid findingNodeId))
                continue;

            foreach (string relatedId in findingGroup
                         .SelectMany(f => f.RelatedNodeIds)
                         .Select(NormalizeId)
                         .Distinct(StringComparer.OrdinalIgnoreCase))

            {

                string gk = $"graph:{relatedId}";

                if (!graphNodeIds.Contains(relatedId) || !nodeMap.TryGetValue(gk, out Guid graphNid))
                    continue;

                AddEdge(graphNid, findingNodeId, ProvenanceEdgeType.InfluencedByGraphNode);
            }

        }


        // Rules → Decisions (rules that fired in this trace influenced decisions — v1: cross-product of applied rules × decisions)

        foreach (string dk in DistinctDecisionKeys())
        {
            if (!nodeMap.TryGetValue(dk, out Guid decisionNid))
                continue;


            foreach (string ruleId in DistinctAppliedRuleIds(trace.AppliedRuleIds))
            {

                string rk = $"rule:{ruleId}";

                if (!nodeMap.TryGetValue(rk, out Guid ruleNid))
                    continue;

                AddEdge(ruleNid, decisionNid, ProvenanceEdgeType.TriggeredByRule);
            }
        }



        // Decisions → Artifacts (bundle payloads may repeat the same artifact row)

        foreach (IGrouping<Guid, SynthesizedArtifact> artifactGroup in artifacts.GroupBy(static artifact => artifact.ArtifactId))
        {
            SynthesizedArtifact representative =
                ProvenanceSnapshotRevisionHasher.SelectRevisionArtifactRepresentative(artifactGroup);

            string ak = $"artifact:{representative.ArtifactId:N}";

            if (!nodeMap.TryGetValue(ak, out Guid artifactNid))
                continue;

            IEnumerable<string> contributingDecisionIds = artifactGroup
                .SelectMany(static artifact => artifact.ContributingDecisionIds)
                .Select(NormalizeId)
                .Distinct(StringComparer.OrdinalIgnoreCase);

            foreach (string dId in contributingDecisionIds)
            {
                string dk = $"decision:{dId}";

                if (!nodeMap.TryGetValue(dk, out Guid decisionNid))
                    continue;

                AddEdge(decisionNid, artifactNid, ProvenanceEdgeType.ContributedToArtifact);
            }
        }


        // Decisions → Manifest

        foreach (string dk in DistinctDecisionKeys())
        {
            if (!nodeMap.TryGetValue(dk, out Guid decisionNid))
                continue;

            AddEdge(decisionNid, manifestNodeId, ProvenanceEdgeType.ContainedInManifest);
        }

        return result;

        ProvenanceNode CreateFindingNode(Finding finding)
        {
            Dictionary<string, string> metadata = new(StringComparer.OrdinalIgnoreCase)
            {
                ["findingType"] = NormalizeProvenanceMetadataValue(finding.FindingType),
                ["category"] = NormalizeProvenanceMetadataValue(finding.Category),
            };

            string? agentTraceId = ResolveAgentExecutionTraceId(finding);
            string displayTitle = ResolveFindingDisplayTitle(finding);

            ProvenanceNode node = new()
            {
                Type = ProvenanceNodeType.Finding,
                ReferenceId = NormalizeId(finding.FindingId),
                Name = displayTitle,
                Metadata = metadata,
                AgentExecutionTraceId = agentTraceId
            };

            if (!string.IsNullOrWhiteSpace(agentTraceId))
                metadata[ProvenanceMetadataKeys.AgentExecutionTraceId] = agentTraceId;

            return node;
        }

        static string? ResolveAgentExecutionTraceId(Finding finding)
        {
            if (!string.IsNullOrWhiteSpace(finding.AgentExecutionTraceId))
                return finding.AgentExecutionTraceId.Trim();

            return finding.Trace?.SourceAgentExecutionTraceId?.Trim();
        }

        static string ResolveGraphNodeDisplayName(GraphNode node)
        {
            string nodeId = NormalizeId(node.NodeId);

            return string.IsNullOrWhiteSpace(node.Label) ? nodeId : node.Label.Trim();
        }

        static string ResolveFindingDisplayTitle(Finding finding)
        {
            string findingId = NormalizeId(finding.FindingId);

            return string.IsNullOrWhiteSpace(finding.Title) ? findingId : finding.Title.Trim();
        }

        static string ResolveDecisionDisplayTitle(ResolvedArchitectureDecision decision)
        {
            string decisionId = NormalizeId(decision.DecisionId);

            return string.IsNullOrWhiteSpace(decision.Title) ? decisionId : decision.Title.Trim();
        }

        static string ResolveArtifactDisplayName(SynthesizedArtifact artifact)
        {
            string artifactId = artifact.ArtifactId.ToString("N");

            return string.IsNullOrWhiteSpace(artifact.Name) ? artifactId : artifact.Name.Trim();
        }

        Guid AddNode(string key, ProvenanceNode node)
        {
            if (nodeMap.TryGetValue(key, out Guid existingId))
            {
                ProvenanceNode existingNode = result.Nodes.First(n => n.Id == existingId);

                ProvenanceNodeCoalesce.ApplyMergedFields(existingNode, node);

                return existingId;
            }

            node.Id = Guid.NewGuid();
            result.Nodes.Add(node);
            nodeMap[key] = node.Id;
            return node.Id;
        }

        void AddEdge(Guid from, Guid to, ProvenanceEdgeType type)
        {
            result.Edges.Add(new ProvenanceEdge { Id = Guid.NewGuid(), FromNodeId = from, ToNodeId = to, Type = type });
        }

        static string NormalizeId(string id) => id.Trim();

        static string NormalizeProvenanceMetadataValue(string? value) =>
            string.IsNullOrWhiteSpace(value) ? string.Empty : value.Trim();

        static IEnumerable<string> DistinctAppliedRuleIds(IEnumerable<string>? appliedRuleIds) =>
            (appliedRuleIds ?? [])
                .Select(NormalizeId)
                .Where(static ruleId => ruleId.Length > 0)
                .Distinct(StringComparer.OrdinalIgnoreCase);

    }
}
