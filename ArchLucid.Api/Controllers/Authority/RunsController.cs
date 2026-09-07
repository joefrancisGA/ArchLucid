using ArchLucid.Api.Attributes;
using ArchLucid.Api.Contracts;
using ArchLucid.Api.Models;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Application;
using ArchLucid.Application.Common;
using ArchLucid.Application.Architecture;
using ArchLucid.Application.Findings;
using ArchLucid.Application.Planning;
using ArchLucid.Application.Runs;
using ArchLucid.Application.Runs.Orchestration;
using ArchLucid.Application.Runs.Query;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Metadata;
using ArchLucid.Contracts.Pilots;
using ArchLucid.Contracts.Requests;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.DevTesting;
using ArchLucid.Core.Diagnostics;
using ArchLucid.Core.Feedback;
using ArchLucid.Core.Persistence.ApplicationPorts.Runs;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Queries;
using ArchLucid.Persistence.Models;

using Asp.Versioning;

using FluentValidation;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.Extensions.Primitives;

namespace ArchLucid.Api.Controllers.Authority;

/// <summary>
///     HTTP API for mutating architecture runs: create, execute, commit, replay, submit agent results.
/// </summary>
[ApiController]
[Authorize(Policy = ArchLucidPolicies.ReadAuthority)]
[ApiVersion("1.0")]
[Route("v{version:apiVersion}/architecture")]
[EnableRateLimiting("fixed")]
[ProducesResponseType(StatusCodes.Status401Unauthorized)]
[ProducesResponseType(StatusCodes.Status403Forbidden)]
public sealed partial class RunsController(
    IRunLifecycleCommandService runLifecycleCommandService,
    IArchitectureApplicationService architectureApplicationService,
    IValidator<ArchitectureRequest> architectureRequestValidator,
    IScopeContextProvider scopeContextProvider,
    IActorContext actorContext,
    IAuditService auditService,
    IAuthorityQueryService authorityQuery,
    IFindingFeedbackRepository findingFeedbackRepository,
    FindingInstrumentationAuditSupport findingInstrumentationAudit,
    IRunRepository runRepository,
    ILogger<RunsController> logger)
    : ControllerBase
{
    private readonly IAuthorityQueryService authorityQuery =
        authorityQuery ?? throw new ArgumentNullException(nameof(authorityQuery));

    private readonly IFindingFeedbackRepository findingFeedbackRepository =
        findingFeedbackRepository ?? throw new ArgumentNullException(nameof(findingFeedbackRepository));

    private readonly FindingInstrumentationAuditSupport findingInstrumentationAudit =
        findingInstrumentationAudit ?? throw new ArgumentNullException(nameof(findingInstrumentationAudit));

    private readonly IRunRepository _runRepository =
        runRepository ?? throw new ArgumentNullException(nameof(runRepository));

    [IdempotencyFilter]
    [HttpPost("review/{runId}/result")]
    [Authorize(Policy = ArchLucidPolicies.ExecuteAuthority)]
    [ProducesResponseType(typeof(SubmitAgentResultResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> SubmitAgentResult(
        [FromRoute] string runId,
        [FromBody] SubmitAgentResultRequest? request,
        CancellationToken cancellationToken)
    {
        if (request is null)
            return this.BadRequestProblem("Request body is required.", ProblemTypes.ValidationFailed);

        IActionResult? invalidRun = NotFoundWhenRunRouteIdInvalid(runId);

        if (invalidRun is not null)
            return invalidRun;

        SubmitResultResult result =
            await architectureApplicationService.SubmitAgentResultAsync(runId, request.Result, cancellationToken);

        return result.Success
            ? Ok(new SubmitAgentResultResponse { ResultId = result.ResultId! })
            : MapApplicationServiceFailure(result.Error, result.FailureKind, "Submission failed.");
    }

    private static bool TryParseRunGuidForAudit(string runId, out Guid runGuid)
    {
        if (Guid.TryParseExact(runId, "N", out runGuid))
            return true;

        return Guid.TryParse(runId, out runGuid);
    }

    private static Guid? TryParseRunGuidForAudit(string runId) =>
        TryParseRunGuidForAudit(runId, out Guid g) ? g : null;

    private IActionResult? NotFoundWhenRunRouteIdInvalid(string runId)
    {
        if (TryParseRunGuidForAudit(runId, out _))
            return null;

        return this.NotFoundProblem($"Run '{runId}' was not found.", ProblemTypes.RunNotFound);
    }

    private IActionResult MapApplicationServiceFailure(string? error, ApplicationServiceFailureKind? kind,
        string defaultBadRequestDetail)
    {
        string detail = string.IsNullOrWhiteSpace(error) ? defaultBadRequestDetail : error;
        return kind switch
        {
            ApplicationServiceFailureKind.RunNotFound => this.NotFoundProblem(detail, ProblemTypes.RunNotFound),
            ApplicationServiceFailureKind.ResourceNotFound => this.NotFoundProblem(detail,
                ProblemTypes.ResourceNotFound),
            ApplicationServiceFailureKind.Conflict => this.ConflictProblem(detail, ProblemTypes.Conflict),
            _ => this.BadRequestProblem(detail)
        };
    }
}
