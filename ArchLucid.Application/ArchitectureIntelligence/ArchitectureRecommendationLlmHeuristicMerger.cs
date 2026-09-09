using ArchLucid.Contracts.ArchitectureIntelligence;

namespace ArchLucid.Application.ArchitectureIntelligence;

/// <summary>LP-07 — merge LLM recommendation prose onto heuristic rows without stripping <see cref="ClaimOrigin"/>.</summary>
public static class ArchitectureRecommendationLlmHeuristicMerger
{
    internal const string LlmOverlayProvenanceNote =
        "Prose refined by model; origin remains the specialist finding recommendation.";

    internal const string ModelProposedProvenanceNote =
        "Model-proposed recommendation without a matching specialist finding row.";

    public static IReadOnlyList<ArchitectureRecommendation> Merge(
        IReadOnlyList<ArchitectureRecommendation> heuristicRecommendations,
        IReadOnlyList<ArchitectureRecommendation> llmRecommendations,
        IReadOnlyList<SpecialistReviewFinding> findings)
    {
        ArgumentNullException.ThrowIfNull(heuristicRecommendations);
        ArgumentNullException.ThrowIfNull(llmRecommendations);
        ArgumentNullException.ThrowIfNull(findings);

        if (llmRecommendations.Count == 0)
        {
            return heuristicRecommendations;
        }

        HashSet<string> mergedHeuristicIds = new(StringComparer.Ordinal);
        List<ArchitectureRecommendation> merged = [];

        foreach (ArchitectureRecommendation llmRecommendation in llmRecommendations)
        {
            ArchitectureRecommendation? heuristicMatch = TryFindHeuristicMatch(
                llmRecommendation,
                heuristicRecommendations,
                findings);

            if (heuristicMatch is not null)
            {
                merged.Add(MergeHeuristicWithLlmOverlay(heuristicMatch, llmRecommendation));
                mergedHeuristicIds.Add(heuristicMatch.RecommendationId);

                continue;
            }

            merged.Add(ApplyModelProposedProvenance(llmRecommendation));
        }

        foreach (ArchitectureRecommendation heuristicRecommendation in heuristicRecommendations)
        {

            if (!mergedHeuristicIds.Contains(heuristicRecommendation.RecommendationId))
            {
                merged.Add(heuristicRecommendation);
            }
        }

        return merged;
    }

    internal static ArchitectureRecommendation MergeHeuristicWithLlmOverlay(
        ArchitectureRecommendation heuristic,
        ArchitectureRecommendation llmOverlay)
    {
        ArgumentNullException.ThrowIfNull(heuristic);
        ArgumentNullException.ThrowIfNull(llmOverlay);

        ClaimProvenance provenance = ArchitectureKnowledgeModelCloner.CloneProvenance(heuristic.Provenance);
        provenance.Notes = AppendNote(provenance.Notes, LlmOverlayProvenanceNote);

        return new ArchitectureRecommendation
        {
            RecommendationId = heuristic.RecommendationId,
            Problem = PreferNonEmpty(llmOverlay.Problem, heuristic.Problem),
            Evidence = PreferNonEmpty(llmOverlay.Evidence, heuristic.Evidence),
            AffectedRequirementOrQualityAttribute = PreferNonEmpty(
                llmOverlay.AffectedRequirementOrQualityAttribute,
                heuristic.AffectedRequirementOrQualityAttribute),
            ConsequenceOfInaction = PreferNonEmpty(llmOverlay.ConsequenceOfInaction, heuristic.ConsequenceOfInaction),
            ProposedChange = PreferNonEmpty(llmOverlay.ProposedChange, heuristic.ProposedChange),
            Alternatives = llmOverlay.Alternatives.Count > 0 ? llmOverlay.Alternatives : heuristic.Alternatives,
            AlternativeOptions = llmOverlay.AlternativeOptions.Count > 0
                ? llmOverlay.AlternativeOptions
                : heuristic.AlternativeOptions,
            TradeOffs = heuristic.TradeOffs,
            Effort = heuristic.Effort,
            RiskReduction = heuristic.RiskReduction,
            Dependencies = heuristic.Dependencies,
            ValidationMethod = PreferNonEmpty(llmOverlay.ValidationMethod, heuristic.ValidationMethod),
            Confidence = llmOverlay.Confidence > 0 ? llmOverlay.Confidence : heuristic.Confidence,
            RequiresHumanApproval = heuristic.RequiresHumanApproval || llmOverlay.RequiresHumanApproval,
            Provenance = provenance,
        };
    }

