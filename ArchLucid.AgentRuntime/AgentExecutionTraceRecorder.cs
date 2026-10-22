using System.Text.Json;

using ArchLucid.AgentRuntime.AgentModelAliases;
using ArchLucid.AgentRuntime.Prompts;
using ArchLucid.Contracts.Agents;
using ArchLucid.Core.AgentEvaluation;
using ArchLucid.Contracts.Common;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Diagnostics;
using ArchLucid.Core.Llm.Redaction;
using ArchLucid.Core.Persistence.ApplicationPorts.Agents;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Data.Repositories;

using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace ArchLucid.AgentRuntime;

/// <summary>
///     <see cref="IAgentExecutionTraceRecorder" /> that inserts rows via <see cref="IAgentExecutionTraceRepository" />,
///     truncating large prompt/response fields.
/// </summary>
public sealed class AgentExecutionTraceRecorder(
    IAgentExecutionTraceRepository repository,
    ILlmCostEstimator costEstimator,
    IOptions<LlmCostEstimationOptions> costOptions,
    IScopeContextProvider scopeContextProvider,
    IOptionsMonitor<LlmPromptRedactionOptions> redactionOptions,
    IPromptRedactor promptRedactor,
    IAgentToolInvocationRecordWriter toolInvocationRecordWriter,
    IAgentExecutionTraceForensicPersistence forensicPersistence,
    ILogger<AgentExecutionTraceRecorder> logger)
    : IAgentExecutionTraceRecorder
{
    private string? _invocationLedgerRunKey;

    private DateTime? _invocationLedgerPriorUtc;

    /// <summary>Maximum stored length for prompt/response fields to prevent unbounded PII retention.</summary>
    private const int MaxContentLength = 8192;

    private readonly ILlmCostEstimator _costEstimator =
        costEstimator ?? throw new ArgumentNullException(nameof(costEstimator));

    private readonly IOptions<LlmCostEstimationOptions> _costOptions =
        costOptions ?? throw new ArgumentNullException(nameof(costOptions));

    private readonly IAgentExecutionTraceForensicPersistence _forensicPersistence =
        forensicPersistence ?? throw new ArgumentNullException(nameof(forensicPersistence));

    private readonly ILogger<AgentExecutionTraceRecorder> _logger =
        logger ?? throw new ArgumentNullException(nameof(logger));

    private readonly IPromptRedactor _promptRedactor =
        promptRedactor ?? throw new ArgumentNullException(nameof(promptRedactor));

    private readonly IOptionsMonitor<LlmPromptRedactionOptions> _redactionOptions =
        redactionOptions ?? throw new ArgumentNullException(nameof(redactionOptions));

    private readonly IAgentExecutionTraceRepository _repository =
        repository ?? throw new ArgumentNullException(nameof(repository));

    private readonly IAgentToolInvocationRecordWriter _toolInvocationRecordWriter =
        toolInvocationRecordWriter ?? throw new ArgumentNullException(nameof(toolInvocationRecordWriter));

    private readonly IScopeContextProvider _scopeContextProvider =
        scopeContextProvider ?? throw new ArgumentNullException(nameof(scopeContextProvider));

    /// <inheritdoc />
    public async Task RecordAsync(
        string runId,
        string taskId,
        AgentType agentType,
        string systemPrompt,
        string userPrompt,
        string rawResponse,
        string? parsedResultJson,
        bool parseSucceeded,
        string? errorMessage,
        AgentPromptReproMetadata? promptRepro = null,
        int? inputTokenCount = null,
        int? outputTokenCount = null,
        int? reasoningTokenCount = null,
        string? modelDeploymentName = null,
        string? modelVersion = null,
        bool isSimulatorExecution = false,
        string? failureReasonCode = null,
        float? completionTemperature = null,
        int? maxCompletionTokens = null,
        float? completionTopP = null,
        int attemptIndex = 0,
        CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(runId);
        ArgumentException.ThrowIfNullOrWhiteSpace(taskId);

        AgentCompletionRequestParams.TryConsume(
            out float? ambientTemperature,
            out int? ambientMaxCompletionTokens,
            out float? ambientTopP);

        int inTok = inputTokenCount ?? 0;
        int outTok = outputTokenCount ?? 0;
        string resolvedDeployment = string.IsNullOrWhiteSpace(modelDeploymentName)
            ? AgentExecutionTraceModelMetadata.UnspecifiedDeploymentName
            : modelDeploymentName.Trim();

        int reasoningTok = reasoningTokenCount ?? 0;
        string? deploymentForCost =
            resolvedDeployment == AgentExecutionTraceModelMetadata.UnspecifiedDeploymentName ? null : resolvedDeployment;

        decimal? estimated = null;

        if (_costOptions.Value.Enabled && (inTok > 0 || outTok > 0 || reasoningTok > 0))

            estimated = _costEstimator.EstimateUsd(inTok, outTok, reasoningTok, deploymentForCost);

        if (estimated is { } estUsd and > 0m)
        {
            ScopeContext costScope = _scopeContextProvider.GetCurrentScope();

            string tenantLabel = costScope.TenantId == Guid.Empty
                ? "unknown"
                : costScope.TenantId.ToString("N");

            ArchLucidInstrumentation.RecordLlmCostUsd(estUsd, tenantLabel);
        }

        string resolvedVersion = string.IsNullOrWhiteSpace(modelVersion)
            ? AgentExecutionTraceModelMetadata.UnspecifiedModelVersion
            : modelVersion.Trim();

        string? resolvedModelAlias = AgentModelAliasInvocationAmbient.TryPeek();

        string systemPromptContentSha256 = string.IsNullOrWhiteSpace(promptRepro?.SystemPromptContentSha256Hex)
            ? AgentPromptCanonicalHasher.Sha256HexUtf8Normalized(systemPrompt)
            : promptRepro.SystemPromptContentSha256Hex;

        string systemPromptContentHash =
            AgentPromptCanonicalHasher.ContentHashPrefix16FromSha256Hex(systemPromptContentSha256);

        string storeSystem = systemPrompt;
        string storeUser = userPrompt;
        string storeRaw = rawResponse;

        if (_redactionOptions.CurrentValue.Enabled)
        {
            PromptRedactionOutcome systemOutcome = _promptRedactor.Redact(systemPrompt);
            PromptRedactionOutcome userOutcome = _promptRedactor.Redact(userPrompt);
            PromptRedactionOutcome rawOutcome = _promptRedactor.Redact(rawResponse);
            storeSystem = systemOutcome.Text;
            storeUser = userOutcome.Text;
            storeRaw = rawOutcome.Text;
        }

        AgentExecutionTrace trace = new()
        {
            TraceId = Guid.NewGuid().ToString("N"),
            RunId = runId,
            TaskId = taskId,
            AgentType = agentType,
            ProvenanceCorrelationId = AgentProvenanceCorrelationId.Format(runId, taskId, agentType),
            AttemptIndex = attemptIndex,
            SystemPrompt = Truncate(storeSystem, MaxContentLength),
            UserPrompt = Truncate(storeUser, MaxContentLength),
            RawResponse = Truncate(storeRaw, MaxContentLength),
            ParsedResultJson = parsedResultJson,
            ParseSucceeded = parseSucceeded,
            ErrorMessage = errorMessage,
            FailureReasonCode = failureReasonCode,
            PromptTemplateId = promptRepro?.TemplateId,
            PromptTemplateVersion = promptRepro?.TemplateVersion,
            SystemPromptContentSha256 = systemPromptContentSha256,
            SystemPromptContentHash = systemPromptContentHash,
            PromptReleaseLabel = promptRepro?.ReleaseLabel,
            InputTokenCount = inputTokenCount,
            OutputTokenCount = outputTokenCount,
            ReasoningTokenCount = reasoningTokenCount is > 0 ? reasoningTokenCount : null,
            CompletionTemperature = completionTemperature ?? ambientTemperature,
            MaxCompletionTokens = maxCompletionTokens ?? ambientMaxCompletionTokens,
            CompletionTopP = completionTopP ?? ambientTopP,
            EstimatedCostUsd = estimated,
            ModelAlias = resolvedModelAlias,
            ModelDeploymentName = resolvedDeployment,
            ModelVersion = resolvedVersion,
            ProviderConnectionId = TenantAzureOpenAiProviderConnectionAmbient.TryConsume(),
            CreatedUtc = TimeProvider.System.UtcNowDateTime()
        };

        if (parseSucceeded && !string.IsNullOrWhiteSpace(parsedResultJson) && !isSimulatorExecution)
        {
            try
            {
                using JsonDocument doc = JsonDocument.Parse(parsedResultJson);
                if (!doc.RootElement.TryGetProperty("citations", out JsonElement citationsElement) ||
                    citationsElement.ValueKind != JsonValueKind.Array ||
                    citationsElement.GetArrayLength() == 0)
                {
                    trace.ParseSucceeded = false;
                    trace.ErrorMessage = "AI-generated findings must include a SourceCitation array.";
                    trace.FailureReasonCode = "MissingCitations";
                }
            }
            catch
            {
                // Ignore parse errors here
            }
        }

        await _repository.CreateAsync(trace, cancellationToken);

        int? durationMs = null;

        if (_invocationLedgerRunKey == runId && _invocationLedgerPriorUtc.HasValue)
        {
            double deltaMs = (trace.CreatedUtc - _invocationLedgerPriorUtc.Value).TotalMilliseconds;

            if (deltaMs >= 0 && deltaMs <= int.MaxValue)
                durationMs = (int)Math.Round(deltaMs);
        }

        await _toolInvocationRecordWriter.SaveFromTraceAsync(trace, sortOrder: 0, durationMs, cancellationToken);

        _invocationLedgerRunKey = runId;
        _invocationLedgerPriorUtc = trace.CreatedUtc;

        if (isSimulatorExecution)
            return;

        await _forensicPersistence.PersistFullPromptsAsync(
            trace.TraceId,
            runId,
            agentType,
            storeSystem,
            storeUser,
            storeRaw,
            cancellationToken);
    }

    private static string Truncate(string value, int maxLength)
    {
        return value.Length <= maxLength ? value : string.Concat(value.AsSpan(0, maxLength), "...[truncated]");
    }
}
