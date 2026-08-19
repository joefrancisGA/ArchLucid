using ArchLucid.Contracts.Findings;
using ArchLucid.Decisioning.Models;

namespace ArchLucid.Decisioning.Findings;

/// <summary>
///     Strict CI/runtime guard ensuring agent-mapped findings retain hard-evidence linkage in
///     <see cref="ExplainabilityTrace" /> before sponsor or governance surfaces consume them.
/// </summary>
public static class AgentExplainabilityTraceValidator
{
    private const string EvidenceNotePrefix = "evidence:";

    /// <summary>
    ///     Minimum populated trace dimensions (of seven) required for agent findings that cite evidence.
    ///     Notes, rules, decisions, and reasoning or citations must be present.
    /// </summary>
    public const int MinimumPopulatedFieldCountWithEvidence = 4;

    /// <summary>
    ///     Validates a persisted-shaped finding produced from agent output.
    /// </summary>
    public static AgentExplainabilityTraceValidationResult ValidateMappedAgentFinding(
        Finding mappedFinding,
        ArchitectureFinding sourceFinding)
    {
        ArgumentNullException.ThrowIfNull(mappedFinding);
        ArgumentNullException.ThrowIfNull(sourceFinding);

        List<string> errors = [];

        if (mappedFinding.Trace is null)
        {
            errors.Add("ExplainabilityTrace is required on agent-mapped findings.");

            return AgentExplainabilityTraceValidationResult.Failure(errors);
        }

        ExplainabilityTrace trace = mappedFinding.Trace;
        TraceCompletenessScore completeness = ExplainabilityTraceCompletenessAnalyzer.AnalyzeFinding(mappedFinding);

        if (sourceFinding.EvidenceRefs.Count == 0)
        {
            errors.Add(
                "Agent findings must cite at least one evidence ref so sponsor surfaces can trace back to manifest evidence.");
        }
        else
        {
            ValidateEvidenceAnchors(sourceFinding, trace, completeness, errors);
        }

        if (sourceFinding.EvidenceRefs.Count > 0
            && completeness.PopulatedFieldCount < MinimumPopulatedFieldCountWithEvidence)
        {
            errors.Add(
                $"ExplainabilityTrace completeness {completeness.PopulatedFieldCount}/7 is below the agent minimum "
                + $"{MinimumPopulatedFieldCountWithEvidence}/7. Missing: {string.Join(", ", completeness.MissingTraceFields)}.");
        }

        if (errors.Count == 0)
            return AgentExplainabilityTraceValidationResult.Success();

        return AgentExplainabilityTraceValidationResult.Failure(errors);
    }

    private static void ValidateEvidenceAnchors(
        ArchitectureFinding sourceFinding,
        ExplainabilityTrace trace,
        TraceCompletenessScore completeness,
        List<string> errors)
    {
        HashSet<string> noteEvidenceRefs = trace.Notes
            .Where(static note => note.StartsWith(EvidenceNotePrefix, StringComparison.OrdinalIgnoreCase))
            .Select(static note => note[EvidenceNotePrefix.Length..])
            .Where(static value => !string.IsNullOrWhiteSpace(value))
            .ToHashSet(StringComparer.OrdinalIgnoreCase);

        foreach (string evidenceRef in sourceFinding.EvidenceRefs)
        {
            if (string.IsNullOrWhiteSpace(evidenceRef))
            {
                errors.Add("EvidenceRefs must not contain blank entries.");

                continue;
            }

            bool anchoredInNotes = noteEvidenceRefs.Contains(evidenceRef);

            bool anchoredInCitations = trace.Citations.Any(citation =>
                string.Equals(citation, evidenceRef, StringComparison.OrdinalIgnoreCase));

            if (!anchoredInNotes && !anchoredInCitations)
            {
                errors.Add(
                    $"Evidence ref '{evidenceRef}' is not anchored in ExplainabilityTrace Notes or Citations.");
            }
        }

        if (!completeness.HasRulesApplied)
            errors.Add("ExplainabilityTrace.RulesApplied must identify the producing agent or rule.");

        if (!completeness.HasDecisionsTaken)
            errors.Add("ExplainabilityTrace.DecisionsTaken must record the agent outcome path.");
    }
}
