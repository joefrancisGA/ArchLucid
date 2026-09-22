using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Drafts;
using ArchLucid.Contracts.Requests;
using ArchLucid.Core.Manifest;
using ArchLucid.Core.Manifest.Sections;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Models;

namespace ArchLucid.Application.Drafts;

public sealed class PriorPackageSemanticMergeService(
    IRunRepository runRepository,
    IArchitectureRequestRepository architectureRequestRepository,
    IGoldenManifestRepository goldenManifestRepository) : IPriorPackageSemanticMergeService
{
    public async Task MergePriorPackageSemanticsAsync(
        ScopeContext scope,
        DraftRequestDocument document,
        string priorRunId,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(scope);
        ArgumentNullException.ThrowIfNull(document);
        ArgumentException.ThrowIfNullOrWhiteSpace(priorRunId);

        PriorPackageSemanticContext? context =
            await TryLoadPriorPackageSemanticContextAsync(scope, priorRunId, cancellationToken);

        if (context is null)
            return;

        MergeOntoDraftDocument(document, context);
    }

    public async Task MergePriorPackageSemanticsOntoRequestAsync(
        ScopeContext scope,
        ArchitectureRequest request,
        string priorRunId,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(scope);
        ArgumentNullException.ThrowIfNull(request);
        ArgumentException.ThrowIfNullOrWhiteSpace(priorRunId);

        PriorPackageSemanticContext? context =
            await TryLoadPriorPackageSemanticContextAsync(scope, priorRunId, cancellationToken);

        if (context is null)
            return;

        MergeOntoArchitectureRequest(request, context);
    }

    public async Task<PriorPackageSemanticCountsDto?> GetPriorPackageSemanticCountsAsync(
        ScopeContext scope,
        string priorRunId,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(scope);
        ArgumentException.ThrowIfNullOrWhiteSpace(priorRunId);

        PriorPackageSemanticContext? context =
            await TryLoadPriorPackageSemanticContextAsync(scope, priorRunId, cancellationToken);

        if (context is null)
            return null;

        return BuildCounts(context);
    }

    private async Task<PriorPackageSemanticContext?> TryLoadPriorPackageSemanticContextAsync(
        ScopeContext scope,
        string priorRunId,
        CancellationToken cancellationToken)
    {
        if (!Guid.TryParse(priorRunId.Trim(), out Guid priorRunGuid))
            return null;

        RunRecord? priorRun = await runRepository.GetByIdAsync(scope, priorRunGuid, cancellationToken);

        if (priorRun is null || string.IsNullOrWhiteSpace(priorRun.ArchitectureRequestId))
            return null;

        ArchitectureRequest? priorRequest =
            await architectureRequestRepository.GetByIdAsync(priorRun.ArchitectureRequestId, cancellationToken);

        if (priorRequest is null)
            return null;

        ManifestDocument? manifest = null;

        if (priorRun.GoldenManifestId is Guid manifestId)
        {
            manifest = await goldenManifestRepository.GetByIdAsync(scope, manifestId, cancellationToken);
        }

        return new PriorPackageSemanticContext(priorRun, priorRequest, manifest);
    }

    private static void MergeOntoDraftDocument(DraftRequestDocument document, PriorPackageSemanticContext context)
    {
        MergeActorsOntoDraft(document, context.PriorRequest);
        MergeAssumptionsOntoBrief(document.StructuredBrief, context.PriorRequest, context.Manifest);
        MergeRequiredCapabilitiesOntoBrief(document.StructuredBrief, context.PriorRequest);
        MergeConstraintsOntoBrief(document.StructuredBrief, context.PriorRequest, context.Manifest);
        MergeInlineRequirementsOntoBrief(document.StructuredBrief, context.PriorRequest, context.Manifest);
        MergeDecisionsOntoTrail(document.TransparencyTrail, context.PriorRun, context.Manifest);
    }

    private static void MergeOntoArchitectureRequest(ArchitectureRequest request, PriorPackageSemanticContext context)
    {
        MergeActorsOntoRequest(request, context.PriorRequest);
        MergeAssumptionsOntoRequest(request, context.PriorRequest, context.Manifest);
        MergeRequiredCapabilitiesOntoRequest(request, context.PriorRequest);
        MergeConstraintsOntoRequest(request, context.PriorRequest, context.Manifest);
        MergeInlineRequirementsOntoRequest(request, context.PriorRequest, context.Manifest);
        MergeDecisionsOntoTrail(request.IntakeTransparencyTrail ??= new TransparencyTrail(), context.PriorRun, context.Manifest);
    }

    private static void MergeActorsOntoDraft(DraftRequestDocument document, ArchitectureRequest priorRequest)
    {
        if (document.ActorSet.Actors.Count > 0 || priorRequest.DraftActors.Count == 0)
            return;

        document.ActorSet.Actors.AddRange(priorRequest.DraftActors);
    }

    private static void MergeActorsOntoRequest(ArchitectureRequest request, ArchitectureRequest priorRequest)
    {
        if (request.DraftActors.Count > 0 || priorRequest.DraftActors.Count == 0)
            return;

        request.DraftActors.AddRange(priorRequest.DraftActors);
    }

    private static void MergeAssumptionsOntoBrief(
        ArchitectureDraftStructuredBrief brief,
        ArchitectureRequest priorRequest,
        ManifestDocument? manifest)
    {
        foreach (string assumption in priorRequest.Assumptions)
        {
            AppendUniqueConfirmedBriefEntry(brief.ConfirmedAssumptions, assumption);
        }

        if (manifest is null)
            return;

        foreach (string assumption in manifest.Assumptions)
        {
            AppendUniqueConfirmedBriefEntry(brief.ConfirmedAssumptions, assumption);
        }
    }

    private static void MergeAssumptionsOntoRequest(
        ArchitectureRequest request,
        ArchitectureRequest priorRequest,
        ManifestDocument? manifest)
    {
        foreach (string assumption in priorRequest.Assumptions)
        {
            AppendUniqueConfirmedListEntry(request.Assumptions, assumption);
        }

        if (manifest is null)
            return;

        foreach (string assumption in manifest.Assumptions)
        {
            AppendUniqueConfirmedListEntry(request.Assumptions, assumption);
        }
    }

    private static void MergeRequiredCapabilitiesOntoBrief(
        ArchitectureDraftStructuredBrief brief,
        ArchitectureRequest priorRequest)
    {
        foreach (string capability in priorRequest.RequiredCapabilities)
        {
            AppendUniqueConfirmedBriefEntry(brief.ConfirmedRequiredCapabilities, capability);
        }
    }

    private static void MergeRequiredCapabilitiesOntoRequest(
        ArchitectureRequest request,
        ArchitectureRequest priorRequest)
    {
        foreach (string capability in priorRequest.RequiredCapabilities)
        {
            AppendUniqueConfirmedListEntry(request.RequiredCapabilities, capability);
        }
    }

    private static void MergeConstraintsOntoBrief(
        ArchitectureDraftStructuredBrief brief,
        ArchitectureRequest priorRequest,
        ManifestDocument? manifest)
    {
        foreach (string constraint in priorRequest.Constraints)
        {
            AppendUniqueConfirmedBriefEntry(brief.ConfirmedConstraints, constraint);
        }

        if (manifest is null)
            return;

        foreach (string constraint in manifest.Constraints.MandatoryConstraints)
        {
            AppendUniqueConfirmedBriefEntry(brief.ConfirmedConstraints, constraint);
        }
    }

    private static void MergeConstraintsOntoRequest(
        ArchitectureRequest request,
        ArchitectureRequest priorRequest,
        ManifestDocument? manifest)
    {
        foreach (string constraint in priorRequest.Constraints)
        {
            AppendUniqueConfirmedListEntry(request.Constraints, constraint);
        }

        if (manifest is null)
            return;

        foreach (string constraint in manifest.Constraints.MandatoryConstraints)
        {
            AppendUniqueConfirmedListEntry(request.Constraints, constraint);
        }
    }

    private static void MergeInlineRequirementsOntoBrief(
        ArchitectureDraftStructuredBrief brief,
        ArchitectureRequest priorRequest,
        ManifestDocument? manifest)
    {
        foreach (string requirement in priorRequest.InlineRequirements)
        {
            AppendUniqueConfirmedBriefEntry(brief.ConfirmedInlineRequirements, requirement);
        }

        if (manifest is null)
            return;

        foreach (string requirement in CollectManifestRequirementTexts(manifest))
        {
            AppendUniqueConfirmedBriefEntry(brief.ConfirmedInlineRequirements, requirement);
        }
    }

    private static void MergeInlineRequirementsOntoRequest(
        ArchitectureRequest request,
        ArchitectureRequest priorRequest,
        ManifestDocument? manifest)
    {
        foreach (string requirement in priorRequest.InlineRequirements)
        {
            AppendUniqueConfirmedListEntry(request.InlineRequirements, requirement);
        }

        if (manifest is null)
            return;

        foreach (string requirement in CollectManifestRequirementTexts(manifest))
        {
            AppendUniqueConfirmedListEntry(request.InlineRequirements, requirement);
        }
    }

    private static void MergeDecisionsOntoTrail(
        TransparencyTrail trail,
        RunRecord priorRun,
        ManifestDocument? manifest)
    {
        if (manifest is null)
            return;

        foreach (ResolvedArchitectureDecision decision in manifest.Decisions)
        {
            if (string.IsNullOrWhiteSpace(decision.DecisionId))
                continue;

            string key = $"prior.decision.{decision.DecisionId.Trim()}";

            if (trail.Asserted.Any(entry =>
                    string.Equals(entry.Key, key, StringComparison.OrdinalIgnoreCase)))
            {
                continue;
            }

            trail.Asserted.Add(new AssertedTrailEntry
            {
                Key = key,
                Value = string.IsNullOrWhiteSpace(decision.Title)
                    ? $"Inherited from prior run {priorRun.RunId:N}"
                    : decision.Title.Trim(),
            });
        }

        if (priorRun.DecisionTraceId is not Guid decisionTraceId || decisionTraceId == Guid.Empty)
            return;

        string traceKey = $"prior.decisionTrace.{decisionTraceId:N}";

        if (trail.Asserted.Any(entry =>
                string.Equals(entry.Key, traceKey, StringComparison.OrdinalIgnoreCase)))
        {
            return;
        }

        trail.Asserted.Add(new AssertedTrailEntry
        {
            Key = traceKey,
            Value = $"Inherited from prior run {priorRun.RunId:N}",
        });
    }

    private static IEnumerable<string> CollectManifestRequirementTexts(ManifestDocument manifest)
    {
        foreach (RequirementCoverageItem item in manifest.Requirements.Covered)
        {
            yield return FormatRequirementCoverageItem(item);
        }

        foreach (RequirementCoverageItem item in manifest.Requirements.Uncovered)
        {
            yield return FormatRequirementCoverageItem(item);
        }
    }

    private static string FormatRequirementCoverageItem(RequirementCoverageItem item)
    {
        if (!string.IsNullOrWhiteSpace(item.RequirementText))
            return item.RequirementText.Trim();

        return item.RequirementName.Trim();
    }

    private static void AppendUniqueConfirmedBriefEntry(List<string> target, string? value)
    {
        if (!ArchitectureDraftStructuredBrief.IsConfirmedBriefEntry(value))
            return;

        string trimmed = value!.Trim();

        if (target.Any(existing => string.Equals(existing, trimmed, StringComparison.OrdinalIgnoreCase)))
            return;

        target.Add(trimmed);
    }

    private static void AppendUniqueConfirmedListEntry(List<string> target, string? value)
    {
        if (!ArchitectureDraftStructuredBrief.IsConfirmedBriefEntry(value))
            return;

        string trimmed = value!.Trim();

        if (target.Any(existing => string.Equals(existing, trimmed, StringComparison.OrdinalIgnoreCase)))
            return;

        target.Add(trimmed);
    }

    private static PriorPackageSemanticCountsDto BuildCounts(PriorPackageSemanticContext context)
    {
        HashSet<string> assumptions = new(StringComparer.OrdinalIgnoreCase);
        HashSet<string> requirements = new(StringComparer.OrdinalIgnoreCase);

        foreach (string assumption in context.PriorRequest.Assumptions)
        {
            if (ArchitectureDraftStructuredBrief.IsConfirmedBriefEntry(assumption))
                assumptions.Add(assumption.Trim());
        }

        foreach (string constraint in context.PriorRequest.Constraints)
        {
            if (ArchitectureDraftStructuredBrief.IsConfirmedBriefEntry(constraint))
                requirements.Add(constraint.Trim());
        }

        foreach (string requirement in context.PriorRequest.InlineRequirements)
        {
            if (ArchitectureDraftStructuredBrief.IsConfirmedBriefEntry(requirement))
                requirements.Add(requirement.Trim());
        }

        if (context.Manifest is not null)
        {
            foreach (string assumption in context.Manifest.Assumptions)
            {
                if (ArchitectureDraftStructuredBrief.IsConfirmedBriefEntry(assumption))
                    assumptions.Add(assumption.Trim());
            }

            foreach (string constraint in context.Manifest.Constraints.MandatoryConstraints)
            {
                if (ArchitectureDraftStructuredBrief.IsConfirmedBriefEntry(constraint))
                    requirements.Add(constraint.Trim());
            }

            foreach (string requirement in CollectManifestRequirementTexts(context.Manifest))
            {
                if (ArchitectureDraftStructuredBrief.IsConfirmedBriefEntry(requirement))
                    requirements.Add(requirement.Trim());
            }
        }

        int decisionCount = context.Manifest?.Decisions.Count(decision => !string.IsNullOrWhiteSpace(decision.DecisionId)) ?? 0;

        if (context.PriorRun.DecisionTraceId is Guid decisionTraceId && decisionTraceId != Guid.Empty)
            decisionCount++;

        return new PriorPackageSemanticCountsDto
        {
            ActorCount = context.PriorRequest.DraftActors.Count,
            AssumptionCount = assumptions.Count,
            DecisionCount = decisionCount,
            RequirementCount = requirements.Count,
        };
    }

    private sealed record PriorPackageSemanticContext(
        RunRecord PriorRun,
        ArchitectureRequest PriorRequest,
        ManifestDocument? Manifest);
}
