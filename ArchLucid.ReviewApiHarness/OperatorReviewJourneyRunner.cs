using System.Diagnostics;
using System.Text.Json;
using System.Text.Json.Nodes;

using Gen = ArchLucid.Api.Client.Generated;

namespace ArchLucid.ReviewApiHarness;

/// <summary>
///     Full-operator architecture review journey: create → execute → poll → findings → finalize →
///     export → governance → audit → list, with real-AI gate and per-step OpenAPI+DTO validation.
/// </summary>
public sealed class OperatorReviewJourneyRunner
{
    private readonly JourneyHttpExecutor _http;
    private readonly JourneyOptions _options;

    public OperatorReviewJourneyRunner(HttpClient http, JourneyOptions options, OpenApiContractCatalog catalog)
    {
        ArgumentNullException.ThrowIfNull(http);
        ArgumentNullException.ThrowIfNull(options);
        ArgumentNullException.ThrowIfNull(catalog);

        _options = options;
        _http = new JourneyHttpExecutor(http, new ResponseValidationPipeline(catalog));
    }

    public async Task<JourneyReport> RunAsync(CancellationToken cancellationToken = default)
    {
        List<JourneyStepResult> steps = [];
        Stopwatch total = Stopwatch.StartNew();
        string? correlationId = null;
        string? runId = null;
        string? finalStatus = null;
        string? manifestVersion = null;
        string? approvalRequestId = null;
        long totalTokens = 0;
        string? structuralMode = null;

        TimedHttpResult health = await _http.SendJsonAsync(
            "health-ready",
            HttpMethod.Get,
            "health/ready",
            content: null,
            schemaName: null,
            dtoType: null,
            extraHeaders: null,
            cancellationToken);
        Add(steps, health, ref correlationId);

        if (!health.Step.Passed)
            return Build(steps, total, runId, correlationId, finalStatus, manifestVersion, approvalRequestId, totalTokens, structuralMode);

        JsonObject requestBody = await ArchitectureRequestPayloadFactory.CreateAsync(_options, cancellationToken);
        TimedHttpResult create = await _http.SendJsonAsync(
            "create-request",
            HttpMethod.Post,
            "v1/architecture/request",
            JourneyHttpExecutor.JsonContent(requestBody.ToJsonString()),
            schemaName: "CreateArchitectureRunResponse",
            dtoType: typeof(Gen.CreateArchitectureRunResponse),
            extraHeaders: null,
            cancellationToken);
        Add(steps, create, ref correlationId);

        if (!create.Step.Passed || string.IsNullOrWhiteSpace(create.RawJson))
            return Build(steps, total, runId, correlationId, finalStatus, manifestVersion, approvalRequestId, totalTokens, structuralMode);

        using (JsonDocument createDoc = JsonDocument.Parse(create.RawJson))
            runId = ArchitectureRunStatusReader.ReadRunId(createDoc.RootElement);

        if (string.IsNullOrWhiteSpace(runId))
        {
            steps.Add(FailInstant("create-request-runId", "Create response validated but run.runId was missing."));
            return Build(steps, total, runId, correlationId, finalStatus, manifestVersion, approvalRequestId, totalTokens, structuralMode);
        }

        // Authority pipeline may already be ReadyForCommit after create — do not call execute to "finish" (API_CONTRACTS.md).
        TimedHttpResult earlyDetail = await _http.SendJsonAsync(
            "detail-after-create",
            HttpMethod.Get,
            $"v1/architecture/review/{runId}",
            content: null,
            schemaName: "RunDetailDto",
            dtoType: typeof(Gen.RunDetailDto),
            extraHeaders: null,
            cancellationToken);
        Add(steps, earlyDetail, ref correlationId);

        if (!earlyDetail.Step.Passed || string.IsNullOrWhiteSpace(earlyDetail.RawJson))
            return Build(steps, total, runId, correlationId, finalStatus, manifestVersion, approvalRequestId, totalTokens, structuralMode);

        bool alreadyReady;

        using (JsonDocument earlyDoc = JsonDocument.Parse(earlyDetail.RawJson))
        {
            string? earlyStatus = ArchitectureRunStatusReader.ReadStatus(earlyDoc.RootElement);
            alreadyReady = ArchitectureRunStatusReader.IsReadyForCommitOrCommitted(earlyStatus);
        }

        if (!alreadyReady)
        {
            TimedHttpResult execute = await _http.SendJsonAsync(
                "execute",
                HttpMethod.Post,
                $"v1/architecture/review/{runId}/execute",
                content: null,
                schemaName: null,
                dtoType: null,
                extraHeaders: null,
                cancellationToken);
            Add(steps, execute, ref correlationId);

            if (!execute.Step.Passed)
                return Build(steps, total, runId, correlationId, finalStatus, manifestVersion, approvalRequestId, totalTokens, structuralMode);
        }
        else
        {
            steps.Add(new JourneyStepResult
            {
                Name = "execute",
                Passed = true,
                Detail = "Skipped — run already ReadyForCommit/Committed after create (authority pipeline).",
                ElapsedMilliseconds = 0
            });
        }

        TimedHttpResult poll = await PollUntilReadyAsync(runId, cancellationToken);
        Add(steps, poll, ref correlationId);

        if (!poll.Step.Passed || string.IsNullOrWhiteSpace(poll.RawJson))
            return Build(steps, total, runId, correlationId, finalStatus, manifestVersion, approvalRequestId, totalTokens, structuralMode);

        using (JsonDocument pollDoc = JsonDocument.Parse(poll.RawJson))
        {
            finalStatus = ArchitectureRunStatusReader.ReadStatus(pollDoc.RootElement);
            (structuralMode, bool fellBack, totalTokens) = RealAiExecutionGate.ReadFromRunDetail(pollDoc.RootElement);

            ResponseValidationResult realGate = RealAiExecutionGate.Evaluate(
                structuralMode,
                fellBack,
                totalTokens,
                _options.RequireNonZeroLlmTokens);
            Stopwatch gateWatch = Stopwatch.StartNew();
            gateWatch.Stop();

            steps.Add(new JourneyStepResult
            {
                Name = "verify-real-ai",
                Passed = realGate.Passed,
                Detail = realGate.Passed
                    ? $"structuralExecutionMode={structuralMode}; tokens={totalTokens}."
                    : string.Join(" ", realGate.Errors),
                ElapsedMilliseconds = gateWatch.ElapsedMilliseconds,
                FailureHint = realGate.Passed
                    ? null
                    : "Configure AgentExecution:Mode=Real with Azure OpenAI; do not use Simulator for this harness.",
                ValidationErrors = realGate.Errors
            });

            if (!realGate.Passed)
                return Build(steps, total, runId, correlationId, finalStatus, manifestVersion, approvalRequestId, totalTokens, structuralMode);
        }

        TimedHttpResult findings = await _http.SendJsonAsync(
            "findings-list",
            HttpMethod.Get,
            $"v1/architecture/review/{runId}/findings?take=50",
            content: null,
            schemaName: "RunFindingsListResponse",
            dtoType: typeof(Gen.RunFindingsListResponse),
            extraHeaders: null,
            cancellationToken);
        Add(steps, findings, ref correlationId);

        if (!findings.Step.Passed)
            return Build(steps, total, runId, correlationId, finalStatus, manifestVersion, approvalRequestId, totalTokens, structuralMode);

        TimedHttpResult finalize = await _http.SendJsonAsync(
            "finalize",
            HttpMethod.Post,
            $"v1/architecture/review/{runId}/finalize",
            content: null,
            schemaName: "CommitRunResponse",
            dtoType: typeof(Gen.CommitRunResponse),
            extraHeaders: null,
            cancellationToken);
        Add(steps, finalize, ref correlationId);

        if (!finalize.Step.Passed || string.IsNullOrWhiteSpace(finalize.RawJson))
            return Build(steps, total, runId, correlationId, finalStatus, manifestVersion, approvalRequestId, totalTokens, structuralMode);

        using (JsonDocument finalizeDoc = JsonDocument.Parse(finalize.RawJson))
            manifestVersion = ArchitectureRunStatusReader.ReadManifestVersion(finalizeDoc.RootElement);

        if (string.IsNullOrWhiteSpace(manifestVersion))
        {
            steps.Add(FailInstant("finalize-manifestVersion", "Finalize succeeded but manifest.metadata.manifestVersion was missing."));
            return Build(steps, total, runId, correlationId, finalStatus, manifestVersion, approvalRequestId, totalTokens, structuralMode);
        }

        TimedHttpResult detailAfter = await _http.SendJsonAsync(
            "detail-after-finalize",
            HttpMethod.Get,
            $"v1/architecture/review/{runId}",
            content: null,
            schemaName: "RunDetailDto",
            dtoType: typeof(Gen.RunDetailDto),
            extraHeaders: null,
            cancellationToken);
        Add(steps, detailAfter, ref correlationId);

        if (!detailAfter.Step.Passed)
            return Build(steps, total, runId, correlationId, finalStatus, manifestVersion, approvalRequestId, totalTokens, structuralMode);

        using (JsonDocument afterDoc = JsonDocument.Parse(detailAfter.RawJson!))
            finalStatus = ArchitectureRunStatusReader.ReadStatus(afterDoc.RootElement) ?? finalStatus;

        TimedHttpResult export = await _http.SendBinaryAsync(
            "export-zip",
            HttpMethod.Get,
            $"v1/artifacts/runs/{runId}/export",
            cancellationToken);
        Add(steps, export, ref correlationId);

        if (!export.Step.Passed)
            return Build(steps, total, runId, correlationId, finalStatus, manifestVersion, approvalRequestId, totalTokens, structuralMode);

        JsonObject approvalBody = new()
        {
            ["runId"] = runId,
            ["manifestVersion"] = manifestVersion,
            ["sourceEnvironment"] = "dev",
            ["targetEnvironment"] = "test",
            ["requestComment"] = "ArchLucid.ReviewApiHarness full-operator journey"
        };

        TimedHttpResult submitApproval = await _http.SendJsonAsync(
            "governance-submit",
            HttpMethod.Post,
            "v1/governance/approval-requests",
            JourneyHttpExecutor.JsonContent(approvalBody.ToJsonString()),
            schemaName: "GovernanceApprovalRequest",
            dtoType: typeof(Gen.GovernanceApprovalRequest),
            extraHeaders: HarnessActorHeaders.Create(_options.SubmitterActorName, _options.SubmitterActorId),
            cancellationToken);
        Add(steps, submitApproval, ref correlationId);

        if (!submitApproval.Step.Passed || string.IsNullOrWhiteSpace(submitApproval.RawJson))
            return Build(steps, total, runId, correlationId, finalStatus, manifestVersion, approvalRequestId, totalTokens, structuralMode);

        using (JsonDocument approvalDoc = JsonDocument.Parse(submitApproval.RawJson))
            approvalRequestId = ArchitectureRunStatusReader.ReadApprovalRequestId(approvalDoc.RootElement);

        if (string.IsNullOrWhiteSpace(approvalRequestId))
        {
            steps.Add(FailInstant("governance-submit-id", "Approval submit validated but approvalRequestId was missing."));
            return Build(steps, total, runId, correlationId, finalStatus, manifestVersion, approvalRequestId, totalTokens, structuralMode);
        }

        JsonObject approveBody = new()
        {
            ["reviewedBy"] = _options.ReviewerActorName,
            ["reviewComment"] = "Approved by ReviewApiHarness peer reviewer"
        };

        TimedHttpResult approve = await _http.SendJsonAsync(
            "governance-approve",
            HttpMethod.Post,
            $"v1/governance/approval-requests/{approvalRequestId}/approve",
            JourneyHttpExecutor.JsonContent(approveBody.ToJsonString()),
            schemaName: "GovernanceApprovalRequest",
            dtoType: typeof(Gen.GovernanceApprovalRequest),
            extraHeaders: HarnessActorHeaders.Create(_options.ReviewerActorName, _options.ReviewerActorId),
            cancellationToken);
        Add(steps, approve, ref correlationId);

        if (!approve.Step.Passed)
            return Build(steps, total, runId, correlationId, finalStatus, manifestVersion, approvalRequestId, totalTokens, structuralMode);

        TimedHttpResult audit = await _http.SendJsonAsync(
            "audit-search",
            HttpMethod.Get,
            $"v1/audit/search?runId={Uri.EscapeDataString(runId)}&take=100",
            content: null,
            schemaName: "CursorPagedResponseOfAuditEvent",
            dtoType: typeof(Gen.CursorPagedResponseOfAuditEvent),
            extraHeaders: null,
            cancellationToken);
        Add(steps, audit, ref correlationId);

        if (!audit.Step.Passed)
            return Build(steps, total, runId, correlationId, finalStatus, manifestVersion, approvalRequestId, totalTokens, structuralMode);

        TimedHttpResult list = await _http.SendJsonAsync(
            "runs-list",
            HttpMethod.Get,
            "v1/architecture/runs?take=50",
            content: null,
            schemaName: "CursorPagedResponseOfRunListItemResponse",
            dtoType: typeof(Gen.CursorPagedResponseOfRunListItemResponse),
            extraHeaders: null,
            cancellationToken);
        Add(steps, list, ref correlationId);

        if (list.Step.Passed && !string.IsNullOrWhiteSpace(list.RawJson))
        {
            using JsonDocument listDoc = JsonDocument.Parse(list.RawJson);
            bool found = ListContainsRunId(listDoc.RootElement, runId);
            steps.Add(new JourneyStepResult
            {
                Name = "runs-list-contains-run",
                Passed = found,
                Detail = found
                    ? $"List includes runId={runId}."
                    : $"List did not include runId={runId}.",
                ElapsedMilliseconds = 0,
                FailureHint = found ? null : "Confirm tenant scope headers / auth match the create call."
            });
        }

        return Build(steps, total, runId, correlationId, finalStatus, manifestVersion, approvalRequestId, totalTokens, structuralMode);
    }

