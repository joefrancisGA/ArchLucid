using System.Text;
using ArchiForge.Contracts.Agents;
using ArchiForge.Contracts.Decisions;

namespace ArchiForge.DecisionEngine.Services;

/// <summary>
/// Decision Engine v2: weighted argument resolution (deterministic, v1 scoring model).
/// </summary>
public sealed class DecisionEngineV2 : IDecisionEngineV2
{
    public Task<IReadOnlyList<DecisionNode>> ResolveAsync(
        string runId,
        IReadOnlyCollection<AgentResult> results,
        IReadOnlyCollection<AgentEvaluation> evaluations,
        AgentEvidencePackage evidence,
        CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(runId);
        ArgumentNullException.ThrowIfNull(results);
        ArgumentNullException.ThrowIfNull(evaluations);
        ArgumentNullException.ThrowIfNull(evidence);

        // Extract candidate decisions from agent proposals in a simple, interpretable way.
        // Topics are stable string keys so replay/diff can compare over time.
        var topics = new Dictionary<string, DecisionNode>(StringComparer.OrdinalIgnoreCase);

        foreach (var r in results)
        {
            cancellationToken.ThrowIfCancellationRequested();
            if (r?.ProposedChanges is null) continue;

            foreach (var svc in r.ProposedChanges.AddedServices ?? [])
            {
                if (string.IsNullOrWhiteSpace(svc.ServiceName)) continue;
                AddOrUpdateIncludeDecision(topics, $"Service:{svc.ServiceName}", r);
            }

            foreach (var ds in r.ProposedChanges.AddedDatastores ?? [])
            {
                if (string.IsNullOrWhiteSpace(ds.DatastoreName)) continue;
                AddOrUpdateIncludeDecision(topics, $"Datastore:{ds.DatastoreName}", r);
            }

            foreach (var rel in r.ProposedChanges.AddedRelationships ?? [])
            {
                if (string.IsNullOrWhiteSpace(rel.SourceId) || string.IsNullOrWhiteSpace(rel.TargetId)) continue;
                AddOrUpdateIncludeDecision(topics, $"Relationship:{rel.SourceId}->{rel.TargetId}", r);
            }

            foreach (var control in r.ProposedChanges.RequiredControls ?? [])
            {
                if (string.IsNullOrWhiteSpace(control)) continue;
                AddOrUpdateIncludeDecision(topics, $"Control:{control}", r);
            }
        }

        // Apply evaluations to influence option scores.
        foreach (var e in evaluations)
        {
            cancellationToken.ThrowIfCancellationRequested();
            if (e is null) continue;
            if (string.IsNullOrWhiteSpace(e.Topic)) continue;

            if (!topics.TryGetValue(e.Topic, out var node))
                continue;

            var option = ResolveTargetOption(node, e.OptionDescription);
            if (option is null) continue;

            if (string.Equals(e.EvaluationType, "support", StringComparison.OrdinalIgnoreCase))
            {
                option.SupportScore += e.ConfidenceDelta;
                node.SupportingEvaluationIds.Add(e.EvaluationId);
            }
            else if (string.Equals(e.EvaluationType, "oppose", StringComparison.OrdinalIgnoreCase))
            {
                option.OppositionScore += Math.Abs(e.ConfidenceDelta);
                node.OpposingEvaluationIds.Add(e.EvaluationId);
            }

            if (e.EvidenceRefs.Count > 0)
            {
                option.EvidenceRefs = option.EvidenceRefs
                    .Union(e.EvidenceRefs, StringComparer.OrdinalIgnoreCase)
                    .ToList();
            }
        }

        // Resolve winner per topic.
        foreach (var node in topics.Values)
        {
            cancellationToken.ThrowIfCancellationRequested();
            if (node.Options.Count == 0) continue;

            var winner = node.Options
                .OrderByDescending(o => o.FinalScore)
                .ThenByDescending(o => o.BaseConfidence)
                .First();

            node.SelectedOptionId = winner.OptionId;
            node.Confidence = winner.FinalScore;
            node.Rationale = BuildRationale(node, winner);
        }

        return Task.FromResult<IReadOnlyList<DecisionNode>>(
            topics.Values
                .OrderBy(n => n.Topic, StringComparer.OrdinalIgnoreCase)
                .ToList());
    }

    private static void AddOrUpdateIncludeDecision(
        Dictionary<string, DecisionNode> topics,
        string topic,
        AgentResult source)
    {
        if (!topics.TryGetValue(topic, out var node))
        {
            node = new DecisionNode
            {
                Topic = topic,
                Options = new List<DecisionOption>
                {
                    new()
                    {
                        Description = "Include",
                        BaseConfidence = 0.0
                    },
                    new()
                    {
                        Description = "Exclude",
                        BaseConfidence = 0.0
                    }
                }
            };
            topics[topic] = node;
        }

        var include = node.Options.First(o => string.Equals(o.Description, "Include", StringComparison.OrdinalIgnoreCase));
        include.BaseConfidence = Math.Max(include.BaseConfidence, source.Confidence);
        if (source.EvidenceRefs.Count > 0)
        {
            include.EvidenceRefs = include.EvidenceRefs
                .Union(source.EvidenceRefs, StringComparer.OrdinalIgnoreCase)
                .ToList();
        }
    }

    private static DecisionOption? ResolveTargetOption(DecisionNode node, string? optionDescription)
    {
        if (!string.IsNullOrWhiteSpace(optionDescription))
        {
            return node.Options.FirstOrDefault(o =>
                string.Equals(o.Description, optionDescription.Trim(), StringComparison.OrdinalIgnoreCase));
        }

        // Default to affecting "Include" if present.
        return node.Options.FirstOrDefault(o =>
            string.Equals(o.Description, "Include", StringComparison.OrdinalIgnoreCase))
               ?? node.Options.FirstOrDefault();
    }

    private static string BuildRationale(DecisionNode node, DecisionOption winner)
    {
        var sb = new StringBuilder();
        sb.Append($"Selected '{winner.Description}' for '{node.Topic}'. ");
        sb.Append($"Score={winner.FinalScore:F2} (base={winner.BaseConfidence:F2}, +support={winner.SupportScore:F2}, -oppose={winner.OppositionScore:F2}).");

        if (node.SupportingEvaluationIds.Count > 0)
        {
            sb.Append($" SupportingEvaluations={node.SupportingEvaluationIds.Count}.");
        }

        if (node.OpposingEvaluationIds.Count > 0)
        {
            sb.Append($" OpposingEvaluations={node.OpposingEvaluationIds.Count}.");
        }

        return sb.ToString();
    }
}

