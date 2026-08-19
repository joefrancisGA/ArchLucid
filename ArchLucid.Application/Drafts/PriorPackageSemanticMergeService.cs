using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Drafts;
using ArchLucid.Contracts.Requests;
using ArchLucid.Core.Manifest;
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

        if (!Guid.TryParse(priorRunId.Trim(), out Guid priorRunGuid))
            return;

        RunRecord? priorRun = await runRepository.GetByIdAsync(scope, priorRunGuid, cancellationToken);

        if (priorRun is null || string.IsNullOrWhiteSpace(priorRun.ArchitectureRequestId))
            return;

        ArchitectureRequest? priorRequest =
            await architectureRequestRepository.GetByIdAsync(priorRun.ArchitectureRequestId, cancellationToken);

        if (priorRequest is null)
            return;

        MergeActors(document, priorRequest);
        MergeAssumptions(document, priorRequest);
        MergeRequiredCapabilities(document, priorRequest);
        await MergeRequirementsFromManifestAsync(scope, document, priorRun, cancellationToken);
    }

    private static void MergeActors(DraftRequestDocument document, ArchitectureRequest priorRequest)
    {
        if (document.ActorSet.Actors.Count > 0 || priorRequest.DraftActors.Count == 0)
            return;

        document.ActorSet.Actors.AddRange(priorRequest.DraftActors);
    }

    private static void MergeAssumptions(DraftRequestDocument document, ArchitectureRequest priorRequest)
    {
        ArchitectureDraftStructuredBrief brief = document.StructuredBrief;

        foreach (string assumption in priorRequest.Assumptions)
        {
            if (!ArchitectureDraftStructuredBrief.IsConfirmedBriefEntry(assumption))
                continue;

            if (brief.ConfirmedAssumptions.Any(existing =>
                    string.Equals(existing, assumption, StringComparison.OrdinalIgnoreCase)))
            {
                continue;
            }

            brief.ConfirmedAssumptions.Add(assumption.Trim());
        }
    }

    private static void MergeRequiredCapabilities(DraftRequestDocument document, ArchitectureRequest priorRequest)
    {
        ArchitectureDraftStructuredBrief brief = document.StructuredBrief;

        foreach (string capability in priorRequest.RequiredCapabilities)
        {
            if (!ArchitectureDraftStructuredBrief.IsConfirmedBriefEntry(capability))
                continue;

            if (brief.ConfirmedRequiredCapabilities.Any(existing =>
                    string.Equals(existing, capability, StringComparison.OrdinalIgnoreCase)))
            {
                continue;
            }

            brief.ConfirmedRequiredCapabilities.Add(capability.Trim());
        }
    }

    private async Task MergeRequirementsFromManifestAsync(
        ScopeContext scope,
        DraftRequestDocument document,
        RunRecord priorRun,
        CancellationToken cancellationToken)
    {
        if (priorRun.GoldenManifestId is not Guid manifestId)
            return;

        ManifestDocument? manifest = await goldenManifestRepository.GetByIdAsync(scope, manifestId, cancellationToken);

        if (manifest is null)
            return;

        ArchitectureDraftStructuredBrief brief = document.StructuredBrief;

        foreach (string constraint in manifest.Constraints.MandatoryConstraints)
        {
            if (!ArchitectureDraftStructuredBrief.IsConfirmedBriefEntry(constraint))
                continue;

            if (brief.ConfirmedConstraints.Any(existing =>
                    string.Equals(existing, constraint, StringComparison.OrdinalIgnoreCase)))
            {
                continue;
            }

            brief.ConfirmedConstraints.Add(constraint.Trim());
        }

        foreach (string assumption in manifest.Assumptions)
        {
            if (!ArchitectureDraftStructuredBrief.IsConfirmedBriefEntry(assumption))
                continue;

            if (brief.ConfirmedAssumptions.Any(existing =>
                    string.Equals(existing, assumption, StringComparison.OrdinalIgnoreCase)))
            {
                continue;
            }

            brief.ConfirmedAssumptions.Add(assumption.Trim());
        }

        foreach (ResolvedArchitectureDecision decision in manifest.Decisions)
        {
            if (string.IsNullOrWhiteSpace(decision.DecisionId))
                continue;

            string key = $"prior.decision.{decision.DecisionId.Trim()}";

            if (document.TransparencyTrail.Asserted.Any(entry =>
                    string.Equals(entry.Key, key, StringComparison.OrdinalIgnoreCase)))
            {
                continue;
            }

            document.TransparencyTrail.Asserted.Add(new AssertedTrailEntry
            {
                Key = key,
                Value = string.IsNullOrWhiteSpace(decision.Title)
                    ? $"Inherited from prior run {priorRun.RunId:N}"
                    : decision.Title.Trim(),
            });
        }

        if (priorRun.DecisionTraceId != Guid.Empty)
        {
            string traceKey = $"prior.decisionTrace.{priorRun.DecisionTraceId:N}";

            if (!document.TransparencyTrail.Asserted.Any(entry =>
                    string.Equals(entry.Key, traceKey, StringComparison.OrdinalIgnoreCase)))
            {
                document.TransparencyTrail.Asserted.Add(new AssertedTrailEntry
                {
                    Key = traceKey,
                    Value = $"Inherited from prior run {priorRun.RunId:N}",
                });
            }
        }
    }
}
