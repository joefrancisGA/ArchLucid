using ArchLucid.Api.ProblemDetails;
using ArchLucid.Application.AwsExtractor;
using ArchLucid.Application.Common;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.Scoping;

using Asp.Versioning;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ArchLucid.Api.Controllers.Admin;

/// <summary>
///     Triggers Tier 2 hosted AWS extractor collection (AdminAuthority — ingest audit emitted by upload pipeline).
/// </summary>
[ApiController]
[Authorize(Policy = ArchLucidPolicies.AdminAuthority)]
[ApiVersion("1.0")]
[Route("v{version:apiVersion}/admin/aws-extractor/hosted")]
public sealed class HostedAwsExtractorRunController(
    IHostedAwsExtractorRunService runService,
    IScopeContextProvider scopeContextProvider,
    IActorContext actorContext) : ControllerBase
{
    private readonly IHostedAwsExtractorRunService _runService =
        runService ?? throw new ArgumentNullException(nameof(runService));

    private readonly IScopeContextProvider _scopeContextProvider =
        scopeContextProvider ?? throw new ArgumentNullException(nameof(scopeContextProvider));

    private readonly IActorContext _actorContext =
        actorContext ?? throw new ArgumentNullException(nameof(actorContext));

    [HttpPost("run")]
    [MutatingAuditExcluded("CloudInventoryExtractorIngestService emits package audit events on successful ingest.")]
    [ProducesResponseType(typeof(HostedAwsExtractorRunResponse), StatusCodes.Status202Accepted)]
    [ProducesResponseType(typeof(Microsoft.AspNetCore.Mvc.ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(Microsoft.AspNetCore.Mvc.ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status503ServiceUnavailable)]
    [ProducesResponseType(typeof(Microsoft.AspNetCore.Mvc.ProblemDetails), StatusCodes.Status422UnprocessableEntity)]
    public async Task<IActionResult> RunAsync(
        [FromBody] HostedAwsExtractorRunBody body,
        CancellationToken cancellationToken)
    {
        if (body is null || body.ConnectionId == Guid.Empty)
            return this.BadRequestProblem("connectionId is required.", ProblemTypes.ValidationFailed);

        ScopeContext scope = _scopeContextProvider.GetCurrentScope();
        string actorId = _actorContext.GetActorId();

        HostedAwsExtractorRunResult result = await _runService
            .RunAsync(
                scope.TenantId,
                body.ConnectionId,
                body.RunId,
                actorId,
                HttpContext.TraceIdentifier,
                cancellationToken)
            .ConfigureAwait(false);

        if (result.FailureKind == HostedAwsExtractorRunFailureKind.FeatureDisabled)
        {
            return this.ServiceUnavailableProblem(
                result.FailureDetail ?? "Hosted AWS extractor is disabled.",
                ProblemTypes.UnavailableInProduction);
        }

        if (result.FailureKind == HostedAwsExtractorRunFailureKind.NotConfigured)
        {
            return this.NotFoundProblem(
                result.FailureDetail
                ?? "No hosted AWS extractor connection exists for this tenant.",
                ProblemTypes.ResourceNotFound);
        }

        if (!result.Succeeded)
            return this.UnprocessableEntityProblem(result.FailureDetail ?? "Hosted AWS extractor run failed.");

        return Accepted(new HostedAwsExtractorRunResponse
        {
            PackageId = result.PackageId!.Value,
            ResourceCount = result.ResourceCount
        });
    }
}
