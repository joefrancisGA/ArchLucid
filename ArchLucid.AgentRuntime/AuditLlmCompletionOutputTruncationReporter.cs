using System.Text.Json;

using ArchLucid.Core.Audit;
using ArchLucid.Core.Diagnostics;
using ArchLucid.Core.Scoping;

using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace ArchLucid.AgentRuntime;

/// <summary>Emits audit, log, and metric signals when Azure OpenAI stops due to <c>finish_reason=length</c>.</summary>
public sealed class AuditLlmCompletionOutputTruncationReporter(
    IServiceScopeFactory scopeFactory,
    IScopeContextProvider scopeContextProvider,
    ILogger<AuditLlmCompletionOutputTruncationReporter> logger) : ILlmCompletionOutputTruncationReporter
{
    private readonly IServiceScopeFactory _scopeFactory =
        scopeFactory ?? throw new ArgumentNullException(nameof(scopeFactory));

    private readonly IScopeContextProvider _scopeContextProvider =
        scopeContextProvider ?? throw new ArgumentNullException(nameof(scopeContextProvider));

    private readonly ILogger<AuditLlmCompletionOutputTruncationReporter> _logger =
        logger ?? throw new ArgumentNullException(nameof(logger));

    /// <inheritdoc />
    public void Report(LlmCompletionOutputTruncationEvent detail)
    {
        ArgumentNullException.ThrowIfNull(detail);

        if (_logger.IsEnabled(LogLevel.Warning))
        {
            _logger.LogWarning(
                "Azure OpenAI completion output was truncated (finish_reason=length). Deployment={DeploymentName}, "
                + "MaxOutputTokens={MaxOutputTokens}, OutputTokenCount={OutputTokenCount}, ReasoningTokenCount={ReasoningTokenCount}. "
                + "Structured JSON may be incomplete; consider raising AzureOpenAI:MaxCompletionTokens.",
                detail.DeploymentName,
                detail.MaxOutputTokens,
                detail.OutputTokenCount,
                detail.ReasoningTokenCount);
        }

        ArchLucidInstrumentation.RecordLlmCompletionOutputTruncated(detail.DeploymentName);

        ScopeContext scope = _scopeContextProvider.GetCurrentScope();

        string dataJson = JsonSerializer.Serialize(
            new
            {
                deploymentName = detail.DeploymentName,
                maxOutputTokens = detail.MaxOutputTokens,
                outputTokenCount = detail.OutputTokenCount,
                reasoningTokenCount = detail.ReasoningTokenCount,
            });

        AuditEvent auditEvent = new()
        {
            EventType = AuditEventTypes.LlmCompletionOutputTruncated,
            TenantId = scope.TenantId,
            WorkspaceId = scope.WorkspaceId,
            ProjectId = scope.ProjectId,
            DataJson = dataJson,
        };

        _ = Task.Run(async () =>
        {
            try
            {
                using IServiceScope serviceScope = _scopeFactory.CreateScope();
                IAuditService auditService = serviceScope.ServiceProvider.GetRequiredService<IAuditService>();

                await auditService.LogAsync(auditEvent, CancellationToken.None).ConfigureAwait(false);
            }
            catch (Exception ex) when (ex is not OutOfMemoryException and not StackOverflowException)
            {
                if (_logger.IsEnabled(LogLevel.Warning))
                {
                    _logger.LogWarning(
                        ex,
                        "LLM completion output truncation audit append failed for deployment {DeploymentName}",
                        detail.DeploymentName);
                }
            }
        });
    }
}
