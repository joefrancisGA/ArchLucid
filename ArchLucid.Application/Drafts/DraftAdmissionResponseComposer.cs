using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Drafts;
using ArchLucid.Decisioning.Feasibility;

namespace ArchLucid.Application.Drafts;

/// <summary>Builds admission API responses and evaluates semantic redirect disposition.</summary>
internal static class DraftAdmissionResponseComposer
{
    public static async Task<DraftAdmissionEvaluation?> TrySemanticRedirectAsync(
        IDraftSemanticAdmissionEvaluator semanticAdmissionEvaluator,
        DraftRequestDocument document,
        CancellationToken cancellationToken)
    {
        DraftSemanticAdmissionEvaluation semantic =
            await semanticAdmissionEvaluator.EvaluateAsync(document, cancellationToken);

        if (semantic.Disposition is DraftSemanticAdmissionDispositionKind.Admitted
            or DraftSemanticAdmissionDispositionKind.EvaluatorUnavailable)
        {
            return null;
        }

        return new DraftAdmissionEvaluation
        {
            Admitted = false,
            RedirectReason = semantic.RedirectReason,
        };
    }

    public static DraftAdmissionResponse BuildAdmissionResponse(
        FeasibilityVerdictBuilder feasibilityVerdictBuilder,
        DraftRequestResponse draft,
        bool admitted,
        string? redirectReason,
        QuestionSelectionResult? selection = null)
    {
        FeasibilityVerdict verdict = admitted
            ? feasibilityVerdictBuilder.Feasible(
                "Draft contains sufficient designable intent for admission.",
                draft.Document.TransparencyTrail)
            : feasibilityVerdictBuilder.FromIntakeRedirect(
                redirectReason ?? "Draft redirected.",
                draft.Document.TransparencyTrail,
                "Draft does not yet meet minimum designable-intent requirements.");

        return new DraftAdmissionResponse
        {
            Admitted = admitted,
            Status = draft.Status,
            RedirectReason = redirectReason,
            Draft = draft,
            PendingMustQuestions = selection?.PendingMustQuestions ?? [],
            RequiredMustQuestionKeys = selection?.RequiredMustQuestionKeys
                ?? draft.Document.RequiredMustQuestionKeys,
            Verdict = verdict,
        };
    }
}
