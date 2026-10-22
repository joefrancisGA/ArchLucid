using ArchLucid.Contracts.ArchitectureIntelligence;

namespace ArchLucid.Application.ArchitectureIntelligence;

/// <summary>
///     Deep-clones κ so callers, caches, and persistence layers do not share mutable element graphs.
/// </summary>
public static class ArchitectureKnowledgeModelCloner
{
    public static ArchitectureKnowledgeModel Clone(ArchitectureKnowledgeModel source)
    {
        ArgumentNullException.ThrowIfNull(source);

        return new ArchitectureKnowledgeModel
        {
            ModelId = source.ModelId,
            TenantId = source.TenantId,
            RunId = source.RunId,
            SchemaVersion = source.SchemaVersion,
            CreatedUtc = source.CreatedUtc,
            UpdatedUtc = source.UpdatedUtc,
            Elements = source.Elements
                .Select(CloneElement)
                .ToList(),
            DeclaredPriorities = [.. source.DeclaredPriorities],
            FramingAnswers = new Dictionary<string, string>(source.FramingAnswers),
            IsProvisionalSynthesis = source.IsProvisionalSynthesis,
        };
    }

    public static ArchitectureModelElement CloneElement(ArchitectureModelElement element)
    {
        ArgumentNullException.ThrowIfNull(element);

        return new ArchitectureModelElement
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
        };
    }

    public static ClaimProvenance CloneProvenance(ClaimProvenance provenance)
    {
        ArgumentNullException.ThrowIfNull(provenance);

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
