using ArchLucid.Api.Contracts;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Contracts.Requests;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Authorization;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ArchLucid.Api.Controllers.Authority;

/// <summary>
///     Advisory intake endpoints that shape a wizard-ready <see cref="ArchitectureRequest" /> without persisting
///     anything, so a caller can review the parse before creating a run.
/// </summary>
public sealed partial class RunsController
{
    /// <summary>Minimum free-text length accepted by the intake endpoints, in characters.</summary>
    private const int MinimumIntakeTextLength = 20;

    /// <summary>Upper bound on chat intake text so a paste cannot drive an unbounded parse.</summary>
    private const int MaximumChatIntakeTextLength = 50_000;

    [HttpPost("request/draft")]
    [Authorize(Policy = ArchLucidPolicies.ExecuteAuthority)]
    [MutatingAuditExcluded("Draft endpoint is advisory-only and does not persist domain mutations.")]
    [ProducesResponseType(typeof(DraftArchitectureRequestResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> DraftRequest(
        [FromBody] DraftArchitectureRequestInput? input,
        CancellationToken cancellationToken)
    {
        if (input is null)
            return this.BadRequestProblem("Request body is required.", ProblemTypes.RequestBodyRequired);

        if (string.IsNullOrWhiteSpace(input.FreeTextDescription))
            return this.BadRequestProblem("FreeTextDescription is required.", ProblemTypes.ValidationFailed);

        if (input.FreeTextDescription.Trim().Length < MinimumIntakeTextLength)
            return this.BadRequestProblem(
                $"FreeTextDescription must be at least {MinimumIntakeTextLength} characters.",
                ProblemTypes.ValidationFailed);

        DraftArchitectureRequestResponse response = await architectureRequestDraftService.DraftAsync(input, cancellationToken);
        return Ok(response);
    }

    [HttpPost("request/draft/overview-rewrite")]
    [Authorize(Policy = ArchLucidPolicies.ExecuteAuthority)]
    [MutatingAuditExcluded("Overview rewrite is advisory-only and does not persist domain mutations.")]
    [ProducesResponseType(typeof(RewriteArchitectureOverviewResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> RewriteArchitectureOverview(
        [FromBody] RewriteArchitectureOverviewInput? input,
        CancellationToken cancellationToken)
    {
        if (input is null)
            return this.BadRequestProblem("Request body is required.", ProblemTypes.RequestBodyRequired);

        if (string.IsNullOrWhiteSpace(input.CurrentOverview))
            return this.BadRequestProblem("CurrentOverview is required.", ProblemTypes.ValidationFailed);

        if (input.CurrentOverview.Trim().Length < MinimumIntakeTextLength)
            return this.BadRequestProblem(
                $"CurrentOverview must be at least {MinimumIntakeTextLength} characters.",
                ProblemTypes.ValidationFailed);

        RewriteArchitectureOverviewResponse response =
            await architectureOverviewRewriteService.RewriteAsync(input, cancellationToken);

        return Ok(response);
    }

    [HttpPost("request/draft/suggestion/explain")]
    [Authorize(Policy = ArchLucidPolicies.ExecuteAuthority)]
    [MutatingAuditExcluded("Explain endpoint is advisory-only and does not persist domain mutations.")]
    [ProducesResponseType(typeof(ExplainStructuredBriefSuggestionResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> ExplainStructuredBriefSuggestion(
        [FromBody] ExplainStructuredBriefSuggestionInput? input,
        CancellationToken cancellationToken)
    {
        if (input is null)
            return this.BadRequestProblem("Request body is required.", ProblemTypes.RequestBodyRequired);

        if (string.IsNullOrWhiteSpace(input.SourceText))
            return this.BadRequestProblem("SourceText is required.", ProblemTypes.ValidationFailed);

        if (input.SourceText.Trim().Length < MinimumIntakeTextLength)
            return this.BadRequestProblem(
                $"SourceText must be at least {MinimumIntakeTextLength} characters.",
                ProblemTypes.ValidationFailed);

        if (string.IsNullOrWhiteSpace(input.SuggestionText))
            return this.BadRequestProblem("SuggestionText is required.", ProblemTypes.ValidationFailed);

        ExplainStructuredBriefSuggestionResponse response =
            await structuredBriefSuggestionExplainService.ExplainAsync(input, cancellationToken);

        return Ok(response);
    }

    [HttpPost("chat-intake")]
    [Authorize(Policy = ArchLucidPolicies.ExecuteAuthority)]
    [MutatingAuditExcluded("Chat intake is advisory-only and does not persist domain mutations.")]
    [ProducesResponseType(typeof(ArchitectureRequest), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status422UnprocessableEntity)]
    public async Task<IActionResult> ChatIntake(
        [FromBody] ChatIntakeRequest? input,
        CancellationToken cancellationToken)
    {
        if (input is null)
            return this.BadRequestProblem("Request body is required.", ProblemTypes.RequestBodyRequired);

        if (string.IsNullOrWhiteSpace(input.RawText))
            return this.BadRequestProblem("RawText is required.", ProblemTypes.ValidationFailed);

        if (input.RawText.Trim().Length < MinimumIntakeTextLength)
            return this.BadRequestProblem(
                $"RawText must be at least {MinimumIntakeTextLength} characters.",
                ProblemTypes.ValidationFailed);

        if (input.RawText.Trim().Length > MaximumChatIntakeTextLength)
            return this.BadRequestProblem(
                $"RawText must not exceed {MaximumChatIntakeTextLength} characters.",
                ProblemTypes.ValidationFailed);

        ArchitectureRequest parsed;

        try
        {
            parsed = await chatIntakeParserService.ParseAsync(input, cancellationToken);
        }
        catch (InvalidOperationException ex)
        {
            return this.BadRequestProblem(ex.Message, ProblemTypes.ValidationFailed);
        }

        return await ValidateParsedIntakeAsync(parsed, cancellationToken);
    }

    /// <summary>Maps Terraform state JSON or a public Git Terraform file into a wizard-ready architecture request.</summary>
    // idempotency-posture: dry-run-no-persist
    [HttpPost("connector-intake")]
    [Authorize(Policy = ArchLucidPolicies.ExecuteAuthority)]
    [MutatingAuditExcluded("Connector intake is advisory-only and does not persist domain mutations.")]
    [ProducesResponseType(typeof(ArchitectureRequest), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status422UnprocessableEntity)]
    public async Task<IActionResult> ConnectorIntake(
        [FromBody] ConnectorIntakeRequest? input,
        CancellationToken cancellationToken)
    {
        if (input is null)
            return this.BadRequestProblem("Request body is required.", ProblemTypes.RequestBodyRequired);

        if (string.IsNullOrWhiteSpace(input.Source))
            return this.BadRequestProblem("Source is required.", ProblemTypes.ValidationFailed);

        ArchitectureRequest parsed;

        try
        {
            parsed = await connectorIntakeParserService.ParseAsync(input, cancellationToken);
        }
        catch (Exception ex) when (ex is ArgumentException or InvalidOperationException)
        {
            return this.BadRequestProblem(ex.Message, ProblemTypes.ValidationFailed);
        }

        return await ValidateParsedIntakeAsync(parsed, cancellationToken);
    }

    /// <summary>
    ///     Runs the shared <see cref="ArchitectureRequest" /> validator over a parse result: 200 with the request when it
    ///     is usable, 422 listing every rule it broke when it is not.
    /// </summary>
    private async Task<IActionResult> ValidateParsedIntakeAsync(
        ArchitectureRequest parsed,
        CancellationToken cancellationToken)
    {
        FluentValidation.Results.ValidationResult validationResult =
            await architectureRequestValidator.ValidateAsync(parsed, cancellationToken);

        if (validationResult.IsValid)
            return Ok(parsed);

        string detail = string.Join("; ", validationResult.Errors.Select(static error => error.ErrorMessage));

        return this.UnprocessableEntityProblem(detail, ProblemTypes.ValidationFailed);
    }
}
