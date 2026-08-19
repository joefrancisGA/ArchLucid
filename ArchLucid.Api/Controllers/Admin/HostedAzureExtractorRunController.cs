using ArchLucid.Api.ProblemDetails;
using ArchLucid.Application.AzureExtractor;
using ArchLucid.Application.Common;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.Scoping;

using Asp.Versioning;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ArchLucid.Api.Controllers.Admin;

/// <summary>
///     Triggers Tier 2 hosted Azure extractor collection (AdminAuthority — ingest audit emitted by upload pipeline).
/// </summary>
[ApiController]
[Authorize(Policy = ArchLucidPolicies.AdminAuthority)]
[ApiVersion("1.0")]
[Route("v{version:apiVersion}/admin/azure-extractor/hosted")]
public sealed class HostedAzureExtractorRunController(
    IHostedAzureExtractorRunService runService,
    IScopeContextProvider scopeContextProvider,
    IActorContext actorContext) : ControllerBase
{
    private readonly IHostedAzureExtractorRunService _runService =
        runService ?? throw new ArgumentNullException(nameof(runService));

    private readonly IScopeContextProvider _scopeContextProvider =
        scopeContextProvider ?? throw new ArgumentNullException(nameof(scopeContextProvider));

    private readonly IActorContext _actorContext =
        actorContext ?? throw new ArgumentNullException(nameof(actorContext));

    [HttpPost("run")]
    [MutatingAuditExcluded("AzureExtractorIngestService emits AzureExtractorPackage.* audit events on successful ingest.")]
    [ProducesResponseType(typeof(HostedAzureExtractorRunResponse), StatusCodes.Status202Accepted)]
    [ProducesResponseType(typeof(Microsoft.AspNetCore.Mvc.ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(Microsoft.AspNetCore.Mvc.ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status503ServiceUnavailable)]
    [ProducesResponseType(typeof(Microsoft.AspNetCore.Mvc.ProblemDetails), StatusCodes.Status422UnprocessableEntity)]
    public async Task<IActionResult> RunAsync(
        [FromBody] HostedAzureExtractorRunBody body,
        CancellationToken cancellationToken)
    {
        if (body is null || string.IsNullOrWhiteSpace(body.SubscriptionId))
            return this.BadRequestProblem("subscriptionId is required.", ProblemTypes.ValidationFailed);

        ScopeContext scope = _scopeContextProvider.GetCurrentScope();
        string actorId = _actorContext.GetActorId();

        HostedAzureExtractorRunResult result = await _runService
            .RunAsync(
                scope.TenantId,
                body.SubscriptionId,
                body.RunId,
                actorId,
                HttpContext.TraceIdentifier,
                cancellationToken)
            .ConfigureAwait(false);

        if (result.FailureKind == HostedAzureExtractorRunFailureKind.FeatureDisabled)
        {
            return this.ServiceUnavailableProblem(
                result.FailureDetail ?? "Hosted Azure extractor is disabled.",
                ProblemTypes.UnavailableInProduction);
        }

        if (result.FailureKind == HostedAzureExtractorRunFailureKind.NotConfigured)
        {
            return this.NotFoundProblem(
                result.FailureDetail
                ?? "No hosted Azure extractor configuration exists for this tenant and subscription.",
                ProblemTypes.ResourceNotFound);
        }

        if (!result.Succeeded)
            return this.UnprocessableEntityProblem(result.FailureDetail ?? "Hosted extractor run failed.");

        return Accepted(new HostedAzureExtractorRunResponse
        {
            PackageId = result.PackageId!.Value,
            ResourceCount = result.ResourceCount
        });
    }
}

public sealed class HostedAzureExtractorRunBody
{
    public required string SubscriptionId { get; init; }

    public Guid? RunId { get; init; }
}

public sealed class HostedAzureExtractorRunResponse
{
    public Guid PackageId { get; init; }

    public int ResourceCount { get; init; }
}
