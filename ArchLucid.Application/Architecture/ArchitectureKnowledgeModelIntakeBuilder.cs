using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.ArchitectureIntelligence;
using ArchLucid.Contracts.Requests;
using ArchLucid.Core.Scoping;

namespace ArchLucid.Application.Architecture;

/// <inheritdoc cref="IArchitectureKnowledgeModelIntakeBuilder" />
public sealed class ArchitectureKnowledgeModelIntakeBuilder(TimeProvider timeProvider) : IArchitectureKnowledgeModelIntakeBuilder
{
    private readonly TimeProvider _timeProvider =
        timeProvider ?? throw new ArgumentNullException(nameof(timeProvider));

    /// <inheritdoc />
    public ArchitectureKnowledgeModel Build(ScopeContext scope, ArchitectureRequest request, string runId)
    {
        ArgumentNullException.ThrowIfNull(scope);
        ArgumentNullException.ThrowIfNull(request);
        ArgumentException.ThrowIfNullOrWhiteSpace(runId);

        DateTime utcNow = _timeProvider.GetUtcNow().UtcDateTime;
        string modelId = ArchitectureKnowledgeModelStableElementId.FromKindAndName(
            ArchitectureElementKind.Component,
            request.SystemName,
            runId);

        ArchitectureKnowledgeModel model = new()
        {
            ModelId = modelId,
            TenantId = scope.TenantId.ToString("D"),
            RunId = runId,
            CreatedUtc = utcNow,
            UpdatedUtc = utcNow,
        };

        AddSystemComponent(model, request, runId);
        AddDescriptionObjective(model, request, runId);
        AddCloudTopology(model, request, runId);
        AddListElements(model, request.Constraints, ArchitectureElementKind.Constraint, runId);
        AddListElements(model, request.RequiredCapabilities, ArchitectureElementKind.FunctionalRequirement, runId);
        AddListElements(model, request.Assumptions, ArchitectureElementKind.Assumption, runId);
        AddListElements(model, request.InlineRequirements, ArchitectureElementKind.FunctionalRequirement, runId);

        if (!string.IsNullOrWhiteSpace(request.QualityAttributeSnapshot))
            AddNamedElement(
                model,
                ArchitectureElementKind.QualityAttribute,
                request.QualityAttributeSnapshot,
                runId,
                ClaimOrigin.UserAsserted);

        if (!string.IsNullOrWhiteSpace(request.FailureModeNoteSnapshot))
            AddNamedElement(
                model,
                ArchitectureElementKind.FailureMode,
                request.FailureModeNoteSnapshot,
                runId,
                ClaimOrigin.UserAsserted);

        foreach (string policyReference in request.PolicyReferences)
        {
            if (string.IsNullOrWhiteSpace(policyReference))
                continue;

            AddNamedElement(
                model,
                ArchitectureElementKind.ComplianceObligation,
                policyReference.Trim(),
                runId,
                ClaimOrigin.ExternallySourced);
        }

        AddTransparencyTrail(model, request.IntakeTransparencyTrail, runId);

        model.IsProvisionalSynthesis = model.Elements.Count == 0
            || (request.IntakeTransparencyTrail?.HasSkippedMustQuestions ?? false);

        return model;
    }

    private static void AddTransparencyTrail(
        ArchitectureKnowledgeModel model,
        TransparencyTrail? trail,
        string runId)
    {
        if (trail is null)
            return;

        foreach (AssertedTrailEntry asserted in trail.Asserted)
        {
            if (string.IsNullOrWhiteSpace(asserted.Key))
                continue;

            model.FramingAnswers[asserted.Key] = asserted.Value;
            AddNamedElement(
                model,
                ArchitectureElementKind.FunctionalRequirement,
                $"{asserted.Key}: {asserted.Value}",
                runId,
                ClaimOrigin.UserAsserted);
        }

        foreach (InferredTrailEntry inferred in trail.Inferred)
        {
            if (string.IsNullOrWhiteSpace(inferred.Key))
                continue;

            model.Elements.Add(new ArchitectureModelElement
            {
                ElementId = ArchitectureKnowledgeModelStableElementId.FromKindAndName(
                    ArchitectureElementKind.Assumption,
                    inferred.Key,
                    runId),
                Kind = ArchitectureElementKind.Assumption,
                Name = inferred.Key,
                Description = inferred.Value,
                ExtractionConfidence = inferred.Confidence / 100.0,
                Provenance = new ClaimProvenance
                {
                    Origin = ClaimOrigin.ModelInferred,
                    SupportStatus = SupportStatus.PartiallySupported,
                    Confidence = inferred.Confidence / 100.0,
                    SourceArtifactId = runId,
                },
            });
        }

        foreach (SkippedQuestionTrailEntry skipped in trail.Skipped)
        {
            if (string.IsNullOrWhiteSpace(skipped.QuestionKey))
                continue;

            AddNamedElement(
                model,
                ArchitectureElementKind.UnresolvedQuestion,
                skipped.QuestionKey,
                runId,
                ClaimOrigin.SystemProposed,
                $"Skipped during intake ({skipped.Tier} tier).");
        }
    }

    private static void AddSystemComponent(ArchitectureKnowledgeModel model, ArchitectureRequest request, string runId)
    {
        if (string.IsNullOrWhiteSpace(request.SystemName))
            return;

        AddNamedElement(
            model,
            ArchitectureElementKind.Component,
            request.SystemName.Trim(),
            runId,
            ClaimOrigin.UserAsserted,
            request.Description);
    }

    private static void AddDescriptionObjective(ArchitectureKnowledgeModel model, ArchitectureRequest request, string runId)
    {
        if (string.IsNullOrWhiteSpace(request.Description))
            return;

        AddNamedElement(
            model,
            ArchitectureElementKind.BusinessObjective,
            "Architecture scope",
            runId,
            ClaimOrigin.UserAsserted,
            request.Description.Trim());
    }

    private static void AddCloudTopology(ArchitectureKnowledgeModel model, ArchitectureRequest request, string runId)
    {
        string cloudLabel = request.CloudProvider.ToString();

        AddNamedElement(
            model,
            ArchitectureElementKind.DeploymentTopology,
            $"Target cloud: {cloudLabel}",
            runId,
            ClaimOrigin.UserAsserted);
    }

    private static void AddListElements(
        ArchitectureKnowledgeModel model,
        IReadOnlyList<string> values,
        ArchitectureElementKind kind,
        string runId)
    {
        foreach (string value in values)
        {
            if (string.IsNullOrWhiteSpace(value))
                continue;

            AddNamedElement(model, kind, value.Trim(), runId, ClaimOrigin.UserAsserted);
        }
    }

    private static void AddNamedElement(
        ArchitectureKnowledgeModel model,
        ArchitectureElementKind kind,
        string name,
        string runId,
        ClaimOrigin origin,
        string? description = null)
    {
        model.Elements.Add(new ArchitectureModelElement
        {
            ElementId = ArchitectureKnowledgeModelStableElementId.FromKindAndName(kind, name, runId),
            Kind = kind,
            Name = name,
            Description = description,
            ExtractionConfidence = 1.0,
            Provenance = new ClaimProvenance
            {
                Origin = origin,
                SupportStatus = SupportStatus.DirectlyEstablished,
                Confidence = 1.0,
                SourceArtifactId = runId,
            },
        });
    }
}
