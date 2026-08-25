using ArchLucid.Contracts.ArchitectureIntelligence;

namespace ArchLucid.Application.ArchitectureIntelligence;

public sealed class IncrementalReReviewService : IIncrementalReReviewService
{
    private const string PartialScopeDisclaimer =
        "Only the affected subgraph was re-reviewed. Unreviewed remainder of the model is not guaranteed safe; "
        + "global invariant checks still apply.";

    public async Task<IncrementalReReviewResult> ReReviewAsync(
        ArchitectureKnowledgeModel model,
        ReReviewScope scope,
        IAsyncSpecialistReviewService specialistService,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(model);
        ArgumentNullException.ThrowIfNull(scope);
        ArgumentNullException.ThrowIfNull(specialistService);

        List<GlobalInvariantCheckResult> globalInvariantResults = [];
        bool fullReReviewTriggered = scope.FullReReview || scope.Trigger.HasValue;
        List<SpecialistReviewResult> specialistResults = [];
        string? partialScopeDisclaimer = null;

        if (fullReReviewTriggered)
        {
            specialistResults.Add(await specialistService.ReviewAsync(model, cancellationToken: cancellationToken)
                .ConfigureAwait(false));
        }
        else if (scope.AffectedElementIds.Count > 0)
        {
            ArchitectureKnowledgeModel scopedModel = BuildScopedModel(model, scope.AffectedElementIds);
            specialistResults.Add(await specialistService.ReviewAsync(scopedModel, cancellationToken: cancellationToken)
                .ConfigureAwait(false));
            partialScopeDisclaimer = PartialScopeDisclaimer;
        }

        if (scope.IncludeGlobalInvariantChecks)
        {
            globalInvariantResults = RunGlobalInvariantChecks(model);
        }

        return new IncrementalReReviewResult
        {
            Scope = scope,
            SpecialistResults = specialistResults,
            GlobalInvariantResults = globalInvariantResults,
            FullReReviewTriggered = fullReReviewTriggered,
            PartialScopeDisclaimer = partialScopeDisclaimer,
        };
    }

    private static ArchitectureKnowledgeModel BuildScopedModel(
        ArchitectureKnowledgeModel model,
        IReadOnlyList<string> affectedElementIds)
    {
        HashSet<string> includedIds = affectedElementIds.ToHashSet(StringComparer.Ordinal);

        bool relatedExpansionAddedElements;

        do
        {
            relatedExpansionAddedElements = false;

            foreach (ArchitectureModelElement element in model.Elements)
            {
                if (!includedIds.Contains(element.ElementId))
                {
                    continue;
                }

                foreach (string relatedId in element.RelatedElementIds)
                {
                    if (includedIds.Add(relatedId))
                    {
                        relatedExpansionAddedElements = true;
                    }
                }
            }

            foreach (ArchitectureModelElement element in model.Elements)
            {
                if (includedIds.Contains(element.ElementId))
                {
                    continue;
                }

                if (!element.RelatedElementIds.Any(relatedId => includedIds.Contains(relatedId)))
                {
                    continue;
                }

                if (includedIds.Add(element.ElementId))
                {
                    relatedExpansionAddedElements = true;
                }
            }
        }
        while (relatedExpansionAddedElements);

        return new ArchitectureKnowledgeModel
        {
            ModelId = model.ModelId,
            TenantId = model.TenantId,
            RunId = model.RunId,
            SchemaVersion = model.SchemaVersion,
            CreatedUtc = model.CreatedUtc,
            UpdatedUtc = model.UpdatedUtc,
            Elements = model.Elements
                .Where(element => includedIds.Contains(element.ElementId))
                .Select(CloneScopedElement)
                .ToList(),
            DeclaredPriorities = [.. model.DeclaredPriorities],
            FramingAnswers = new Dictionary<string, string>(model.FramingAnswers),
            IsProvisionalSynthesis = model.IsProvisionalSynthesis,
        };
    }

    private static ArchitectureModelElement CloneScopedElement(ArchitectureModelElement element)
    {
        return new ArchitectureModelElement
        {
            ElementId = element.ElementId,
            Kind = element.Kind,
            Name = element.Name,
            Description = element.Description,
            Provenance = CloneScopedProvenance(element.Provenance),
            ExtractionConfidence = element.ExtractionConfidence,
            SourcePassageIds = [.. element.SourcePassageIds],
            RelatedElementIds = [.. element.RelatedElementIds],
            Properties = new Dictionary<string, string>(element.Properties),
            LifecycleScope = element.LifecycleScope,
        };
    }