    internal static ArchitectureRecommendation ApplyModelProposedProvenance(ArchitectureRecommendation recommendation)
    {
        ArgumentNullException.ThrowIfNull(recommendation);

        bool evidenceMissing = string.IsNullOrWhiteSpace(recommendation.Evidence);

        recommendation.Provenance = new ClaimProvenance
        {
            Origin = ClaimOrigin.ModelInferred,
            SupportStatus = evidenceMissing ? SupportStatus.Unsupported : SupportStatus.IndirectlySupported,
            Confidence = recommendation.Confidence,
            Notes = AppendNote(recommendation.Provenance?.Notes, ModelProposedProvenanceNote),
        };

        if (evidenceMissing)
        {
            recommendation.RequiresHumanApproval = true;
        }

        return recommendation;
    }

    internal static ArchitectureRecommendation? TryFindHeuristicMatch(
        ArchitectureRecommendation llmRecommendation,
        IReadOnlyList<ArchitectureRecommendation> heuristicRecommendations,
        IReadOnlyList<SpecialistReviewFinding> findings)
    {
        ArgumentNullException.ThrowIfNull(llmRecommendation);
        ArgumentNullException.ThrowIfNull(heuristicRecommendations);
        ArgumentNullException.ThrowIfNull(findings);

        foreach (SpecialistReviewFinding finding in findings)
        {

            if (!MatchesFinding(llmRecommendation, finding))
            {
                continue;
            }

            ArchitectureRecommendation? heuristic = heuristicRecommendations.FirstOrDefault(candidate =>
                string.Equals(candidate.Problem, finding.Title, StringComparison.OrdinalIgnoreCase));

            if (heuristic is not null)
            {
                return heuristic;
            }
        }

        return heuristicRecommendations.FirstOrDefault(candidate =>
            string.Equals(
                candidate.AffectedRequirementOrQualityAttribute,
                llmRecommendation.AffectedRequirementOrQualityAttribute,
                StringComparison.OrdinalIgnoreCase)
            && string.Equals(candidate.Problem, llmRecommendation.Problem, StringComparison.OrdinalIgnoreCase));
    }

    internal static bool MatchesFinding(
        ArchitectureRecommendation recommendation,
        SpecialistReviewFinding finding)
    {
        ArgumentNullException.ThrowIfNull(recommendation);
        ArgumentNullException.ThrowIfNull(finding);

        if (string.Equals(recommendation.Problem, finding.Title, StringComparison.OrdinalIgnoreCase))
        {
            return true;
        }

        if (recommendation.ProposedChange.Contains(finding.Title, StringComparison.OrdinalIgnoreCase))
        {
            return true;
        }

        if (!string.IsNullOrWhiteSpace(finding.Title)
            && recommendation.Problem.Contains(finding.Title, StringComparison.OrdinalIgnoreCase))
        {
            return true;
        }

        return false;
    }

    private static string PreferNonEmpty(string candidate, string fallback) =>
        string.IsNullOrWhiteSpace(candidate) ? fallback : candidate.Trim();

    private static string AppendNote(string? existing, string addition)
    {
        if (string.IsNullOrWhiteSpace(existing))
        {
            return addition;
        }

        if (existing.Contains(addition, StringComparison.Ordinal))
        {
            return existing;
        }

        return $"{existing.Trim()} {addition}";
    }
}
