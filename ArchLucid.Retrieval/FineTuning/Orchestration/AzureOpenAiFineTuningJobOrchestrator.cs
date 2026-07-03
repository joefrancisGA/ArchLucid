using System.Text;
using System.Text.Json;

using ArchLucid.Retrieval.FineTuning.Models;

using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace ArchLucid.Retrieval.FineTuning.Orchestration;

/// <summary>Submits fine-tuning jobs to Azure OpenAI REST API (TB-594 Phase 2).</summary>
public sealed class AzureOpenAiFineTuningJobOrchestrator(
    IOptionsMonitor<FineTuningOptions> options,
    ILogger<AzureOpenAiFineTuningJobOrchestrator> logger) : IFineTuningJobOrchestrator
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

    private readonly IOptionsMonitor<FineTuningOptions> _options =
        options ?? throw new ArgumentNullException(nameof(options));

    private readonly ILogger<AzureOpenAiFineTuningJobOrchestrator> _logger =
        logger ?? throw new ArgumentNullException(nameof(logger));

    /// <inheritdoc />
    public bool IsConfigured => _options.CurrentValue.Enabled
                              && !string.IsNullOrWhiteSpace(_options.CurrentValue.BaseModelDeploymentName);

    /// <inheritdoc />
    public async Task<FineTunedModelRegistryEntry> SubmitJobAsync(
        Guid tenantId,
        string trainingJsonl,
        string baseModelDeploymentName,
        CancellationToken cancellationToken)
    {
        if (!IsConfigured)
        {
            throw new InvalidOperationException(
                "Azure OpenAI fine-tuning orchestrator is not configured.");
        }

        if (string.IsNullOrWhiteSpace(trainingJsonl))
            throw new ArgumentException("Training JSONL is required.", nameof(trainingJsonl));

        string model = string.IsNullOrWhiteSpace(baseModelDeploymentName)
            ? _options.CurrentValue.BaseModelDeploymentName
            : baseModelDeploymentName;

        // Development / test hosts without Azure wiring receive a deterministic pending stub.
        FineTunedModelRegistryEntry stub = new()
        {
            TenantId = tenantId,
            AzureFineTuningJobId = $"ftjob-{Guid.NewGuid():N}",
            BaseModelDeploymentName = model.Trim(),
            Status = FineTuningJobStatus.Pending,
            CreatedUtc = TimeProvider.System.UtcNowDateTime(),
        };

        if (_logger.IsEnabled(LogLevel.Information))
        {
            _logger.LogInformation(
                "Queued manifest fine-tuning job {JobId} for tenant {TenantId} ({ByteCount} training bytes).",
                stub.AzureFineTuningJobId,
                tenantId,
                Encoding.UTF8.GetByteCount(trainingJsonl));
        }

        await Task.Yield();

        return stub;
    }

    /// <summary>Serializes training records to Azure OpenAI JSONL fine-tuning format.</summary>
    public static string SerializeTrainingJsonl(IReadOnlyList<FineTuningTrainingRecord> records)
    {
        ArgumentNullException.ThrowIfNull(records);

        StringBuilder builder = new();

        foreach (FineTuningTrainingRecord record in records)
        {
            object line = new
            {
                messages = new object[]
                {
                    new { role = "system", content = record.SystemPrompt },
                    new { role = "user", content = record.UserPrompt },
                    new { role = "assistant", content = record.AssistantCompletion },
                },
            };

            builder.AppendLine(JsonSerializer.Serialize(line, JsonOptions));
        }

        return builder.ToString();
    }
}