    private async Task<TimedHttpResult> PollUntilReadyAsync(string runId, CancellationToken cancellationToken)
    {
        TimeSpan deadline = TimeSpan.FromSeconds(_options.TimeoutSeconds);
        TimeSpan interval = TimeSpan.FromSeconds(_options.PollIntervalSeconds);
        Stopwatch stopwatch = Stopwatch.StartNew();
        string? lastStatus = null;
        string? lastJson = null;
        string? lastCorrelation = null;
        List<string> lastValidationErrors = [];

        while (stopwatch.Elapsed < deadline && !cancellationToken.IsCancellationRequested)
        {
            TimedHttpResult detail = await _http.SendJsonAsync(
                "poll-detail",
                HttpMethod.Get,
                $"v1/architecture/review/{runId}",
                content: null,
                schemaName: "RunDetailDto",
                dtoType: typeof(Gen.RunDetailDto),
                extraHeaders: null,
                cancellationToken);

            lastCorrelation = detail.CorrelationId ?? lastCorrelation;
            lastJson = detail.RawJson ?? lastJson;
            lastValidationErrors = detail.Step.ValidationErrors.ToList();

            if (!detail.Step.Passed)
            {
                // Transient 5xx: keep polling until deadline.
                if (detail.Step.Detail.Contains("HTTP 5", StringComparison.Ordinal))
                {
                    await Task.Delay(interval, cancellationToken);
                    continue;
                }

                return TimedHttpResult.Failed(
                    "poll-until-ready",
                    stopwatch.ElapsedMilliseconds,
                    detail.Step.Detail,
                    lastCorrelation,
                    lastJson,
                    detail.Step.FailureHint,
                    detail.Step.ValidationErrors);
            }

            using JsonDocument doc = JsonDocument.Parse(detail.RawJson!);
            lastStatus = ArchitectureRunStatusReader.ReadStatus(doc.RootElement);

            if (ArchitectureRunStatusReader.IsTerminalFailure(lastStatus))
            {
                return TimedHttpResult.Failed(
                    "poll-until-ready",
                    stopwatch.ElapsedMilliseconds,
                    $"Run reached Failed status ({lastStatus}).",
                    lastCorrelation,
                    lastJson,
                    failureHint: "Inspect agent execution traces and Azure OpenAI configuration.");
            }

            if (ArchitectureRunStatusReader.IsReadyForCommitOrCommitted(lastStatus))
            {
                return TimedHttpResult.Succeeded(
                    "poll-until-ready",
                    stopwatch.ElapsedMilliseconds,
                    $"Run status={lastStatus} after {stopwatch.ElapsedMilliseconds}ms.",
                    lastCorrelation,
                    lastJson,
                    lastValidationErrors);
            }

            await Task.Delay(interval, cancellationToken);
        }

        return TimedHttpResult.Failed(
            "poll-until-ready",
            stopwatch.ElapsedMilliseconds,
            $"Timed out after {_options.TimeoutSeconds}s waiting for ReadyForCommit/Committed (last status={lastStatus ?? "<none>"}).",
            lastCorrelation,
            lastJson,
            failureHint: "Increase --timeout-seconds or check pipeline progress / real AI latency.");
    }

