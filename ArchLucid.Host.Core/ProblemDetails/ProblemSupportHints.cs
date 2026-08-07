using ArchLucid.Core.Configuration;

namespace ArchLucid.Host.Core.ProblemDetails;

/// <summary>
/// Optional <c>supportHint</c> on problem+json for operators (no secrets; complements <c>errorCode</c>).
/// </summary>
public static class ProblemSupportHints
{
    /// <summary>
    /// Adds <see cref="Microsoft.AspNetCore.Mvc.ProblemDetails.Extensions"/> <c>supportHint</c> when a known <paramref name="problem"/> <c>Type</c> is mapped.
    /// </summary>
    public static void AttachForProblemType(Microsoft.AspNetCore.Mvc.ProblemDetails problem)
    {
        AttachForProblemType(problem, ProblemDetailsAudience.Operator);
    }

    /// <summary>
    /// Adds audience-tier <c>supportHint</c> — buyer tier omits operator route/runbook strings (TB-284).
    /// </summary>
    public static void AttachForProblemType(
        Microsoft.AspNetCore.Mvc.ProblemDetails problem,
        ProblemDetailsAudience audience)
    {
        ArgumentNullException.ThrowIfNull(problem);

        string? type = problem.Type;

        if (string.IsNullOrWhiteSpace(type))
            return;

        string? hint = audience == ProblemDetailsAudience.Buyer
            ? ResolveBuyerSafe(type)
            : ResolveOperator(type);

        if (!string.IsNullOrWhiteSpace(hint))
            problem.Extensions["supportHint"] = hint;
    }

    private static string? ResolveBuyerSafe(string typeUri)
    {
        if (typeUri == ProblemTypes.RunNotFound)
            return "Confirm the review identifier and that you are signed in to the correct organization.";

        if (typeUri == ProblemTypes.ManifestNotFound)
            return "Confirm the review package identifier. It may not exist in your organization yet.";

        if (typeUri == ProblemTypes.ResourceNotFound)
            return "Confirm the identifier and that you are authorized for this organization.";

        if (typeUri == ProblemTypes.Conflict)
            return "Read the detail above. You may need to start a new review or complete an earlier step before retrying.";

        if (typeUri == ProblemTypes.QualityGateRejected)
            return "Add richer architecture context and re-run the review, or ask your workspace owner to review quality settings.";

        if (typeUri is ProblemTypes.ValidationFailed or ProblemTypes.BadRequest or ProblemTypes.RequestBodyRequired)
            return "Correct the fields highlighted above and try again.";

        if (typeUri == ProblemTypes.InvalidRunState)
            return "Check review status: complete required steps before finalizing, or avoid repeating a completed action.";

        if (typeUri == ProblemTypes.CommitFailed)
            return "Review the detail message, ensure required outputs are present, then retry.";

        if (typeUri == ProblemTypes.AgentResultRequired)
            return "Submit the missing output, then retry.";

        if (typeUri == ProblemTypes.UnavailableInProduction)
            return "This action is not available in the current environment.";

        if (typeUri is ProblemTypes.DatabaseTimeout or ProblemTypes.DatabaseUnavailable)
            return "Retry after a short wait. If it persists, contact support with your correlation id.";

        if (typeUri == ProblemTypes.CircuitBreakerOpen)
            return "Automated analysis is temporarily paused after repeated failures. Retry later.";

        if (typeUri == ProblemTypes.LlmTokenQuotaExceeded)
            return "Usage limits were reached. Wait for the window to reset or ask your administrator to adjust limits.";

        if (typeUri == ProblemTypes.AuthorityTenantConcurrentRunsExceeded)
            return "Too many reviews are running at once. Retry in a few minutes.";

        if (typeUri == ProblemTypes.ComparisonVerificationFailed)
            return "Review the differences shown in the response and adjust inputs if you need a passing comparison.";

        if (typeUri == ProblemTypes.BatchReplayAllFailed)
            return "Every item in the batch failed. Fix identifiers or parameters and retry with your correlation id for support.";

        if (typeUri == ProblemTypes.PolicyPackVersionNotFound)
            return "Confirm the policy pack is deployed to your environment.";

        if (typeUri is ProblemTypes.ExportFailed or ProblemTypes.DeterminismFailed)
            return "Retry once. If it persists, contact support with your correlation id.";

        if (typeUri == ProblemTypes.GraphTooLargeForFullResponse)
            return "Load the evidence graph in smaller sections from the review detail page.";

        if (typeUri == ProblemTypes.RequestPayloadTooLarge)
            return "Reduce the size of your upload and try again.";

        if (typeUri == ProblemTypes.TrialExpired)
            return "Your trial period ended. Convert to a paid plan or contact sales to continue.";

        if (typeUri == ProblemTypes.PackagingTierInsufficient)
            return "This feature requires a higher subscription tier. Use the upgrade options in the message or contact sales.";

        if (typeUri == ProblemTypes.UpstreamIntegrationFailed)
            return "A connected system could not be reached. Retry after a short wait or check integration settings.";

        if (typeUri == ProblemTypes.ProvenanceNodeExplanationNotSupported)
            return "Use the review-level explanation summary instead of node-level forensics.";

        if (typeUri == ProblemTypes.InternalError)
            return "Retry once. If it persists, contact support with your correlation id; do not paste secrets.";

        return null;
    }

