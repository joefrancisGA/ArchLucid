using ArchLucid.Api.Attributes;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Application.Planning;
using ArchLucid.Contracts.Requests;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Authorization;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ArchLucid.Api.Controllers.Authority;

public sealed partial class RunsController
{
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
}
