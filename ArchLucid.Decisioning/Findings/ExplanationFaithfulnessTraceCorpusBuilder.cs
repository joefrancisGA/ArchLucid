using System.Text;

using ArchLucid.Core.Explanation;
using ArchLucid.Decisioning.Models;

namespace ArchLucid.Decisioning.Findings;

internal static class ExplanationFaithfulnessTraceCorpusBuilder
{
    internal static string BuildExplanationBlob(ExplanationResult r)
    {
        StringBuilder sb = new();

        Append(sb, r.Summary);
        Append(sb, r.DetailedNarrative);
        Append(sb, r.RawText);

        foreach (string line in r.KeyDrivers)

            Append(sb, line);

        foreach (string line in r.RiskImplications)

            Append(sb, line);

        foreach (string line in r.CostImplications)

            Append(sb, line);

        foreach (string line in r.ComplianceImplications)

            Append(sb, line);

        if (r.Structured is not null)

            Append(sb, r.Structured.Reasoning);

        return sb.ToString();
    }

    internal static string BuildTraceBlob(FindingsSnapshot snapshot)
    {
        StringBuilder sb = new();

        foreach (Finding f in snapshot.Findings)
        {
            Append(sb, f.FindingId);
            Append(sb, f.Title);
            Append(sb, f.Rationale);
            Append(sb, f.EngineType);
            Append(sb, f.FindingType);
            Append(sb, f.Category);

            foreach (string id in f.RelatedNodeIds)

                Append(sb, id);

            ExplainabilityTrace t = f.Trace;
            Append(sb, t.SourceAgentExecutionTraceId);

            foreach (string s in t.GraphNodeIdsExamined)

                Append(sb, s);

            foreach (string s in t.RulesApplied)

                Append(sb, s);

            foreach (string s in t.DecisionsTaken)

                Append(sb, s);

            foreach (string s in t.AlternativePathsConsidered)

                Append(sb, s);

            foreach (string s in t.Notes)

                Append(sb, s);
        }

        return sb.ToString().ToLowerInvariant();
    }

    private static void Append(StringBuilder sb, string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
            return;

        sb.Append(' ');
        sb.Append(value);
    }
}
