using ArchLucid.Application.Drafts;
using ArchLucid.Application.Runs;
using ArchLucid.Contracts.Requests;

namespace ArchLucid.Api.Validators;

internal static class ArchitectureRequestQuickStartIntakeValidation
{
    internal static bool TryCollectFailures(ArchitectureRequest request, IList<FluentValidation.Results.ValidationFailure> failures)
    {
        ArgumentNullException.ThrowIfNull(request);
        ArgumentNullException.ThrowIfNull(failures);

        if (!QuickStartIntakeRequestEnricher.RequiresL0MustSet(request))
            return false;

        IReadOnlyList<string> missingKeys = UniversalIntakeMustQuestionCompleteness.EvaluateMissingKeys(
            request.IntakeQuestionAnswers,
            request.IntakeTransparencyTrail);

        foreach (string missingKey in missingKeys)
        {
            failures.Add(
                new FluentValidation.Results.ValidationFailure(
                    $"{nameof(ArchitectureRequest.IntakeQuestionAnswers)}.{missingKey}",
                    $"Required clarification '{missingKey}' must be answered or explicitly marked unknown before starting the review."));
        }

        if (QuickStartAnalyzableEvidenceCompleteness.TryCollectFailures(request, failures))
            return true;

        return missingKeys.Count > 0;
    }
}
