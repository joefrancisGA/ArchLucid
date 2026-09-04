using ArchLucid.Api.Attributes;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Application.Planning;
using ArchLucid.Contracts.Drafts;
using ArchLucid.Contracts.Requests;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Authorization;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ArchLucid.Api.Controllers.Authority;

public sealed partial class RunsController
{
    [HttpPost("request/draft")]
    [Authorize(Policy = ArchLucidPolicies.ExecuteAuthority)]
    [MutatingAuditExcluded("Draft endpoint is advisory-only and does not persist domain mutations.")]
    [ProducesResponseType(typeof(DraftArchitectureRequestResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> DraftRequest(
        [FromBody] DraftArchitectureRequestInput? input,
        [FromServices] IArchitectureRequestIntakeFacade intakeFacade,
        CancellationToken cancellationToken)
    {
        IActionResult? validation = ValidateDraftFreeText(input?.FreeTextDescription, "FreeTextDescription");
        if (validation is not null)
            return validation;

        return Ok(await intakeFacade.DraftAsync(input!, cancellationToken));
    }

    [HttpPost("request/draft/overview-rewrite")]
    [Authorize(Policy = ArchLucidPolicies.ExecuteAuthority)]
    [MutatingAuditExcluded("Overview rewrite is advisory-only and does not persist domain mutations.")]
    [ProducesResponseType(typeof(RewriteArchitectureOverviewResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> RewriteArchitectureOverview(
        [FromBody] RewriteArchitectureOverviewInput? input,
        [FromServices] IArchitectureRequestIntakeFacade intakeFacade,
        CancellationToken cancellationToken)
    {
        IActionResult? validation = ValidateDraftFreeText(input?.CurrentOverview, "CurrentOverview");
        if (validation is not null)
            return validation;

        return Ok(await intakeFacade.RewriteOverviewAsync(input!, cancellationToken));
    }

    [HttpPost("request/draft/clarification-answers/rephrase")]
    [Authorize(Policy = ArchLucidPolicies.ExecuteAuthority)]
    [MutatingAuditExcluded("Clarification rephrase is advisory-only and does not persist domain mutations.")]
    [ProducesResponseType(typeof(RephraseClarificationAnswersResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> RephraseClarificationAnswers(
        [FromBody] RephraseClarificationAnswersInput? input,
        [FromServices] IArchitectureRequestIntakeFacade intakeFacade,
        CancellationToken cancellationToken)
    {
        if (input is null)
            return this.BadRequestProblem("Request body is required.", ProblemTypes.RequestBodyRequired);
        if (input.Items.Count == 0)
            return this.BadRequestProblem("At least one clarification item is required.", ProblemTypes.ValidationFailed);

        foreach (ClarificationAnswerRephraseItem item in input.Items)
        {
            if (string.IsNullOrWhiteSpace(item.QuestionKey))
                return this.BadRequestProblem("Each item must include QuestionKey.", ProblemTypes.ValidationFailed);
            if (string.IsNullOrWhiteSpace(item.QuestionPrompt) || item.QuestionPrompt.Trim().Length < 10)
                return this.BadRequestProblem("Each item must include QuestionPrompt with at least 10 characters.", ProblemTypes.ValidationFailed);
            if (DraftIntakeValidation.ExceedsMaximumFreeTextIntentLength(item.QuestionPrompt))
                return this.BadRequestProblem($"Each item QuestionPrompt must not exceed {DraftIntakeValidation.MaximumFreeTextIntentLength} characters.", ProblemTypes.ValidationFailed);
            if (string.IsNullOrWhiteSpace(item.ExtractedAnswer) || item.ExtractedAnswer.Trim().Length < 3)
                return this.BadRequestProblem("Each item must include ExtractedAnswer with at least 3 characters.", ProblemTypes.ValidationFailed);
            if (DraftIntakeValidation.ExceedsMaximumFreeTextIntentLength(item.ExtractedAnswer))
                return this.BadRequestProblem($"Each item ExtractedAnswer must not exceed {DraftIntakeValidation.MaximumFreeTextIntentLength} characters.", ProblemTypes.ValidationFailed);
        }

        return Ok(await intakeFacade.RephraseClarificationAnswersAsync(input, cancellationToken));
    }

    [HttpPost("request/draft/suggestion/explain")]
    [Authorize(Policy = ArchLucidPolicies.ExecuteAuthority)]
    [MutatingAuditExcluded("Explain endpoint is advisory-only and does not persist domain mutations.")]
    [ProducesResponseType(typeof(ExplainStructuredBriefSuggestionResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> ExplainStructuredBriefSuggestion(
        [FromBody] ExplainStructuredBriefSuggestionInput? input,
        [FromServices] IArchitectureRequestIntakeFacade intakeFacade,
        CancellationToken cancellationToken)
    {
        if (input is null)
            return this.BadRequestProblem("Request body is required.", ProblemTypes.RequestBodyRequired);
        IActionResult? sourceValidation = ValidateDraftFreeText(input.SourceText, "SourceText");
        if (sourceValidation is not null)
            return sourceValidation;
        if (string.IsNullOrWhiteSpace(input.SuggestionText))
            return this.BadRequestProblem("SuggestionText is required.", ProblemTypes.ValidationFailed);

        if (DraftIntakeValidation.ExceedsMaximumFreeTextIntentLength(input.SuggestionText))
            return this.BadRequestProblem(
                $"SuggestionText must not exceed {DraftIntakeValidation.MaximumFreeTextIntentLength} characters.",
                ProblemTypes.ValidationFailed);

        return Ok(await intakeFacade.ExplainStructuredBriefSuggestionAsync(input, cancellationToken));
    }
}
