using System.Security.Cryptography;
using System.Text;
using System.Text.Json;

using ArchLucid.Api.ProblemDetails;
using ArchLucid.Application.Architecture;
using ArchLucid.Application.Common;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Diagnostics;
using ArchLucid.Core.Scoping;
using ArchLucid.Host.Core.ProblemDetails;
using ArchLucid.Persistence.Serialization;

using Asp.Versioning;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.Extensions.Options;

namespace ArchLucid.Api.Controllers.Authority;

/// <summary>Lightweight architecture quick scan (single LLM pass; no run lifecycle).</summary>
[ApiController]
[Authorize(Policy = ArchLucidPolicies.ReadAuthority)]
[ApiVersion("1.0")]
[Route("v{version:apiVersion}/architecture")]
[EnableRateLimiting("fixed")]
[ProducesResponseType(StatusCodes.Status401Unauthorized)]
[ProducesResponseType(StatusCodes.Status403Forbidden)]
public sealed class ArchitectureQuickScanController(
    IQuickScanService quickScanService,
    IQuickScanGuard quickScanGuard,
    IQuickScanTelemetry quickScanTelemetry,
    IOptionsMonitor<QuickScanOptions> quickScanOptions,
    IOptionsMonitor<QuickScanSafetyOptions> quickScanSafetyOptions,
    IQuickScanCostEstimator quickScanCostEstimator,
    IQuickScanGlobalBudgetReservationService quickScanGlobalBudgetReservationService,
    IActorContext actorContext,
    IAuditService auditService,
    IScopeContextProvider scopeContextProvider,
    ILlmCostEstimator costEstimator,
    TimeProvider timeProvider) : ControllerBase
{
    /// <summary>Returns public capacity information for the Quick Scan marketing surface.</summary>
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
    public IActionResult GetQuickScanSample([FromQuery] string? systemName, [FromQuery] string? primaryEnvironment)
    {
        quickScanTelemetry.RecordSampleView(BuildGuardContext(string.Empty));
        ArchitectureQuickScanResponse body = QuickScanSampleResultProvider.Build(systemName, primaryEnvironment);

        return Ok(body);
    }

    /// <summary>Runs a quick scan from minimal context (simulator-friendly by default).</summary>
    // idempotency-posture: operator-documented-safe-retry
    [HttpPost("quick-scan")]
    [ProducesResponseType(typeof(ArchitectureQuickScanResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(Microsoft.AspNetCore.Mvc.ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(Microsoft.AspNetCore.Mvc.ProblemDetails), StatusCodes.Status429TooManyRequests)]
    [ProducesResponseType(typeof(Microsoft.AspNetCore.Mvc.ProblemDetails), StatusCodes.Status503ServiceUnavailable)]
    public async Task<IActionResult> PostQuickScanAsync(
        [FromBody] ArchitectureQuickScanRequest? request,
        CancellationToken cancellationToken)
    {
        QuickScanOptions options = quickScanOptions.CurrentValue;

        if (!QuickScanRequestValidator.TryValidate(request, options, out QuickScanRequestValidator.ValidatedQuickScanRequest? validated, out string? validationError))
            return this.BadRequestProblem(validationError ?? "Validation failed.", ProblemTypes.ValidationFailed);

        QuickScanGuardContext guardContext = BuildGuardContext(validated!.Description);
        quickScanTelemetry.RecordAttempt(guardContext);

        QuickScanGuardDecision decision = quickScanGuard.TryBeginScan(guardContext);

        if (!decision.Allowed)
        {
            quickScanTelemetry.RecordRejection(guardContext, decision.RejectionReason!.Value);
            quickScanGuard.RecordRejection(guardContext, decision.RejectionReason.Value);

            return decision.RejectionReason switch
            {
                QuickScanGuardRejectionReason.Disabled
                    or QuickScanGuardRejectionReason.GlobalHourlySpendCeiling
                    or QuickScanGuardRejectionReason.GlobalDailySpendCeiling
                    or QuickScanGuardRejectionReason.ConcurrentScanLimit =>
                    this.ServiceUnavailableProblem("Quick Scan has reached its demonstration capacity for today."),

                QuickScanGuardRejectionReason.SignInRequired =>
                    StatusCode(
                        StatusCodes.Status403Forbidden,
                        new Microsoft.AspNetCore.Mvc.ProblemDetails
                        {
                            Title = "Sign-in required",
                            Detail = "Additional Quick Scan attempts require sign-in.",
                            Type = ProblemTypes.BusinessRuleViolation,
                            Status = StatusCodes.Status403Forbidden,
                        }),

                _ => StatusCode(
                    StatusCodes.Status429TooManyRequests,
                    new Microsoft.AspNetCore.Mvc.ProblemDetails
                    {
                        Title = "Too many requests",
                        Detail = "Quick Scan is temporarily unavailable. Try again later or view the sample result.",
                        Type = ProblemTypes.LlmTokenQuotaExceeded,
                        Status = StatusCodes.Status429TooManyRequests,
                    }),
            };
        }

        DateTimeOffset started = timeProvider.GetUtcNow();
        decimal reservedCostUsd = 0m;
        Guid? globalBudgetReservationId = null;
        QuickScanSafetyOptions safetyOptions = quickScanSafetyOptions.CurrentValue;

        if (safetyOptions.Enabled)
        {
            string? clientRequestedModelId = Request.Headers["X-Quick-Scan-Model"].FirstOrDefault();
            QuickScanCostEstimateResult costReservation = quickScanCostEstimator.TryReserveCost(
                validated,
                clientRequestedModelId,
                started);

            if (!costReservation.Allowed)
            {
                quickScanTelemetry.RecordFailure(
                    guardContext,
                    $"pre_exec_cost_{costReservation.RejectionReason}",
                    TimeSpan.Zero);

                return this.ServiceUnavailableProblem("Quick Scan has reached its demonstration capacity for today.");
            }

            reservedCostUsd = costReservation.Reservation!.TotalReservedUsd;

            QuickScanGlobalBudgetReservationAttemptResult budgetReservation =
                await quickScanGlobalBudgetReservationService.TryReserveAsync(
                    HttpContext.TraceIdentifier,
                    reservedCostUsd,
                    started,
                    cancellationToken).ConfigureAwait(false);

            if (!budgetReservation.Allowed)
            {
                quickScanTelemetry.RecordFailure(
                    guardContext,
                    $"global_budget_{budgetReservation.RejectionReason}",
                    TimeSpan.Zero);

                return this.ServiceUnavailableProblem("Quick Scan has reached its demonstration capacity for today.");
            }

            globalBudgetReservationId = budgetReservation.ReservationId;
        }

        quickScanGuard.RecordScanStarted(guardContext);

        try
        {
            Dictionary<string, string> files = QuickScanMinimalContextBuilder.BuildFiles(validated);
            QuickScanResult scan = await quickScanService.ScanAsync(files, cancellationToken).ConfigureAwait(false);
            ArchitectureQuickScanResponse body = ArchitectureQuickScanResponseMapper.Map(
                scan,
                validated,
                options.MaxFindingsReturned);

            AgentCompletionTokenUsage.TryPeek(out int? inputTokens, out int? outputTokens, out int? _);
            decimal estimatedCost = costEstimator.EstimateUsd(inputTokens ?? 0, outputTokens ?? 0, 0, deploymentLabel: null)
                ?? reservedCostUsd;
            TimeSpan duration = timeProvider.GetUtcNow() - started;

            if (estimatedCost > options.MaxEstimatedCostUsdPerScan)
            {
                if (globalBudgetReservationId.HasValue)
                {
                    await quickScanGlobalBudgetReservationService
                        .ReleaseAsync(globalBudgetReservationId.Value, cancellationToken)
                        .ConfigureAwait(false);
                }

                quickScanTelemetry.RecordFailure(guardContext, "per_scan_cost_exceeded", duration);

                return this.ServiceUnavailableProblem("Quick Scan has reached its demonstration capacity for today.");
            }

            if (globalBudgetReservationId.HasValue)
            {
                await quickScanGlobalBudgetReservationService
                    .CommitAsync(globalBudgetReservationId.Value, estimatedCost, cancellationToken)
                    .ConfigureAwait(false);
            }

            quickScanGuard.RecordScanCompleted(
                guardContext,
                succeeded: true,
                estimatedCost,
                inputTokens ?? 0,
                outputTokens ?? 0,
                duration);

            quickScanTelemetry.RecordSuccess(
                guardContext,
                body.ScanId,
                estimatedCost,
                inputTokens ?? 0,
                outputTokens ?? 0,
                modelLabel: "quick-scan",
                duration);

            ScopeContext scope = scopeContextProvider.GetCurrentScope();
            string auditActor = actorContext.GetActor();

            await auditService.LogAsync(
                new AuditEvent
                {
                    EventType = AuditEventTypes.ArchitectureQuickScanExecuted,
                    ActorUserId = auditActor,
                    ActorUserName = auditActor,
                    TenantId = scope.TenantId,
                    WorkspaceId = scope.WorkspaceId,
                    ProjectId = scope.ProjectId,
                    CorrelationId = HttpContext.TraceIdentifier,
                    DataJson = JsonSerializer.Serialize(
                        new
                        {
                            validated.SystemName,
                            validated.PrimaryEnvironment,
                            descriptionLength = validated.Description.Length,
                            concernCount = validated.ArchitectureConcerns.Count,
                            scan.ScanId,
                            findingCount = scan.Findings.Count,
                            summaryLength = scan.Summary.Length
                        },
                        AuditJsonSerializationOptions.Instance)
                },
                cancellationToken).ConfigureAwait(false);

            return Ok(body);
        }
        catch (Exception)
        {
            TimeSpan duration = timeProvider.GetUtcNow() - started;

            if (globalBudgetReservationId.HasValue)
            {
                await quickScanGlobalBudgetReservationService
                    .ReleaseAsync(globalBudgetReservationId.Value, cancellationToken)
                    .ConfigureAwait(false);
            }

            quickScanTelemetry.RecordFailure(guardContext, "execution_failed", duration);
            quickScanGuard.RecordScanCompleted(guardContext, succeeded: false, 0m, 0, 0, duration);

            return this.ServiceUnavailableProblem("Quick Scan could not be completed. View the sample result or try again later.");
        }
    }

    private QuickScanGuardContext BuildGuardContext(string description)
    {
        string clientIp = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";
        string sessionId = Request.Headers["X-Quick-Scan-Session"].FirstOrDefault()
            ?? Request.Headers["X-ArchLucid-Anonymous-Session"].FirstOrDefault()
            ?? Request.Cookies["al_quick_scan_session"]
            ?? clientIp;

        string fingerprint = ComputeFingerprint(description, sessionId);

        return new QuickScanGuardContext
        {
            ClientIp = clientIp,
            SessionId = sessionId,
            PayloadFingerprint = fingerprint,
        };
    }

    private static string ComputeFingerprint(string description, string sessionId)
    {
        string payload = $"{sessionId}:{description.Trim().ToLowerInvariant()}";
        byte[] hash = SHA256.HashData(Encoding.UTF8.GetBytes(payload));

        return Convert.ToHexString(hash);
    }
}
