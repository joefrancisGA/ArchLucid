using ArchLucid.Api.ProblemDetails;
using ArchLucid.Application.Planning;
using ArchLucid.Contracts.Drafts;
using ArchLucid.Contracts.Requests;

using Microsoft.AspNetCore.Mvc;

namespace ArchLucid.Api.Controllers.Authority;

/// <summary>Architecture request intake draft, async, and connector endpoints.</summary>
public sealed partial class RunsController
{
    private const int MinimumIntakeTextLength = 20;

    private IActionResult? ValidateDraftFreeText(string? text, string fieldName)
    {
        if (text is null)
            return this.BadRequestProblem("Request body is required.", ProblemTypes.RequestBodyRequired);
        if (string.IsNullOrWhiteSpace(text))
            return this.BadRequestProblem($"{fieldName} is required.", ProblemTypes.ValidationFailed);
        if (text.Trim().Length < MinimumIntakeTextLength)
            return this.BadRequestProblem($"{fieldName} must be at least {MinimumIntakeTextLength} characters.", ProblemTypes.ValidationFailed);
        if (DraftIntakeValidation.ExceedsMaximumFreeTextIntentLength(text))
            return this.BadRequestProblem($"{fieldName} must not exceed {DraftIntakeValidation.MaximumFreeTextIntentLength} characters.", ProblemTypes.ValidationFailed);
        return null;
    }

    private IActionResult MapIntakeParseResult(ArchitectureRequestIntakeParseResult result) => result.Outcome switch
    {
        ArchitectureRequestIntakeOutcome.Success => Ok(result.Request!),
        ArchitectureRequestIntakeOutcome.ParseFailed => this.BadRequestProblem(result.ErrorMessage ?? "Parse failed.", ProblemTypes.ValidationFailed),
        ArchitectureRequestIntakeOutcome.ValidationFailed => this.UnprocessableEntityProblem(
            string.Join("; ", result.ValidationErrors ?? []),
            ProblemTypes.ValidationFailed),
        _ => throw new InvalidOperationException($"Unexpected intake parse outcome: {result.Outcome}."),
    };
}
