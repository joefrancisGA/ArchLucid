using ArchLucid.Application;
using ArchLucid.Application.Analysis;
using ArchLucid.Application.Governance;
using ArchLucid.Application.Runs;
using ArchLucid.Application.Runs.Orchestration;
using ArchLucid.Contracts.Agents;
using ArchLucid.Core.Persistence;
using ArchLucid.Core.Resilience;
using ArchLucid.Core.Tenancy;
using ArchLucid.Persistence.Repositories;

using Microsoft.AspNetCore.Mvc;

using static ArchLucid.Api.ProblemDetails.ApplicationProblemMapper;

namespace ArchLucid.Api.ProblemDetails;

/// <summary>
///     First-match <c>is</c>-chain for exceptions handled by
///     <see cref="ApplicationProblemMapper.TryMapUnhandledException" />.
///     Arm order is significant: several mapped types derive from
///     <see cref="InvalidOperationException" />.
/// </summary>
internal static class ApplicationUnhandledExceptionMapper
{
    internal static bool TryMapUnhandledException(Exception ex, HttpContext httpContext, out ObjectResult? result)
    {
        result = null;
        string? instance = httpContext.Request.Path.Value;

        if (ex is RequestContentSafetyRejectedException contentSafetyRejected)
        {
            result = CreateProblemResult(
                StatusCodes.Status400BadRequest,
                "Bad Request",
                contentSafetyRejected.Message,
                ProblemTypes.ValidationFailed,
                instance,
                httpContext);
            return true;
        }

        if (ex is TrialLimitExceededException tlex)
        {
            result = TrialLimitProblemResponse.CreateResult(tlex, instance, httpContext);

            return true;
        }

        if (ex is UnauthorizedAccessException unauthorized)
        {
            result = CreateProblemResult(
                StatusCodes.Status401Unauthorized,
                "Unauthorized",
                string.IsNullOrWhiteSpace(unauthorized.Message)
                    ? "Authentication is required for this resource."
                    : unauthorized.Message,
                ProblemTypes.Unauthorized,
                instance,
                httpContext);
            return true;
        }

        if (ex is ComparisonVerificationFailedException cvf)
        {
            result = ComparisonVerificationProblemMapper.Map(cvf, instance, httpContext);
            return true;
        }

        if (ex is ConflictException cex)
        {
            result = CreateProblemResult(
                StatusCodes.Status409Conflict,
                "Conflict",
                cex.Message,
                ProblemTypes.Conflict,
                instance,
                httpContext);
            return true;
        }

        if (ex is RunEvidenceAnchorImmutableException anchorImmutable)
        {
            result = CreateProblemResult(
                StatusCodes.Status409Conflict,
                "Conflict",
                anchorImmutable.Message,
                ProblemTypes.Conflict,
                instance,
                httpContext);
            return true;
        }

        if (ex is AgentOutputQualityGateRejectedException qgx)
        {
            result = CreateProblemResult(
                StatusCodes.Status409Conflict,
                "Architecture review needs another pass",
                AgentOutputQualityGateRejectedException.UserFacingDetail,
                ProblemTypes.QualityGateRejected,
                instance,
                httpContext,
                d =>
                {
                    d.Extensions["runId"] = qgx.RunId;
                    d.Extensions["traceId"] = qgx.TraceId;
                    d.Extensions["agentLabel"] = qgx.AgentLabel;

                    if (!string.IsNullOrWhiteSpace(qgx.EvaluationReason))
                        d.Extensions["evaluationReason"] = qgx.EvaluationReason!;

                    d.Extensions[ProblemDocumentationLinks.RunbookExtensionKey] =
                        ProblemDocumentationLinks.QualityGateRejectionRunbookRelativePath;
                });
            return true;
        }

        // Simulator / real executor wrap per-task failures so callers get dispatch key + AgentType; without mapping this
        // surfaced as HTTP 500 (ReplayRun/Execute only caught InvalidOperationException).

        if (ex is AgentHandlerExecutionException agentHandlerEx)
        {
            string detail = agentHandlerEx.InnerException is not null
                ? agentHandlerEx.InnerException.Message
                : agentHandlerEx.Message;
            result = CreateProblemResult(
                StatusCodes.Status400BadRequest,
                "Bad Request",
                detail,
                ProblemTypes.BusinessRuleViolation,
                instance,
                httpContext,
                d =>
                {
                    d.Extensions["agentTypeKey"] = agentHandlerEx.AgentTypeKey;
                    d.Extensions["agentType"] = agentHandlerEx.AgentType.ToString();
                });
            return true;
        }

        if (ex is GoldenManifestSchemaValidationException schemaValidationEx)
        {
            IReadOnlyList<string> errors = schemaValidationEx.Result.Errors;
            string detail = errors.Count == 0
                ? "Golden manifest schema validation failed."
                : string.Join(
                    "; ",
                    errors.Count <= 5
                        ? errors
                        : errors.Take(5).Concat([$"(+{errors.Count - 5} more)"]));
            result = CreateProblemResult(
                StatusCodes.Status400BadRequest,
                "Bad Request",
                detail,
                ProblemTypes.ValidationFailed,
                instance,
                httpContext,
                d => d.Extensions["errors"] = errors.ToArray());
            return true;
        }

        if (ex is RunNotFoundException rnf)
        {
            result = CreateProblemResult(
                StatusCodes.Status404NotFound,
                "Run Not Found",
                rnf.Message,
                ProblemTypes.RunNotFound,
                instance,
                httpContext);
            return true;
        }

        if (ex is PolicyPackNotFoundException pnf)
        {
            result = CreateProblemResult(
                StatusCodes.Status404NotFound,
                "Policy Pack Not Found",
                pnf.Message,
                ProblemTypes.ResourceNotFound,
                instance,
                httpContext);
            return true;
        }

        if (TryMapDatabaseException(ex, instance, httpContext, out result))
            return true;

        // Authority pipeline uses CancellationTokenSource.CancelAfter(PipelineTimeout); that surfaces as
        // OperationCanceledException (same as TaskCanceledException). Without mapping, MVC yields HTTP 500 via the
        // generic handler while integration tests only retry HTTP 503 for cold-start SQL / transient outages.

        if (TryMapRetryableOperationCanceled(ex, httpContext, instance, out result))
            return true;

        if (ex is CircuitBreakerOpenException cbo)
        {
            result = CreateProblemResult(
                StatusCodes.Status503ServiceUnavailable,
                "AI Service Temporarily Unavailable",
                cbo.Message,
                ProblemTypes.CircuitBreakerOpen,
                instance,
                httpContext,
                details =>
                {
                    if (cbo.RetryAfterUtc is { } until)
                        details.Extensions["retryAfterUtc"] = until;
                });

            return true;
        }

        if (ex is RunConcurrencyConflictException rcc)
        {
            result = CreateProblemResult(
                StatusCodes.Status409Conflict,
                "Concurrency conflict",
                rcc.Message,
                ProblemTypes.Conflict,
                instance,
                httpContext);
            return true;
        }

        if (ex is LlmTokenQuotaExceededException quotaEx)
        {
            result = CreateProblemResult(
                StatusCodes.Status429TooManyRequests,
                "LLM token quota exceeded",
                quotaEx.Message,
                ProblemTypes.LlmTokenQuotaExceeded,
                instance,
                httpContext,
                details =>
                {
                    if (quotaEx.RetryAfterUtc is { } until)
                        details.Extensions["retryAfterUtc"] = until;
                });

            return true;
        }

        if (ex is RunCostBudgetExceededPartialPersistRecordedException partialBudget)
        {
            result = CreateProblemResult(
                StatusCodes.Status402PaymentRequired,
                "Cost Limit Exceeded",
                partialBudget.Message,
                ProblemTypes.CostLimitExceeded,
                instance,
                httpContext,
                details =>
                {
                    details.Extensions["persistedAgentOutputs"] = partialBudget.PersistedAgentOutputCount;
                });
            return true;
        }

        if (ex is CostLimitExceededException cle)
        {
            result = CreateProblemResult(
                StatusCodes.Status402PaymentRequired,
                "Cost Limit Exceeded",
                cle.Message,
                ProblemTypes.CostLimitExceeded,
                instance,
                httpContext);
            return true;
        }

        if (ex is GraphResolutionException gre)
        {
            result = CreateProblemResult(
                StatusCodes.Status422UnprocessableEntity,
                "Graph Resolution Failed",
                gre.Message,
                ProblemTypes.GraphResolutionFailed,
                instance,
                httpContext);
            return true;
        }

        if (ex is AuthorityTenantConcurrencyLimitExceededException tcx)
        {
            result = CreateProblemResult(
                StatusCodes.Status429TooManyRequests,
                "Architecture authority concurrency limit exceeded",
                tcx.Message,
                ProblemTypes.AuthorityTenantConcurrentRunsExceeded,
                instance,
                httpContext);

            return true;
        }

        if (ex is InvalidOperationException ioe)
        {
            result = MapInvalidOperation(ioe, instance, ProblemTypes.BadRequest, httpContext);
            return true;
        }

        if (ex is not (ArgumentException or ArgumentNullException))
            return false;

        result = CreateProblemResult(
            StatusCodes.Status400BadRequest,
            "Bad Request",
            ex.Message,
            ProblemTypes.ValidationFailed,
            instance,
            httpContext);
        return true;
    }

    /// <summary>
    ///     Maps internal timeouts that surface as <see cref="OperationCanceledException" /> (including
    ///     <see cref="TaskCanceledException" />) to HTTP 503 when the transport request was not aborted by the caller.
    /// </summary>
    private static bool TryMapRetryableOperationCanceled(
        Exception ex,
        HttpContext httpContext,
        string? instance,
        out ObjectResult? result)
    {
        result = null;

        if (ex is not OperationCanceledException)
            return false;

        // Caller disconnected — avoid emitting application-layer 503 Problem Details for an aborted transport.

        if (httpContext.RequestAborted.IsCancellationRequested)
            return false;

        result = CreateProblemResult(
            StatusCodes.Status503ServiceUnavailable,
            "Request Timeout",
            "An operation timed out or was canceled before completion. The request may succeed on retry.",
            ProblemTypes.DatabaseTimeout,
            instance,
            httpContext);

        return true;
    }
}
