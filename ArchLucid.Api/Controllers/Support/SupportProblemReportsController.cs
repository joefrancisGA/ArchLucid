using System.Text.Json;

using ArchLucid.Api.ProblemDetails;
using ArchLucid.Application.Common;
using ArchLucid.Application.Support;
using ArchLucid.Contracts.Support;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Support;

using Asp.Versioning;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace ArchLucid.Api.Controllers.Support;

/// <summary>Structured support problem report intake (TB-788).</summary>
[ApiController]
[Authorize(Policy = ArchLucidPolicies.ExecuteAuthority)]
[ApiVersion("1.0")]
[Route("v{version:apiVersion}/support")]
[EnableRateLimiting("expensive")]
public sealed class SupportProblemReportsController(
    ISupportProblemReportIntakeService intakeService,
    IScopeContextProvider scopeContextProvider,
    IActorContext actorContext,
    IAuditService auditService) : ControllerBase
{
    private readonly ISupportProblemReportIntakeService _intakeService =
        intakeService ?? throw new ArgumentNullException(nameof(intakeService));

    private readonly IScopeContextProvider _scopeContextProvider =
        scopeContextProvider ?? throw new ArgumentNullException(nameof(scopeContextProvider));

    private readonly IActorContext _actorContext = actorContext ?? throw new ArgumentNullException(nameof(actorContext));

    private readonly IAuditService _auditService = auditService ?? throw new ArgumentNullException(nameof(auditService));

    /// <summary>Accepts a consent-gated support problem report and returns a durable reference id.</summary>
    [HttpPost("problem-reports")]
    [ProducesResponseType(typeof(SubmitSupportProblemReportResponse), StatusCodes.Status202Accepted)]
    [ProducesResponseType(typeof(Microsoft.AspNetCore.Mvc.ProblemDetails), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> SubmitAsync(
        [FromBody] SubmitSupportProblemReportRequest? request,
        CancellationToken cancellationToken)
    {
        if (request is null)
        {
            return this.BadRequestProblem("Request body is required.", ProblemTypes.RequestBodyRequired);
        }

        ScopeContext scope = _scopeContextProvider.GetCurrentScope();
        string actorId = _actorContext.GetActorId();
        string? submitterMailbox = _actorContext.TryGetSubmitterMailbox();

        try
        {
            SubmitSupportProblemReportResponse response = await _intakeService.SubmitAsync(
                scope,
                actorId,
                submitterMailbox,
                request,
                cancellationToken).ConfigureAwait(false);

            await _auditService.LogAsync(
                new AuditEvent
                {
                    EventType = AuditEventTypes.SupportProblemReportSubmitted,
                    ActorUserId = actorId,
                    TenantId = scope.TenantId,
                    WorkspaceId = scope.WorkspaceId,
                    ProjectId = scope.ProjectId,
                    DataJson = JsonSerializer.Serialize(
                        new
                        {
                            referenceId = response.ReferenceId,
                            correlationId = request.Context?.CorrelationId,
                            clientRequestId = request.Context?.ClientRequestId,
                            routePath = request.Context?.RoutePath,
                            errorCode = request.Context?.ErrorCode
                        })
                },
                cancellationToken).ConfigureAwait(false);

            return Accepted(response);
        }
        catch (SupportProblemReportConsentRequiredException ex)
        {
            return this.BadRequestProblem(ex.Message, ProblemTypes.ValidationFailed);
        }
        catch (SupportProblemReportScopeMismatchException ex)
        {
            return this.BadRequestProblem(ex.Message, ProblemTypes.ValidationFailed);
        }
        catch (SupportProblemReportValidationException ex)
        {
            return this.BadRequestProblem(ex.Message, ProblemTypes.ValidationFailed);
        }
    }
}
