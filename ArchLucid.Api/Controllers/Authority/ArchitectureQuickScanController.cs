using ArchLucid.Application.Architecture;
using ArchLucid.Application.Common;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Scoping;

using Asp.Versioning;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace ArchLucid.Api.Controllers.Authority;

/// <summary>Authenticated architecture quick scan for signed-in workspace users (TB-895 keeps marketing anonymous path separate).</summary>
[ApiController]
[Authorize(Policy = ArchLucidPolicies.ReadAuthority)]
[ApiVersion("1.0")]
[Route("v{version:apiVersion}/architecture")]
[EnableRateLimiting("fixed")]
[ProducesResponseType(StatusCodes.Status401Unauthorized)]
[ProducesResponseType(StatusCodes.Status403Forbidden)]
public sealed class ArchitectureQuickScanController(
    IQuickScanGuard quickScanGuard,
    IQuickScanTelemetry quickScanTelemetry,
    IQuickScanExecutionOrchestrator quickScanExecutionOrchestrator,
    IActorContext actorContext,
    IScopeContextProvider scopeContextProvider) : ControllerBase
{
    /// <summary>Returns capacity information for signed-in Quick Scan callers.</summary>
    [HttpGet("quick-scan/status")]
    [ProducesResponseType(typeof(QuickScanStatusResponse), StatusCodes.Status200OK)]
    public IActionResult GetQuickScanStatus()
    {
        QuickScanGuardContext context = BuildGuardContext(string.Empty);
        QuickScanStatusResponse status = quickScanGuard.GetStatus(context);

        return Ok(status);
    }

    /// <summary>Returns a static sample result that does not invoke AI.</summary>
    [HttpGet("quick-scan/sample")]
    [ProducesResponseType(typeof(ArchitectureQuickScanResponse), StatusCodes.Status200OK)]
    public IActionResult GetQuickScanSample([FromQuery] string? sourceState)
    {
        QuickScanGuardContext context = BuildGuardContext(string.Empty);
        QuickScanGuardDecision guardDecision = quickScanGuard.TryBeginScan(context);
        QuickScanPublicCapacityStateResolver.Resolution capacity =
            QuickScanPublicCapacityStateResolver.Resolve(
                operational: null,
                guardDecision,
                safetyOptions: new QuickScanSafetyOptions());

        quickScanTelemetry.RecordSampleView(context, sourceState ?? capacity.State.ToString());
        ArchitectureQuickScanResponse body = QuickScanSampleResultProvider.Build();

        return Ok(body);
    }

    /// <summary>Runs a quick scan from minimal context for authenticated workspace users.</summary>
    // idempotency-posture: operator-documented-safe-retry
    [HttpPost("quick-scan")]
    [ProducesResponseType(typeof(ArchitectureQuickScanResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(Microsoft.AspNetCore.Mvc.ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(Microsoft.AspNetCore.Mvc.ProblemDetails), StatusCodes.Status429TooManyRequests)]
    [ProducesResponseType(typeof(Microsoft.AspNetCore.Mvc.ProblemDetails), StatusCodes.Status503ServiceUnavailable)]
    [MutatingAuditExcluded("Audit: IQuickScanExecutionOrchestrator logs ArchitectureQuickScanExecuted via IAuditService.")]
    public async Task<IActionResult> PostQuickScanAsync(
        [FromBody] ArchitectureQuickScanRequest? request,
        CancellationToken cancellationToken)
    {
        ScopeContext scope = scopeContextProvider.GetCurrentScope();

        QuickScanExecutionRequestContext executionContext = new()
        {
            ClientIp = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown",
            SessionId = Request.Headers["X-Quick-Scan-Session"].FirstOrDefault()
                ?? Request.Headers["X-ArchLucid-Anonymous-Session"].FirstOrDefault()
                ?? Request.Cookies["al_quick_scan_session"]
                ?? HttpContext.Connection.RemoteIpAddress?.ToString()
                ?? "unknown",
            TraceIdentifier = HttpContext.TraceIdentifier,
            ClientRequestedModelId = Request.Headers["X-Quick-Scan-Model"].FirstOrDefault(),
            TenantId = scope.TenantId,
            WorkspaceId = scope.WorkspaceId,
            ProjectId = scope.ProjectId,
            AuditActor = actorContext.GetActor(),
        };

        QuickScanExecutionResult result = await quickScanExecutionOrchestrator.ExecuteAsync(
            request,
            executionContext,
            cancellationToken).ConfigureAwait(false);

        return QuickScanHttpResultMapper.Map(this, result);
    }

    private QuickScanGuardContext BuildGuardContext(string description)
    {
        string clientIp = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";
        string sessionId = Request.Headers["X-Quick-Scan-Session"].FirstOrDefault()
            ?? Request.Headers["X-ArchLucid-Anonymous-Session"].FirstOrDefault()
            ?? Request.Cookies["al_quick_scan_session"]
            ?? clientIp;

        return QuickScanGuardContextFactory.Create(clientIp, sessionId, description);
    }
}
