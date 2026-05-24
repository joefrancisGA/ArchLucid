using System.Text;
using System.Text.Json;

using ArchLucid.AgentRuntime.Prompts;
using ArchLucid.Contracts.Abstractions.Agents;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Requests;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Diagnostics;
using ArchLucid.Core.Retrieval;
using ArchLucid.Core.Scoping;
using ArchLucid.Retrieval.Compliance;
using ArchLucid.Retrieval.Evaluation;

using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace ArchLucid.AgentRuntime;

/// <summary>
///     <see cref="Contracts.Common.AgentType.Compliance" /> handler: evaluates policies and controls from the evidence
///     package via the completion client.
/// </summary>
public sealed class ComplianceAgentHandler(
    IAgentTierCompletionRouter tierCompletionRouter,
    IAgentResultParser resultParser,
    IAgentExecutionTraceRecorder traceRecorder,
    IAgentSystemPromptCatalog systemPromptCatalog,
    IAuditService auditService,
    IScopeContextProvider scopeContextProvider,
    IRetrievalQueryService retrievalQueryService,
    IOptionsMonitor<AgentSchemaRemediationOptions> schemaRemediationOptions,
    ILogger<ComplianceAgentHandler> logger)
    : IAgentHandler
{
    private static readonly JsonSerializerOptions TraceJsonOptions = new(JsonSerializerDefaults.Web)
    {
        WriteIndented = true
    };

    private readonly IRetrievalQueryService _retrievalQueryService =
        retrievalQueryService ?? throw new ArgumentNullException(nameof(retrievalQueryService));

    private readonly ILogger<ComplianceAgentHandler> _logger =
        logger ?? throw new ArgumentNullException(nameof(logger));

    public AgentType AgentType => AgentType.Compliance;

    /// <inheritdoc />
    public string AgentTypeKey => AgentTypeKeys.Compliance;

    public async Task<AgentResult> ExecuteAsync(
        string runId,
        ArchitectureRequest request,
        AgentEvidencePackage evidence,
        AgentTask task,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(request);
        ArgumentNullException.ThrowIfNull(evidence);
        ArgumentNullException.ThrowIfNull(task);

        Guid tenantId = scopeContextProvider.GetCurrentScope().TenantId;

        if (!AgentRunIdParser.TryParse(runId, out Guid runGuid))
            throw new InvalidOperationException($"Run id '{runId}' is not a valid GUID for prompt variant resolution.");

        ResolvedSystemPrompt systemResolved = await systemPromptCatalog
            .ResolveAsync(AgentType.Compliance, tenantId, runGuid, cancellationToken);
        string systemPrompt = systemResolved.Text;
        AgentPromptActivityTags.Apply(systemResolved);
        AgentPromptReproMetadata promptRepro = systemResolved.ToReproMetadata();

        string baseUserPrompt = BuildUserPrompt(runId, request, evidence, task);
        IReadOnlyList<RetrievalHit> policyPackHits = [];
        (baseUserPrompt, policyPackHits) = await AppendPolicyPackRetrievalAsync(request, baseUserPrompt, cancellationToken).ConfigureAwait(false);

        string lastCompletionJson = string.Empty;

        try
        {
            (IAgentCompletionClient completionClient, IAgentCompletionClient remediationClient) =
                AgentHandlerLlmResolution.ResolveCompletionClients(tierCompletionRouter, AgentType.Compliance, task);

            (string rawJson, AgentResult parsed) = await LlmAgentSchemaCompletion.CompleteAsync(
                completionClient,
                resultParser,
                schemaRemediationOptions,
                AgentType.Compliance,
                runId,
                task.TaskId,
                systemPrompt,
                baseUserPrompt,
                request.MaxTokensOverride,
                remediationClient,
                cancellationToken);

            lastCompletionJson = rawJson;

            string parsedJson = JsonSerializer.Serialize(parsed, TraceJsonOptions);
            RecordRetrievalFaithfulness(policyPackHits, parsedJson);

            AgentCompletionTokenUsage.TryConsume(out int? inTok, out int? outTok, out int? reasoningTok);
            AgentCompletionModelMetadata.TryConsume(out string? modelDeploy, out string? modelVer);

            await traceRecorder.RecordAsync(
                runId,
                task.TaskId,
                AgentType.Compliance,
                systemPrompt,
                baseUserPrompt,
                rawJson,
                parsedJson,
                true,
                null,
                promptRepro,
                inTok,
                outTok,
                reasoningTok,
                modelDeploy,
                modelVer,
                cancellationToken: cancellationToken);

            parsed.PromptVariantKey = systemResolved.PromptVariantKey;

            return parsed;
        }
        catch (Exception ex)
        {
            AgentCompletionTokenUsage.TryConsume(out int? inTok, out int? outTok, out int? reasoningTok);
            AgentCompletionModelMetadata.TryConsume(out string? modelDeploy, out string? modelVer);

            if (ex is AgentResultSchemaViolationException sv)

                AgentResultSchemaViolationAudit.ScheduleLog(
                    auditService,
                    scopeContextProvider,
                    sv,
                    runId,
                    task.TaskId,
                    modelDeploy,
                    modelVer);

            await traceRecorder.RecordAsync(
                runId,
                task.TaskId,
                AgentType.Compliance,
                systemPrompt,
                baseUserPrompt,
                lastCompletionJson,
                null,
                false,
                ex.Message,
                promptRepro,
                inTok,
                outTok,
                reasoningTok,
                modelDeploy,
                modelVer,
                failureReasonCode: AgentHandlerExecutionFailureReason.ResolveFailureReasonCode(ex),
                cancellationToken: cancellationToken);

            throw;
        }
    }

    private static string BuildUserPrompt(
        string runId,
        ArchitectureRequest request,
        AgentEvidencePackage evidence,
        AgentTask task)
    {
        StringBuilder sb = new();

        sb.AppendLine("Generate a compliance AgentResult.");
        sb.AppendLine();

        AgentUserPromptBuilder.AppendRunHeader(sb, runId, task.TaskId, "Compliance");
        AgentUserPromptBuilder.AppendArchitectureRequestAndEvidence(sb, request, evidence);
        AgentUserPromptBuilder.AppendTaskObjectiveToolsAndSources(sb, task);

        sb.AppendLine("Important guidance:");
        sb.AppendLine("- Infer mandatory controls conservatively from constraints and required capabilities.");
        sb.AppendLine("- If managed identity is explicitly required, include Managed Identity.");
        sb.AppendLine(
            "- If private endpoints or private networking are required, include Private Endpoints and/or Private Networking.");
        sb.AppendLine("- If encryption is required, include Encryption At Rest.");
        sb.AppendLine("- If secrets are likely present, include Key Vault.");
        sb.AppendLine(
            "- Prefer reusable machine-friendly findings such as ManagedIdentityRequired or PrivateNetworkingRequired.");
        sb.AppendLine("- Return JSON only.");

        return sb.ToString();
    }

    private async Task<(string Prompt, IReadOnlyList<RetrievalHit> Hits)> AppendPolicyPackRetrievalAsync(
        ArchitectureRequest request,
        string baseUserPrompt,
        CancellationToken cancellationToken)
    {
        ScopeContext scope = scopeContextProvider.GetCurrentScope();

        try
        {
            RetrievalQuery query = new()
            {
                TenantId = scope.TenantId,
                WorkspaceId = scope.WorkspaceId,
                ProjectId = scope.ProjectId,
                QueryText = CompliancePolicyPackRetrievalPromptFormatter.BuildPolicyQueryText(request),
                TopK = 6,
                IncludePlatformCorpora = true,
            };

            IReadOnlyList<RetrievalHit> hits =
                await _retrievalQueryService.SearchAsync(query, cancellationToken).ConfigureAwait(false);

            if (hits.Count == 0 && _logger.IsEnabled(LogLevel.Warning))
            {
                _logger.LogWarning(
                    "Compliance agent policy-pack retrieval returned zero hits for tenant {TenantId}.",
                    scope.TenantId);
            }

            string block = CompliancePolicyPackRetrievalPromptFormatter.FormatPolicyPackBlock(hits);
            string prompt = baseUserPrompt.TrimEnd() + "\n\n" + block + "\n";

            return (prompt, hits);
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            if (_logger.IsEnabled(LogLevel.Warning))
            {
                _logger.LogWarning(
                    ex,
                    "Compliance agent policy-pack retrieval failed; continuing fail-open for tenant {TenantId}.",
                    scope.TenantId);
            }

            string prompt = baseUserPrompt.TrimEnd()
                + "\n\nPolicy Pack Controls (retrieved — cite ruleId when referencing):\n(none retrieved — grounding unavailable)\n";

            return (prompt, []);
        }
    }

    private static void RecordRetrievalFaithfulness(IReadOnlyList<RetrievalHit> hits, string agentOutputText)
    {
        if (hits.Count == 0)
            return;

        RetrievalFaithfulnessReport report =
            RetrievalFaithfulnessEvaluator.Evaluate(hits, agentOutputText);

        ArchLucidInstrumentation.RecordRetrievalFaithfulnessRatio(report.SupportRatio);
    }
}
