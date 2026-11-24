using System.Security.Cryptography;
using System.Text;
using System.Text.Json;

using ArchLucid.AgentRuntime.Quality;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Findings;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Scoping;

namespace ArchLucid.AgentRuntime.Evaluation;

public sealed partial class AgentOutputEvaluationRecorder
{
    private async Task RecordProviderQualityAsync(
        string runId,
        AgentExecutionTrace trace,
        AgentResult? matchingResult,
        AgentOutputTraceQualityEvaluator.TraceQualityEvaluationResult evaluated,
        CancellationToken cancellationToken)
    {
        if (_providerQualityMonitor is null)
            return;

        string? providerId = _llmTelemetryLabels?.CurrentValue.ProviderId;
        string modelId = NormalizeDeployment(trace.ModelDeploymentName);
        string modelVersion = string.IsNullOrWhiteSpace(trace.ModelVersion)
            ? "unknown"
            : trace.ModelVersion.Trim();

        bool cacheServed = matchingResult?.CacheServed == true;
        bool independentlyChecked = !cacheServed
            && evaluated.Semantic.AgentResultFaithfulnessSupportRatio.HasValue
            && !string.Equals(modelId, AgentExecutionTraceModelMetadata.UnspecifiedDeploymentName, StringComparison.OrdinalIgnoreCase);

        ProviderQualityLabel label = independentlyChecked
            ? evaluated.Semantic.AgentResultFaithfulnessSupportRatio >= 1.0 - 1e-9
                ? ProviderQualityLabel.Supported
                : ProviderQualityLabel.Unsupported
            : ProviderQualityLabel.Unknown;

        int severityWeight = ResolveSeverityWeight(matchingResult);
        string method = cacheServed
            ? "cache_served_not_new_provider_sample"
            : independentlyChecked
                ? "deterministic_evidence_overlap_v1"
                : "independent_adjudication_unavailable";

        ProviderQualityKey key = ProviderQualityKey.Create(providerId, modelId, modelVersion);
        ProviderQualityRecordResult recorded = _providerQualityMonitor.Record(
            new ProviderQualityAdjudication(
                BuildSampleId(key, trace),
                key,
                label,
                severityWeight,
                independentlyChecked,
                method,
                new DateTimeOffset(DateTime.SpecifyKind(trace.CreatedUtc, DateTimeKind.Utc))));

        if (!recorded.StateChanged)
            return;

        ScopeContext scope = _scopeContextProvider.GetCurrentScope();
        Guid? auditRunId = Guid.TryParse(runId, out Guid parsedRunId) ? parsedRunId : null;
        await _auditService.LogAsync(
            new AuditEvent
            {
                EventType = recorded.Transition == "recovered"
                    ? "AiProviderQualityRecovered"
                    : "AiProviderQualityQuarantined",
                TenantId = scope.TenantId,
                WorkspaceId = scope.WorkspaceId,
                ProjectId = scope.ProjectId,
                RunId = auditRunId,
                DataJson = JsonSerializer.Serialize(new
                {
                    providerId = recorded.Snapshot.Key.ProviderId,
                    modelId = recorded.Snapshot.Key.ModelId,
                    modelVersion = recorded.Snapshot.Key.ModelVersion,
                    recorded.Transition,
                    recorded.Snapshot.KnownSampleCount,
                    recorded.Snapshot.UnknownSampleCount,
                    recorded.Snapshot.BadSampleCount,
                    recorded.Snapshot.WeightedBadRate,
                    recorded.Snapshot.WilsonBadRateLowerBound,
                    recorded.Snapshot.QuarantinedUntilUtc,
                    adjudicatorKind = method,
                }),
            },
            cancellationToken).ConfigureAwait(false);
    }

    private static int ResolveSeverityWeight(AgentResult? result)
    {
        if (result is null || result.Findings.Count == 0)
            return 1;

        FindingSeverity highest = result.Findings
            .Where(static finding => finding is not null && finding.SeverityStored)
            .Select(static finding => finding!.Severity)
            .DefaultIfEmpty(FindingSeverity.Info)
            .Max();

        return Math.Clamp((int)highest + 1, 1, 4);
    }

    private static string NormalizeDeployment(string? deployment)
    {
        string value = string.IsNullOrWhiteSpace(deployment) ? "unknown" : deployment.Trim();
        string prefix = AgentExecutionTraceModelMetadata.LlmCompletionFallbackDeploymentPrefix;
        return value.StartsWith(prefix, StringComparison.OrdinalIgnoreCase)
            ? value[prefix.Length..]
            : value;
    }

    private static string BuildSampleId(ProviderQualityKey key, AgentExecutionTrace trace)
    {
        string material = string.Join(
            "\n",
            key.ProviderId,
            key.ModelId,
            key.ModelVersion,
            trace.SystemPromptContentSha256 ?? string.Empty,
            trace.RawResponse);
        return Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(material))).ToLowerInvariant();
    }
}
