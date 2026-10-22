using ArchLucid.Api.Controllers;
using ArchLucid.Api.Security;
using ArchLucid.Application.Architecture;
using ArchLucid.Application.Common;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.QuickScan;
using ArchLucid.Core.Scoping;
using ArchLucid.Host.Core.ProblemDetails;

using Asp.Versioning;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.OutputCaching;
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
    IQuickScanIdentityAbuseService quickScanIdentityAbuseService,
    IQuickScanSafetyOperationalStateProvider quickScanSafetyOperationalStateProvider,
    IOptionsMonitor<QuickScanSafetyOptions> quickScanSafetyOptions,
    IScopeContextProvider scopeContextProvider,
    IActorContext actorContext) : ControllerBase
{
    /// <summary>Returns public capacity information for the Quick Scan marketing surface.</summary>
    [HttpGet("status")]
    [ProducesResponseType(typeof(QuickScanStatusResponse), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetQuickScanStatusAsync(CancellationToken cancellationToken)
    {
        QuickScanGuardContext context = BuildGuardContext(string.Empty);
        QuickScanGuardDecision guardDecision = quickScanGuard.TryBeginScan(context);

        QuickScanSafetyOptions safetyOptions = quickScanSafetyOptions.CurrentValue;

        if (safetyOptions.Enabled)
        {
            QuickScanIdentityAbuseDecision abuseDecision = await quickScanIdentityAbuseService.EvaluateAsync(
                BuildIdentityAbuseContext(description: string.Empty),
                cancellationToken).ConfigureAwait(false);

            if (!abuseDecision.Allowed)
            {
                guardDecision = QuickScanGuardDecision.Reject(abuseDecision.RejectionReason!.Value);
            }
        }

        QuickScanSafetyOperationalSnapshot operational =
            await quickScanSafetyOperationalStateProvider.GetSnapshotAsync(cancellationToken).ConfigureAwait(false);
        QuickScanPublicCapacityStateResolver.Resolution capacity =
            QuickScanPublicCapacityStateResolver.Resolve(operational, guardDecision, safetyOptions);

        return Ok(MapStatus(guardDecision, operational, capacity));
    }

    /// <summary>Returns a static sample result that does not invoke AI.</summary>
    [HttpGet("sample")]
    [OutputCache(PolicyName = "MarketingArtifact")]
    [ProducesResponseType(typeof(ArchitectureQuickScanResponse), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetQuickScanSampleAsync(
        [FromQuery] string? sourceState,
        CancellationToken cancellationToken)
    {
        QuickScanGuardContext context = BuildGuardContext(string.Empty);
        QuickScanSafetyOperationalSnapshot operational =
            await quickScanSafetyOperationalStateProvider.GetSnapshotAsync(cancellationToken).ConfigureAwait(false);
        QuickScanGuardDecision guardDecision = quickScanGuard.TryBeginScan(context);
        QuickScanPublicCapacityStateResolver.Resolution capacity =
            QuickScanPublicCapacityStateResolver.Resolve(
                operational,
                guardDecision,
                quickScanSafetyOptions.CurrentValue);

        quickScanTelemetry.RecordSampleView(context, sourceState ?? capacity.State.ToString());
        ArchitectureQuickScanResponse body = QuickScanSampleResultProvider.Build();

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
        if (request is null)
        {
            return QuickScanHttpResultMapper.Map(
                this,
                QuickScanExecutionResult.ValidationFailed("Request body is required."));
        }

        QuickScanSafetyOperationalSnapshot operational =
            await quickScanSafetyOperationalStateProvider.GetSnapshotAsync(cancellationToken).ConfigureAwait(false);

        if (!operational.AnonymousExecutionAllowed)
        {
            return QuickScanHttpResultMapper.Map(
                this,
                QuickScanExecutionResult.EmergencyDisabled(
                    string.IsNullOrWhiteSpace(operational.PublicMessage)
                        ? quickScanSafetyOptions.CurrentValue.EmergencyDisabledMessage
                        : operational.PublicMessage));
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

        string sessionId = Request.Headers["X-Quick-Scan-Session"].FirstOrDefault()
            ?? Request.Headers["X-ArchLucid-Anonymous-Session"].FirstOrDefault()
            ?? Request.Cookies["al_quick_scan_session"]
            ?? HttpContext.Connection.RemoteIpAddress?.ToString()
            ?? "unknown";

        string? browserId = Request.Headers["X-Quick-Scan-Browser"].FirstOrDefault()
            ?? Request.Cookies["al_quick_scan_browser"];

        return new QuickScanExecutionRequestContext
        {
            ClientIp = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown",
            SessionId = sessionId,
            BrowserId = string.IsNullOrWhiteSpace(browserId) ? sessionId : browserId,
            TraceIdentifier = HttpContext.TraceIdentifier,
            ClientRequestedModelId = Request.Headers["X-Quick-Scan-Model"].FirstOrDefault(),
            TenantId = scope.TenantId,
            WorkspaceId = scope.WorkspaceId,
            ProjectId = scope.ProjectId,
            AuditActor = actorContext.GetActor(),
            RequiresAnonymousDistributedConcurrency = true,
        };
    }

    private static QuickScanStatusResponse MapStatus(
        QuickScanGuardDecision guardDecision,
        QuickScanSafetyOperationalSnapshot operational,
        QuickScanPublicCapacityStateResolver.Resolution capacity) =>
        new()
        {
            Enabled = operational.AnonymousExecutionAllowed && guardDecision.Allowed,
            CapacityAvailable = capacity.AiExecutionAllowed,
            RequireSignIn = guardDecision.RejectionReason == QuickScanGuardRejectionReason.SignInRequired,
            SampleResultAvailable = capacity.SampleResultAvailable,
            OperationalMode = operational.Mode.ToString(),
            PublicMessage = string.IsNullOrWhiteSpace(operational.PublicMessage) ? null : operational.PublicMessage,
            CapacityState = capacity.State.ToString(),
            CapacityStateMessage = capacity.Message,
        };

    private QuickScanGuardContext BuildGuardContext(string description)
    {
        string clientIp = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";
        string sessionId = ResolveSessionId(clientIp);
        string fingerprint = QuickScanGuardContextFactory.ComputeFingerprint(description, sessionId);

        return new QuickScanGuardContext
        {
            ClientIp = clientIp,
            SessionId = sessionId,
            PayloadFingerprint = fingerprint,
            UseDistributedIdentityAbuseLimit = quickScanSafetyOptions.CurrentValue.Enabled,
        };
    }

    private QuickScanIdentityAbuseAdmitContext BuildIdentityAbuseContext(string description)
    {
        string clientIp = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";
        string sessionId = ResolveSessionId(clientIp);
        string? browserId = Request.Headers["X-Quick-Scan-Browser"].FirstOrDefault()
            ?? Request.Cookies["al_quick_scan_browser"];

        return new QuickScanIdentityAbuseAdmitContext
        {
            ClientIp = clientIp,
            SessionId = sessionId,
            BrowserId = string.IsNullOrWhiteSpace(browserId) ? sessionId : browserId,
            Description = description,
        };
    }

    private string ResolveSessionId(string clientIp) =>
        Request.Headers["X-Quick-Scan-Session"].FirstOrDefault()
        ?? Request.Headers["X-ArchLucid-Anonymous-Session"].FirstOrDefault()
        ?? Request.Cookies["al_quick_scan_session"]
        ?? clientIp;
}

