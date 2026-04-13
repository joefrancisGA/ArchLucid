using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Persistence.BlobStore;
using ArchLucid.Persistence.Data.Repositories;

using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace ArchLucid.AgentRuntime;

/// <summary>
/// <see cref="IAgentExecutionTraceRecorder"/> that inserts rows via <see cref="IAgentExecutionTraceRepository"/>, truncating large prompt/response fields.
/// </summary>
public sealed class AgentExecutionTraceRecorder(
    IAgentExecutionTraceRepository repository,
    ILlmCostEstimator costEstimator,
    IOptions<LlmCostEstimationOptions> costOptions,
    IOptions<AgentExecutionTraceStorageOptions> traceStorageOptions,
    IArtifactBlobStore blobStore,
    IServiceScopeFactory scopeFactory,
    ILogger<AgentExecutionTraceRecorder> logger)
    : IAgentExecutionTraceRecorder
{
    private const string BlobContainerName = "agent-traces";

    private readonly IAgentExecutionTraceRepository _repository =
        repository ?? throw new ArgumentNullException(nameof(repository));

    private readonly ILlmCostEstimator _costEstimator =
        costEstimator ?? throw new ArgumentNullException(nameof(costEstimator));

    private readonly IOptions<LlmCostEstimationOptions> _costOptions =
        costOptions ?? throw new ArgumentNullException(nameof(costOptions));

    private readonly IOptions<AgentExecutionTraceStorageOptions> _traceStorageOptions =
        traceStorageOptions ?? throw new ArgumentNullException(nameof(traceStorageOptions));

    private readonly IArtifactBlobStore _blobStore =
        blobStore ?? throw new ArgumentNullException(nameof(blobStore));

    private readonly IServiceScopeFactory _scopeFactory =
        scopeFactory ?? throw new ArgumentNullException(nameof(scopeFactory));

    private readonly ILogger<AgentExecutionTraceRecorder> _logger =
        logger ?? throw new ArgumentNullException(nameof(logger));

    /// <summary>Maximum stored length for prompt/response fields to prevent unbounded PII retention.</summary>
    private const int MaxContentLength = 8192;

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
        string? modelDeploymentName = null,
        string? modelVersion = null,
        CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(runId);
        ArgumentException.ThrowIfNullOrWhiteSpace(taskId);

        int inTok = inputTokenCount ?? 0;
        int outTok = outputTokenCount ?? 0;
        decimal? estimated = null;

        if (_costOptions.Value.Enabled && (inTok > 0 || outTok > 0))
        {
            estimated = _costEstimator.EstimateUsd(inTok, outTok);
        }

        AgentExecutionTrace trace = new()
        {
            TraceId = Guid.NewGuid().ToString("N"),
            RunId = runId,
            TaskId = taskId,
            AgentType = agentType,
            SystemPrompt = Truncate(systemPrompt, MaxContentLength),
            UserPrompt = Truncate(userPrompt, MaxContentLength),
            RawResponse = Truncate(rawResponse, MaxContentLength),
            ParsedResultJson = parsedResultJson,
            ParseSucceeded = parseSucceeded,
            ErrorMessage = errorMessage,
            PromptTemplateId = promptRepro?.TemplateId,
            PromptTemplateVersion = promptRepro?.TemplateVersion,
            SystemPromptContentSha256 = promptRepro?.SystemPromptContentSha256Hex,
            PromptReleaseLabel = promptRepro?.ReleaseLabel,
            InputTokenCount = inputTokenCount,
            OutputTokenCount = outputTokenCount,
            EstimatedCostUsd = estimated,
            ModelDeploymentName = modelDeploymentName,
            ModelVersion = modelVersion,
            CreatedUtc = DateTime.UtcNow
        };

        await _repository.CreateAsync(trace, cancellationToken);

        if (_traceStorageOptions.Value.PersistFullPrompts)
        {
            QueuePersistFullPrompts(trace.TraceId, runId, systemPrompt, userPrompt, rawResponse);
        }
    }

    private void QueuePersistFullPrompts(
        string traceId,
        string runId,
        string systemPrompt,
        string userPrompt,
        string rawResponse)
    {
        _ = Task.Run(async () =>
        {
            try
            {
                await using AsyncServiceScope scope = _scopeFactory.CreateAsyncScope();
                IAgentExecutionTraceRepository repo = scope.ServiceProvider.GetRequiredService<IAgentExecutionTraceRepository>();

                string? systemKey = null;
                string? userKey = null;
                string? responseKey = null;

                try
                {
                    systemKey = await _blobStore.WriteAsync(
                        BlobContainerName,
                        $"{runId}/{traceId}/system-prompt.txt",
                        systemPrompt,
                        CancellationToken.None);
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Agent trace system prompt blob write failed for TraceId={TraceId}", traceId);
                }

                try
                {
                    userKey = await _blobStore.WriteAsync(
                        BlobContainerName,
                        $"{runId}/{traceId}/user-prompt.txt",
                        userPrompt,
                        CancellationToken.None);
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Agent trace user prompt blob write failed for TraceId={TraceId}", traceId);
                }

                try
                {
                    responseKey = await _blobStore.WriteAsync(
                        BlobContainerName,
                        $"{runId}/{traceId}/response.txt",
                        rawResponse,
                        CancellationToken.None);
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Agent trace response blob write failed for TraceId={TraceId}", traceId);
                }

                await repo.PatchBlobStorageFieldsAsync(traceId, systemKey, userKey, responseKey, CancellationToken.None);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Agent trace full prompt persistence failed for TraceId={TraceId}", traceId);
            }
        });
    }

    private static string Truncate(string value, int maxLength) =>
        value.Length <= maxLength ? value : string.Concat(value.AsSpan(0, maxLength), "...[truncated]");
}
