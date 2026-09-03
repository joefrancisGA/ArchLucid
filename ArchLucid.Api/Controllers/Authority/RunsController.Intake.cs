using ArchLucid.Api.Attributes;
using ArchLucid.Api.Contracts;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Application.Operations;
using ArchLucid.Application.Planning;
using ArchLucid.Application.Planning.AdvisoryDraft;
using ArchLucid.Contracts.Drafts;
using ArchLucid.Contracts.Requests;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.Scoping;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace ArchLucid.Api.Controllers.Authority;

public sealed partial class RunsController
{
    private const int MinimumIntakeTextLength = 20;

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

    [HttpPost("request/draft/async")]
    [Authorize(Policy = ArchLucidPolicies.ExecuteAuthority)]
    [AsyncRequired]
    [MutatingAuditExcluded("Async draft endpoint is advisory-only and does not persist domain mutations.")]
    [ProducesResponseType(StatusCodes.Status202Accepted)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [EnableRateLimiting("expensive")]
    public async Task<IActionResult> DraftRequestAsync(
        [FromBody] DraftArchitectureRequestInput? input,
        [FromServices] IArchitectureRequestIntakeFacade intakeFacade,
        [FromServices] IAdvisoryDraftOperationAcceptor advisoryDraftOperationAcceptor,
        CancellationToken cancellationToken)
    {
        IActionResult? validation = ValidateDraftFreeText(input?.FreeTextDescription, "FreeTextDescription");
        if (validation is not null)
            return validation;

        string operationId = await advisoryDraftOperationAcceptor.AcceptAsync(
            input!,
            scopeContextProvider.GetCurrentScope(),
            cancellationToken);

        Response.Headers.Location = $"/v1/operations/{operationId}";
        return StatusCode(StatusCodes.Status202Accepted);
    }

    [HttpGet("request/draft/async/{operationId:guid}/result")]
    [Authorize(Policy = ArchLucidPolicies.ExecuteAuthority)]
    [ProducesResponseType(typeof(DraftArchitectureRequestResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    [ProducesResponseType(StatusCodes.Status422UnprocessableEntity)]
    public IActionResult GetDraftRequestAsyncResult(
        [FromRoute] Guid operationId,
        [FromServices] IArchitectureRequestIntakeFacade intakeFacade)
    {
        AdvisoryDraftOperationQueryResult result =
            intakeFacade.GetDraftAsyncResult(operationId, scopeContextProvider.GetCurrentScope());

        return result.Outcome switch
        {
            AdvisoryDraftOperationOutcome.Success => Ok(result.Result!),
            AdvisoryDraftOperationOutcome.NotFound => this.NotFoundProblem(
                "Advisory draft operation was not found for this workspace.",
                ProblemTypes.ResourceNotFound),
            AdvisoryDraftOperationOutcome.InProgress => this.ConflictProblem(
                "Structured brief suggestions are still in progress.",
                ProblemTypes.Conflict),
            AdvisoryDraftOperationOutcome.Failed => this.UnprocessableEntityProblem(
                result.ErrorMessage ?? "Structured brief suggestion failed.",
                ProblemTypes.BusinessRuleViolation),
            AdvisoryDraftOperationOutcome.Canceled => this.ConflictProblem(
                "Structured brief suggestion was canceled.",
                ProblemTypes.Conflict),
            AdvisoryDraftOperationOutcome.ResultUnavailable => this.NotFoundProblem(
                "Structured brief suggestion result is not available.",
                ProblemTypes.ResourceNotFound),
            _ => throw new InvalidOperationException($"Unexpected draft operation outcome: {result.Outcome}."),
        };
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

    [HttpPost("chat-intake")]
    [Authorize(Policy = ArchLucidPolicies.ExecuteAuthority)]
    [MutatingAuditExcluded("Chat intake is advisory-only and does not persist domain mutations.")]
    [ProducesResponseType(typeof(ArchitectureRequest), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status422UnprocessableEntity)]
    public async Task<IActionResult> ChatIntake(
        [FromBody] ChatIntakeRequest? input,
        [FromServices] IArchitectureRequestIntakeFacade intakeFacade,
        CancellationToken cancellationToken)
    {
        if (input is null)
            return this.BadRequestProblem("Request body is required.", ProblemTypes.RequestBodyRequired);
        IActionResult? validation = ValidateDraftFreeText(input.RawText, "RawText");
        if (validation is not null)
            return validation;

        return MapIntakeParseResult(await intakeFacade.ParseChatIntakeAsync(input, cancellationToken));
    }

    [HttpPost("connector-intake")]
    [Authorize(Policy = ArchLucidPolicies.ExecuteAuthority)]
    [MutatingAuditExcluded("Connector intake is advisory-only and does not persist domain mutations.")]
    [ProducesResponseType(typeof(ArchitectureRequest), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status422UnprocessableEntity)]
    public async Task<IActionResult> ConnectorIntake(
        [FromBody] ConnectorIntakeRequest? input,
        [FromServices] IArchitectureRequestIntakeFacade intakeFacade,
        CancellationToken cancellationToken)
    {
        if (input is null)
            return this.BadRequestProblem("Request body is required.", ProblemTypes.RequestBodyRequired);
        if (string.IsNullOrWhiteSpace(input.Source))
            return this.BadRequestProblem("Source is required.", ProblemTypes.ValidationFailed);

        return MapIntakeParseResult(await intakeFacade.ParseConnectorIntakeAsync(input, cancellationToken));
    }

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