    private static ClaimProvenance CloneScopedProvenance(ClaimProvenance provenance)
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

    private static List<GlobalInvariantCheckResult> RunGlobalInvariantChecks(ArchitectureKnowledgeModel model)
    {
        return
        [
            EvaluateTenantIsolation(model),
            EvaluateDataResidency(model),
            EvaluateAuthentication(model),
            EvaluateLatencyCeiling(model),
            EvaluateOwnership(model),
        ];
    }

    private static GlobalInvariantCheckResult EvaluateTenantIsolation(ArchitectureKnowledgeModel model)
    {
        bool hasTenantSignal = model.Elements.Any(element =>
            element.Name.Contains("tenant", StringComparison.OrdinalIgnoreCase)
            || element.Properties.ContainsKey("tenantIsolation"));

        return new GlobalInvariantCheckResult
        {
            InvariantId = "INV-TENANT-ISOLATION",
            Passed = hasTenantSignal || model.Elements.Count == 0,
            Detail = hasTenantSignal
                ? "Tenant isolation related elements are present or indeterminate detail remains acceptable."
                : "No explicit tenant isolation elements found; treated as indeterminate detail.",
        };
    }

    private static GlobalInvariantCheckResult EvaluateDataResidency(ArchitectureKnowledgeModel model)
    {
        bool hasResidencySignal = model.Elements.Any(element =>
            element.Kind == ArchitectureElementKind.ComplianceObligation
            || element.Kind == ArchitectureElementKind.DataFlow
            || element.Name.Contains("residency", StringComparison.OrdinalIgnoreCase));

        return new GlobalInvariantCheckResult
        {
            InvariantId = "INV-DATA-RESIDENCY",
            Passed = hasResidencySignal || model.Elements.Count == 0,
            Detail = hasResidencySignal
                ? "Data residency or compliance elements are present."
                : "No explicit data residency elements found; treated as indeterminate detail.",
        };
    }

    private static GlobalInvariantCheckResult EvaluateAuthentication(ArchitectureKnowledgeModel model)
    {
        bool hasAuthenticationSignal = model.Elements.Any(element =>
            element.Name.Contains("auth", StringComparison.OrdinalIgnoreCase)
            || element.Kind == ArchitectureElementKind.TrustBoundary
            || element.Properties.ContainsKey("authentication"));

        return new GlobalInvariantCheckResult
        {
            InvariantId = "INV-AUTHENTICATION",
            Passed = hasAuthenticationSignal || model.Elements.Count == 0,
            Detail = hasAuthenticationSignal
                ? "Authentication or trust boundary elements are present."
                : "No explicit authentication elements found; treated as indeterminate detail.",
        };
    }

    private static GlobalInvariantCheckResult EvaluateLatencyCeiling(ArchitectureKnowledgeModel model)
    {
        bool hasLatencySignal = model.Elements.Any(element =>
            element.Kind == ArchitectureElementKind.QualityAttribute
            && (element.Name.Contains("latency", StringComparison.OrdinalIgnoreCase)
                || element.Name.Contains("performance", StringComparison.OrdinalIgnoreCase))
            || element.Properties.ContainsKey("latencyCeilingMs"));

        return new GlobalInvariantCheckResult
        {
            InvariantId = "INV-LATENCY-CEILING",
            Passed = hasLatencySignal || model.Elements.Count == 0,
            Detail = hasLatencySignal
                ? "Latency/performance quality attributes are present."
                : "No explicit latency ceiling elements found; treated as indeterminate detail.",
        };
    }

    private static GlobalInvariantCheckResult EvaluateOwnership(ArchitectureKnowledgeModel model)
    {
        bool hasOwnershipSignal = model.Elements.Any(element =>
            element.Kind == ArchitectureElementKind.OperationalOwnership
            || element.Name.Contains("owner", StringComparison.OrdinalIgnoreCase));

        bool hasUnownedComponent = model.Elements.Any(element =>
            element.Kind == ArchitectureElementKind.Component
            && element.Name.Contains("unowned", StringComparison.OrdinalIgnoreCase));

        return new GlobalInvariantCheckResult
        {
            InvariantId = "INV-OPERATIONAL-OWNERSHIP",
            Passed = (hasOwnershipSignal || model.Elements.Count == 0) && !hasUnownedComponent,
            Detail = hasUnownedComponent
                ? "Unowned component detected; ownership invariant failed."
                : hasOwnershipSignal
                    ? "Operational ownership elements are present."
                    : "No explicit ownership elements found; treated as indeterminate detail.",
        };
    }
}
