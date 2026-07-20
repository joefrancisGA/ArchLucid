using ArchLucid.Api.Controllers;
using ArchLucid.Api.Security;
using ArchLucid.Application.Architecture;
using ArchLucid.Application.Common;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Scoping;
using ArchLucid.Host.Core.ProblemDetails;

using Asp.Versioning;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.Extensions.Options;

namespace ArchLucid.Api.Controllers.Marketing;

/// <summary>Anonymous marketing Quick Scan — no privileged proxy bearer required (TB-895).</summary>
[ApiController]
[ApiVersion("1.0")]
[Route("v{version:apiVersion}/marketing/quick-scan")]
[EnableRateLimiting("fixed")]
[AllowAnonymous]
[AllowUnscopedRoute]
public sealed class MarketingQuickScanController(
    IQuickScanGuard quickScanGuard,
    IQuickScanTelemetry quickScanTelemetry,
    IQuickScanExecutionOrchestrator quickScanExecutionOrchestrator,
    IOptionsMonitor<QuickScanSafetyOptions> quickScanSafetyOptions,
    IScopeContextProvider scopeContextProvider,
    IActorContext actorContext) : ControllerBase
{
    /// <summary>Returns public capacity information for the Quick Scan marketing surface.</summary>
    [HttpGet("status")]
    [ProducesResponseType(typeof(QuickScanStatusResponse), StatusCodes.Status200OK)]
    public IActionResult GetQuickScanStatus()
    {
        QuickScanGuardContext context = BuildGuardContext(string.Empty);
        QuickScanStatusResponse status = quickScanGuard.GetStatus(context);

        if (!IsAnonymousExecutionAllowed())
        {
            return Ok(new QuickScanStatusResponse
            {
                Enabled = status.Enabled,
                CapacityAvailable = false,
                RequireSignIn = status.RequireSignIn,
                SampleResultAvailable = status.SampleResultAvailable,
            });
        }

        return Ok(status);
    }

    /// <summary>Returns a static sample result that does not invoke AI.</summary>
    [HttpGet("sample")]
    [ProducesResponseType(typeof(ArchitectureQuickScanResponse), StatusCodes.Status200OK)]
    public IActionResult GetQuickScanSample([FromQuery] string? systemName, [FromQuery] string? primaryEnvironment)
    {
        quickScanTelemetry.RecordSampleView(BuildGuardContext(string.Empty));
        ArchitectureQuickScanResponse body = QuickScanSampleResultProvider.Build(systemName, primaryEnvironment);

        return Ok(body);
    }

    /// <summary>Runs an anonymous marketing quick scan with enforced per-request bounds.</summary>
    // idempotency-posture: operator-documented-safe-retry
    [HttpPost]
    [ProducesResponseType(typeof(ArchitectureQuickScanResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(Microsoft.AspNetCore.Mvc.ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(Microsoft.AspNetCore.Mvc.ProblemDetails), StatusCodes.Status429TooManyRequests)]
    [ProducesResponseType(typeof(Microsoft.AspNetCore.Mvc.ProblemDetails), StatusCodes.Status503ServiceUnavailable)]
    [MutatingAuditExcluded("Audit: IQuickScanExecutionOrchestrator logs ArchitectureQuickScanExecuted via IAuditService.")]
    public async Task<IActionResult> PostQuickScanAsync(
        [FromBody] ArchitectureQuickScanRequest? request,
        CancellationToken cancellationToken)
    {
        if (!IsAnonymousExecutionAllowed())
        {
            return QuickScanHttpResultMapper.Map(this, QuickScanExecutionResult.CapacityReached());
        }

        QuickScanExecutionResult result = await quickScanExecutionOrchestrator.ExecuteAsync(
            request,
            BuildExecutionContext(),
            cancellationToken).ConfigureAwait(false);

        return QuickScanHttpResultMapper.Map(this, result);
    }

    private QuickScanExecutionRequestContext BuildExecutionContext()
    {
        ScopeContext scope = scopeContextProvider.GetCurrentScope();

        return new QuickScanExecutionRequestContext
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
    }

    private bool IsAnonymousExecutionAllowed()
    {
        QuickScanSafetyEffectiveFeatureState effective = quickScanSafetyOptions.CurrentValue.ResolveEffectiveFeatureState();

        return effective.Enabled && effective.AnonymousExecutionEnabled;
    }

    private QuickScanGuardContext BuildGuardContext(string description)
    {
        string clientIp = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";
        string sessionId = Request.Headers["X-Quick-Scan-Session"].FirstOrDefault()
            ?? Request.Headers["X-ArchLucid-Anonymous-Session"].FirstOrDefault()
            ?? Request.Cookies["al_quick_scan_session"]
            ?? clientIp;

        string fingerprint = QuickScanGuardContextFactory.ComputeFingerprint(description, sessionId);

        return new QuickScanGuardContext
        {
            ClientIp = clientIp,
            SessionId = sessionId,
            PayloadFingerprint = fingerprint,
        };
    }
}