    private static string? ResolveOperator(string typeUri)
    {
        if (typeUri == ProblemTypes.RunNotFound)

            return "Confirm the run ID. If you use scope headers (x-tenant-id, x-workspace-id, x-project-id), they must match the run's scope.";

        if (typeUri == ProblemTypes.ManifestNotFound)
            return "Confirm the manifest ID and scope. The manifest may not exist in this tenant/workspace/project.";

        if (typeUri == ProblemTypes.ResourceNotFound)
            return "Confirm the resource identifier and that your caller is authorized for the correct scope.";

        if (typeUri == ProblemTypes.Conflict)
            return
                "Read the detail for state or idempotency context. You may need a new run, a different idempotency key, or to complete prior steps (execute before commit).";

        if (typeUri == ProblemTypes.QualityGateRejected)
            return
                "See runbook docs/runbooks/QUALITY_GATE_REJECTION.md. Re-execute with richer architecture context, "
                + "GET …/agent-evaluation for per-trace scores, or ask a workspace owner to review ArchLucid:AgentOutput:QualityGate "
                + "(EnforceOnReject, BlockRunOnReject, PilotStrict thresholds).";

        if (typeUri is ProblemTypes.ValidationFailed or ProblemTypes.BadRequest or ProblemTypes.RequestBodyRequired)
            return "Correct the request using the detail and validation entries above. Swagger (/swagger) lists required fields for each endpoint.";

        if (typeUri == ProblemTypes.InvalidRunState)
            return "Check run status (GET run detail): execute agent tasks before commit, or avoid repeating a terminal step.";

        if (typeUri == ProblemTypes.CommitFailed)
            return "Review the detail; ensure all tasks have results and the run is in the expected state. See server logs for RunId.";

        if (typeUri == ProblemTypes.AgentResultRequired)
            return "Submit the missing agent result payload, then retry.";

        if (typeUri == ProblemTypes.UnavailableInProduction)
            return "This operation is restricted in the current environment; use Development or an approved configuration.";

        if (typeUri is ProblemTypes.DatabaseTimeout or ProblemTypes.DatabaseUnavailable)
            return "Retry after a short wait. If it persists, verify SQL connectivity, migrations, and GET /health/ready.";

        if (typeUri == ProblemTypes.CircuitBreakerOpen)
            return "Downstream AI calls are paused after repeated failures. Retry later; check Azure OpenAI configuration and quotas if applicable.";

        if (typeUri == ProblemTypes.LlmTokenQuotaExceeded)
            return "Raise LlmTokenQuota limits, wait for the sliding window to elapse, or reduce LLM usage. See docs/OPERATIONS_LLM_QUOTA.md.";

        if (typeUri == ProblemTypes.AuthorityTenantConcurrentRunsExceeded)
            return "Retry later, enable deferred authority offload, disable RejectInlineCreateWhenConcurrencyUnavailable, or raise AuthorityPipeline:Concurrency:MaxConcurrentExecutionsPerTenant with operator judgment.";

        if (typeUri == ProblemTypes.ComparisonVerificationFailed)
            return "Review drift fields in the response. Regenerate or verify replay inputs against stored artifacts if you need a passing comparison.";

        if (typeUri == ProblemTypes.BatchReplayAllFailed)
            return
                "Every comparisonRecordId in the batch failed to replay. Fix IDs or replay parameters (or inspect API logs with correlation ID); successful batches include batch-replay-manifest.json with per-id errors when some fail.";

        if (typeUri == ProblemTypes.PolicyPackVersionNotFound)
            return "Confirm the policy pack version exists and is deployed to the environment; check governance configuration.";

        if (typeUri is ProblemTypes.ExportFailed or ProblemTypes.DeterminismFailed)
            return "Retry once. If it persists, capture correlation ID and check API logs for the same RunId or export id.";

        if (typeUri == ProblemTypes.GraphTooLargeForFullResponse)
            return
                "Use GET /v1/evidence-graph/reviews/{runId}/nodes with page/pageSize to retrieve the architecture graph in pages (max page size 200). Cross-page edges are omitted per page; export or downstream analytics may be needed for full linkage.";

        if (typeUri == ProblemTypes.RequestPayloadTooLarge)
            return
                $"Shrink the POST /v1/architecture/request JSON (documents, IaC payloads, hints) or raise {ArchitectureRunCreationPayloadLimitsOptions.MaxPayloadBytesKey} with operator approval (HTTP 413 uses Content-Length; legacy ArchLucid:ContextIngestion:MaxPayloadBytes is still forwarded when the new key is unset).";

        if (typeUri == ProblemTypes.TrialExpired)
            return "Convert the tenant trial (POST /v1/tenant/convert) or purchase a subscription to lift trial limits; see docs/security/TRIAL_LIMITS.md.";

        if (typeUri == ProblemTypes.PackagingTierInsufficient)
            return
                "This route requires a higher commercial tenant tier. Use extension fields pricingUrl/upgradeUrl, POST /v1/tenant/billing/checkout, or your sales order path.";

        if (typeUri == ProblemTypes.UpstreamIntegrationFailed)
            return "Verify third-party credentials, network path, and rate limits; retry after a short wait. Check integration configuration (space key, base URL, token scopes).";

        if (typeUri == ProblemTypes.ProvenanceNodeExplanationNotSupported)
            return
                "Use GET /v1/explain/runs/{runId}/aggregate for the supported run-level summary (Standard tier + ReadAuthority, same as other /v1/explain routes).";

        return typeUri == ProblemTypes.InternalError
            ? "Retry once. If it persists, provide traceId (and X-Correlation-ID if available) to support; do not paste secrets."
            : null;
    }
}
