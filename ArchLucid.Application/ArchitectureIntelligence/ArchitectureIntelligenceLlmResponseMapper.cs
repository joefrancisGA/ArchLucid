using ArchLucid.Contracts.ArchitectureIntelligence;

namespace ArchLucid.Application.ArchitectureIntelligence;

using static ArchitectureIntelligenceLlmResponseShapes;

internal static class ArchitectureIntelligenceLlmResponseMapper
{
    internal static string BuildModelSummaryPrompt(ArchitectureKnowledgeModel model, QualityDimension? dimension)
    {
        IEnumerable<ArchitectureModelElement> elements = model.Elements;

        if (dimension is not null)
        {
            elements = elements.Take(50);
        }

        string elementSummary = string.Join(
            "\n",
            elements.Select(element => $"- [{element.Kind}] {element.Name}: {element.Description ?? element.Provenance.Notes}"));

        string dimensionLine = dimension is null ? string.Empty : $"Focus dimension: {dimension}\n";

        return dimensionLine +
               $"ModelId: {model.ModelId}\n" +
               $"TenantId: {model.TenantId}\n" +
               $"Elements ({model.Elements.Count}):\n{elementSummary}";
    }

    internal static ArchitectureModelElement? MapExtractionElement(ExtractionElementShape item, string artifactId)
    {
        if (string.IsNullOrWhiteSpace(item.Name))
        {
            return null;
        }

        if (!Enum.TryParse(item.Kind, ignoreCase: true, out ArchitectureElementKind kind))
        {
            kind = ArchitectureElementKind.Assumption;
        }

        SupportStatus supportStatus = ParseSupportStatus(item.SupportStatus);
        ClaimOrigin origin = ParseClaimOrigin(item.Origin);

        return new ArchitectureModelElement
        {
            ElementId = Guid.NewGuid().ToString("N"),
            Kind = kind,
            Name = item.Name.Trim(),
            Description = item.Description?.Trim(),
            ExtractionConfidence = ClampConfidence(item.Confidence),
            SourcePassageIds = [artifactId],
            Provenance = new ClaimProvenance
            {
                Origin = origin,
                SupportStatus = supportStatus,
                Confidence = ClampConfidence(item.Confidence),
                SourceArtifactId = artifactId,
                Notes = item.Notes?.Trim(),
            },
        };
    }

    internal static SpecialistReviewFinding MapReviewFinding(ReviewFindingShape item, QualityDimension dimension)
    {
        ReviewConclusion conclusion = ParseReviewConclusion(item.Conclusion);
        EvidenceCondition evidenceCondition = ParseEvidenceCondition(item.EvidenceCondition);

        return new SpecialistReviewFinding
        {
            FindingId = Guid.NewGuid().ToString("N"),
            Dimension = dimension,
            Title = item.Title?.Trim() ?? string.Empty,
            Rationale = item.Rationale?.Trim() ?? string.Empty,
            Conclusion = conclusion,
            EvidenceCondition = evidenceCondition,
            GovernanceDisposition = conclusion == ReviewConclusion.Pass
                ? GovernanceDisposition.Accepted
                : GovernanceDisposition.Open,
            Confidence = ClampConfidence(item.Confidence),
            Severity = string.IsNullOrWhiteSpace(item.Severity) ? "Medium" : item.Severity.Trim(),
            Provenance = new ClaimProvenance
            {
                Origin = ClaimOrigin.SystemProposed,
                SupportStatus = ParseSupportStatus(item.SupportStatus),
                Confidence = ClampConfidence(item.Confidence),
                Notes = item.Notes?.Trim(),
            },
        };
    }

    internal static ArchitectureRecommendation MapRecommendation(RecommendationShape item)
    {
        return new ArchitectureRecommendation
        {
            RecommendationId = Guid.NewGuid().ToString("N"),
            Problem = item.Problem!.Trim(),
            Evidence = item.Evidence?.Trim() ?? string.Empty,
            AffectedRequirementOrQualityAttribute = item.AffectedRequirementOrQualityAttribute?.Trim() ?? string.Empty,
            ConsequenceOfInaction = item.ConsequenceOfInaction?.Trim() ?? string.Empty,
            ProposedChange = item.ProposedChange?.Trim() ?? string.Empty,
            Alternatives = item.Alternatives?
                .Where(alternative => !string.IsNullOrWhiteSpace(alternative))
                .Select(alternative => alternative.Trim())
                .ToList() ?? [],
            ValidationMethod = item.ValidationMethod?.Trim() ?? "Re-run specialist review after design update.",
            Confidence = ClampConfidence(item.Confidence),
            RequiresHumanApproval = item.RequiresHumanApproval ?? false,
            Effort = new EffortEstimate
            {
                Band = string.IsNullOrWhiteSpace(item.EffortBand) ? "Medium" : item.EffortBand.Trim(),
                BasisNotes = item.Notes?.Trim() ?? string.Empty,
                ImplementationEstimateAvailable = true,
            },
            RiskReduction = new RiskReductionEstimate
            {
                Level = string.IsNullOrWhiteSpace(item.RiskReductionLevel) ? "Moderate" : item.RiskReductionLevel.Trim(),
                ScenarioNotes = item.Notes?.Trim(),
            },
            Provenance = new ClaimProvenance
            {
                Origin = ClaimOrigin.SystemProposed,
                SupportStatus = SupportStatus.IndirectlySupported,
                Confidence = ClampConfidence(item.Confidence),
                Notes = item.Notes?.Trim(),
            },
        };
    }

    private static double ClampConfidence(double? confidence)
    {
        double value = confidence ?? 0.5;

        if (value < 0)
        {
            return 0;
        }

        if (value > 1)
        {
            return 1;
        }

        return value;
    }

    private static SupportStatus ParseSupportStatus(string? value)
    {
        if (Enum.TryParse(value, ignoreCase: true, out SupportStatus parsed))
        {
            return parsed;
        }

        return SupportStatus.NotYetEvaluated;
    }

    private static ClaimOrigin ParseClaimOrigin(string? value)
    {
        if (Enum.TryParse(value, ignoreCase: true, out ClaimOrigin parsed))
        {
            return parsed;
        }

        return ClaimOrigin.ModelInferred;
    }

    private static ReviewConclusion ParseReviewConclusion(string? value)
    {
        if (Enum.TryParse(value, ignoreCase: true, out ReviewConclusion parsed))
        {
            return parsed;
        }

        return ReviewConclusion.Indeterminate;
    }

    private static EvidenceCondition ParseEvidenceCondition(string? value)
    {
        if (Enum.TryParse(value, ignoreCase: true, out EvidenceCondition parsed))
        {
            return parsed;
        }

        return EvidenceCondition.Insufficient;
    }
}
