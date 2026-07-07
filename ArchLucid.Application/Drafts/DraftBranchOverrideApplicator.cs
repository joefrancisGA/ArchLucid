using ArchLucid.Contracts.Drafts;

namespace ArchLucid.Application.Drafts;

/// <summary>Applies a single ceteris-paribus override onto a branched draft document (R12).</summary>
public static class DraftBranchOverrideApplicator
{
    public static void Apply(DraftRequestDocument document, BranchDraftRequest request)
    {
        ArgumentNullException.ThrowIfNull(document);
        ArgumentNullException.ThrowIfNull(request);

        if (string.IsNullOrWhiteSpace(request.OverrideValue))
            throw new InvalidOperationException("OverrideValue is required.");

        switch (request.OverrideKind)
        {
            case DraftBranchOverrideKind.QuestionAnswer:
                ApplyQuestionAnswer(document, request);
                break;

            case DraftBranchOverrideKind.BusinessOutcome:
                document.BusinessOutcome = request.OverrideValue.Trim();
                break;

            case DraftBranchOverrideKind.FreeTextIntent:
                string intent = request.OverrideValue.Trim();

                if (intent.Length < DraftIntakeValidation.MinimumFreeTextIntentLength)
                    throw new InvalidOperationException(
                        $"FreeTextIntent override must be at least {DraftIntakeValidation.MinimumFreeTextIntentLength} characters.");

                document.FreeTextIntent = intent;
                break;

            case DraftBranchOverrideKind.SystemName:
                document.SystemName = request.OverrideValue.Trim();
                break;

            default:
                throw new InvalidOperationException($"Unknown override kind '{request.OverrideKind}'.");
        }
    }

    private static void ApplyQuestionAnswer(DraftRequestDocument document, BranchDraftRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.OverrideKey))
            throw new InvalidOperationException("OverrideKey is required for question-answer overrides.");

        string questionKey = request.OverrideKey.Trim();
        string answer = request.OverrideValue.Trim();

        document.QuestionAnswers[questionKey] = answer;
        document.TransparencyTrail.Skipped.RemoveAll(entry =>
            string.Equals(entry.QuestionKey, questionKey, StringComparison.OrdinalIgnoreCase));
    }
}
