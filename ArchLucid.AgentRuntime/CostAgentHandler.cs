using System.Text;
using System.Text.Json;

using ArchLucid.AgentRuntime.Prompts;
using ArchLucid.Contracts.Abstractions.Agents;
using ArchLucid.Contracts.Agents;
using ArchLucid.Core.AgentEvaluation;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Requests;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Scoping;
using ArchLucid.Retrieval.Pricing;

using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace ArchLucid.AgentRuntime;

/// <summary>
///     <see cref="AgentType.Cost" /> handler with Azure Retail structured grounding (RAG-V1-003).
/// </summary>
public sealed class CostAgentHandler(
    IAgentTierCompletionRouter tierCompletionRouter,
    IAgentResultParser resultParser,
    IAgentExecutionTraceRecorder traceRecorder,
    IAgentSystemPromptCatalog systemPromptCatalog,
    IAuditService auditService,
    IScopeContextProvider scopeContextProvider,
    IAzureRetailPriceStructuredLookup retailPriceLookup,
    IOptionsMonitor<AgentSchemaRemediationOptions> schemaRemediationOptions,
    ILogger<CostAgentHandler> logger)
    : IAgentHandler
{
    private static readonly JsonSerializerOptions TraceJsonOptions = new(JsonSerializerDefaults.Web)
    {
        WriteIndented = true
    };

    private readonly IAzureRetailPriceStructuredLookup _retailPriceLookup =
        retailPriceLookup ?? throw new ArgumentNullException(nameof(retailPriceLookup));

    private readonly ILogger<CostAgentHandler> _logger =
        logger ?? throw new ArgumentNullException(nameof(logger));

    public AgentType AgentType => AgentType.Cost;

    /// <inheritdoc />
    public string AgentTypeKey => AgentTypeKeys.Cost;

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
            .ResolveAsync(AgentType.Cost, tenantId, runGuid, cancellationToken);
        string systemPrompt = systemResolved.Text;
        AgentPromptActivityTags.Apply(systemResolved);
        AgentPromptReproMetadata promptRepro = systemResolved.ToReproMetadata();
        string baseUserPrompt = BuildUserPrompt(runId, request, evidence, task, _retailPriceLookup);
        string lastCompletionJson = string.Empty;

        try
        {
            (IAgentCompletionClient completionClient, IAgentCompletionClient remediationClient) =
                AgentHandlerLlmResolution.ResolveCompletionClients(tierCompletionRouter, AgentType.Cost, task);

            (string rawJson, AgentResult parsed) = await LlmAgentSchemaCompletion.CompleteAsync(
                completionClient,
                resultParser,
                schemaRemediationOptions,
                AgentType.Cost,
                runId,
                task.TaskId,
                systemPrompt,
                baseUserPrompt,
                request.MaxTokensOverride,
                remediationClient,
                cancellationToken);

            lastCompletionJson = rawJson;

            string parsedJson = JsonSerializer.Serialize(parsed, TraceJsonOptions);

            AgentCompletionTokenUsage.TryConsume(out int? inTok, out int? outTok, out int? reasoningTok);
            AgentCompletionModelMetadata.TryConsume(out string? modelDeploy, out string? modelVer);

            await traceRecorder.RecordAsync(
                runId,
                task.TaskId,
                AgentType.Cost,
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

            if (ex is AgentResultSchemaViolationException schemaViolation)

                AgentResultSchemaViolationAudit.ScheduleLog(
                    auditService,
                    scopeContextProvider,
                    schemaViolation,
                    runId,
                    task.TaskId,
                    modelDeploy,
                    modelVer);

            await traceRecorder.RecordAsync(
                runId,
                task.TaskId,
                AgentType.Cost,
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

    internal static string BuildUserPrompt(
        string runId,
        ArchitectureRequest request,
        AgentEvidencePackage evidence,
        AgentTask task,
        IAzureRetailPriceStructuredLookup retailPriceLookup)
    {
        StringBuilder sb = new();

        sb.AppendLine("Generate a cost AgentResult.");
        sb.AppendLine();

        AgentUserPromptBuilder.AppendRunHeader(sb, runId, task.TaskId, "Cost");
        AgentUserPromptBuilder.AppendArchitectureRequestAndEvidence(sb, request, evidence);
        AgentUserPromptBuilder.AppendTaskObjectiveToolsAndSources(sb, task);

        CostRetailGroundingResult grounding = CostRetailGroundingBuilder.Build(request, evidence, retailPriceLookup);

        if (!grounding.SkippedNonAzure)
        {
            sb.AppendLine();
            sb.AppendLine(grounding.PromptBlock);
        }

        sb.AppendLine();
        sb.AppendLine("Important guidance:");
        sb.AppendLine("- Prefer managed services with predictable operational cost for MVP workloads.");
        sb.AppendLine("- Highlight token/search spend monitoring when AI services are in scope.");
        sb.AppendLine("- Return JSON only.");

        return sb.ToString();
    }
}
