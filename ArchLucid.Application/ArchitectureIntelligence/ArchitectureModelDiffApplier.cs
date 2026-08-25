using ArchLucid.Contracts.ArchitectureIntelligence;

namespace ArchLucid.Application.ArchitectureIntelligence;

/// <summary>
/// Produces an explicit model diff for a proposed recommendation (TB-1987).
/// Does not mutate the caller's before-model instance.
/// </summary>
public sealed class ArchitectureModelDiffApplier : IArchitectureModelDiffApplier
{
    public ArchitectureModelDiff ApplyRecommendation(
        ArchitectureKnowledgeModel beforeModel,
        ArchitectureRecommendation recommendation)
    {
        ArgumentNullException.ThrowIfNull(beforeModel);
        ArgumentNullException.ThrowIfNull(recommendation);

        ArchitectureKnowledgeModel afterModel = CloneModel(beforeModel);
        List<ArchitectureModelDiffEntry> entries = [];

        string recommendationElementId = Guid.NewGuid().ToString("N");
        afterModel.Elements.Add(new ArchitectureModelElement
        {
            ElementId = recommendationElementId,
            Kind = ArchitectureElementKind.Recommendation,
            Name = recommendation.Problem,
            Description = recommendation.ProposedChange,
            ExtractionConfidence = recommendation.Confidence,
            Provenance = CloneProvenance(recommendation.Provenance),
            Properties = new Dictionary<string, string>(StringComparer.Ordinal)
            {
                ["recommendationId"] = recommendation.RecommendationId,
                ["proposedChange"] = recommendation.ProposedChange,
            },
        });

        entries.Add(new ArchitectureModelDiffEntry
        {
            ElementId = recommendationElementId,
            ChangeKind = "Added",
            ElementKind = ArchitectureElementKind.Recommendation,
            Description = $"Proposed recommendation: {recommendation.Problem}",
        });

        ArchitectureModelDiffDesignDeltaApplier.ApplyDesignDeltas(
            afterModel,
            recommendation,
            recommendationElementId,
            entries);

        if (recommendation.ProposedChange.Contains("trust boundary", StringComparison.OrdinalIgnoreCase)
            && !afterModel.Elements.Any(element => element.Kind == ArchitectureElementKind.TrustBoundary))
        {
            string trustBoundaryId = Guid.NewGuid().ToString("N");
            afterModel.Elements.Add(new ArchitectureModelElement
            {
                ElementId = trustBoundaryId,
                Kind = ArchitectureElementKind.TrustBoundary,
                Name = "Proposed trust boundary",
                Description = recommendation.ProposedChange,
                ExtractionConfidence = recommendation.Confidence,
                Provenance = new ClaimProvenance
                {
                    Origin = ClaimOrigin.SystemProposed,
                    SupportStatus = SupportStatus.IndirectlySupported,
                    Confidence = recommendation.Confidence,
                    Notes = "Proposed by recommendation applier; not yet user-accepted.",
                },
            });

            entries.Add(new ArchitectureModelDiffEntry
            {
                ElementId = trustBoundaryId,
                ChangeKind = "Added",
                ElementKind = ArchitectureElementKind.TrustBoundary,
                Description = "Proposed trust boundary from recommendation.",
            });
        }

        string? decisionId = afterModel.Elements
            .FirstOrDefault(element => element.Kind == ArchitectureElementKind.Decision
                && element.Name.Contains(recommendation.AffectedRequirementOrQualityAttribute, StringComparison.OrdinalIgnoreCase))
            ?.ElementId;

        if (decisionId is null
            && !string.IsNullOrWhiteSpace(recommendation.AffectedRequirementOrQualityAttribute))
        {
            decisionId = Guid.NewGuid().ToString("N");
            afterModel.Elements.Add(new ArchitectureModelElement
            {
                ElementId = decisionId,
                Kind = ArchitectureElementKind.Decision,
                Name = $"Decision: {recommendation.AffectedRequirementOrQualityAttribute}",
                Description = recommendation.ProposedChange,
                ExtractionConfidence = recommendation.Confidence,
                RelatedElementIds = [recommendationElementId],
                Provenance = new ClaimProvenance
                {
                    Origin = ClaimOrigin.SystemProposed,
                    SupportStatus = SupportStatus.IndirectlySupported,
                    Confidence = recommendation.Confidence,
                },
            });

            entries.Add(new ArchitectureModelDiffEntry
            {
                ElementId = decisionId,
                ChangeKind = "Added",
                ElementKind = ArchitectureElementKind.Decision,
                Description = "Proposed decision linked to recommendation.",
            });
        }

        afterModel.UpdatedUtc = TimeProvider.System.GetUtcNow().UtcDateTime;

        return new ArchitectureModelDiff
        {
            RecommendationId = recommendation.RecommendationId,
            Entries = entries,
            BeforeModel = beforeModel,
            AfterModel = afterModel,
        };
    }

    private static ArchitectureKnowledgeModel CloneModel(ArchitectureKnowledgeModel source)
    {
        return new ArchitectureKnowledgeModel
        {
            ModelId = source.ModelId,
            TenantId = source.TenantId,
            RunId = source.RunId,
            SchemaVersion = source.SchemaVersion,
            CreatedUtc = source.CreatedUtc,
            UpdatedUtc = source.UpdatedUtc,
            Elements = source.Elements
                .Select(element => new ArchitectureModelElement
                {
                    ElementId = element.ElementId,
                    Kind = element.Kind,
                    Name = element.Name,
                    Description = element.Description,
                    Provenance = CloneProvenance(element.Provenance),
                    ExtractionConfidence = element.ExtractionConfidence,
                    SourcePassageIds = [.. element.SourcePassageIds],
                    RelatedElementIds = [.. element.RelatedElementIds],
                    Properties = new Dictionary<string, string>(element.Properties),
                    LifecycleScope = element.LifecycleScope,
                })
                .ToList(),
            DeclaredPriorities = [.. source.DeclaredPriorities],
            FramingAnswers = new Dictionary<string, string>(source.FramingAnswers),
            IsProvisionalSynthesis = source.IsProvisionalSynthesis,
        };
    }

    private static ClaimProvenance CloneProvenance(ClaimProvenance provenance)
    {
        SourcePassageLocator? locator = provenance.PassageLocator is null
            ? null
            : new SourcePassageLocator
            {
                ArtifactId = provenance.PassageLocator.ArtifactId,
                StartOffset = provenance.PassageLocator.StartOffset,
                EndOffset = provenance.PassageLocator.EndOffset,
                Quote = provenance.PassageLocator.Quote,
                SectionPath = provenance.PassageLocator.SectionPath,
            };

        return new ClaimProvenance
        {
            Origin = provenance.Origin,
            SupportStatus = provenance.SupportStatus,
            Confidence = provenance.Confidence,
            SourceArtifactId = provenance.SourceArtifactId,
            PassageLocator = locator,
            Notes = provenance.Notes,
        };
    }
}