    private static bool ListContainsRunId(JsonElement listPayload, string runId)
    {
        if (!listPayload.TryGetProperty("items", out JsonElement items) ||
            items.ValueKind != JsonValueKind.Array)
        {
            return false;
        }

        foreach (JsonElement item in items.EnumerateArray())
        {
            if (item.TryGetProperty("runId", out JsonElement idEl) &&
                string.Equals(idEl.GetString(), runId, StringComparison.OrdinalIgnoreCase))
            {
                return true;
            }
        }

        return false;
    }

    private static void Add(List<JourneyStepResult> steps, TimedHttpResult result, ref string? correlationId)
    {
        steps.Add(result.Step);
        correlationId ??= result.CorrelationId;
    }

    private static JourneyStepResult FailInstant(string name, string detail)
    {
        return new JourneyStepResult
        {
            Name = name,
            Passed = false,
            Detail = detail,
            ElapsedMilliseconds = 0
        };
    }

    private static JourneyReport Build(
        List<JourneyStepResult> steps,
        Stopwatch total,
        string? runId,
        string? correlationId,
        string? finalStatus,
        string? manifestVersion,
        string? approvalRequestId,
        long totalTokens,
        string? structuralMode)
    {
        total.Stop();

        return new JourneyReport
        {
            Steps = steps,
            AllPassed = steps.Count > 0 && steps.All(static s => s.Passed),
            RunId = runId,
            CorrelationId = correlationId,
            FinalRunStatus = finalStatus,
            ManifestVersion = manifestVersion,
            ApprovalRequestId = approvalRequestId,
            TotalLlmTokens = totalTokens,
            StructuralExecutionMode = structuralMode,
            TotalElapsedMilliseconds = total.ElapsedMilliseconds
        };
    }
}
