using System.Text;
using System.Text.Json;

using ArchLucid.AgentRuntime.Prompts;
using ArchLucid.Contracts.Abstractions.Agents;
using ArchLucid.Contracts.Agents;
using ArchLucid.Core.AgentEvaluation;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Requests;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Retrieval;
using ArchLucid.Core.Scoping;
using ArchLucid.Retrieval.Topology;

using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace ArchLucid.AgentRuntime;

/// <summary>
///     <see cref="Contracts.Common.AgentType.Topology" /> handler: prompts the model for service topology and manifest
///     deltas, validates JSON, records traces.
/// </summary>
public sealed class TopologyAgentHandler(
    IAgentTierCompletionRouter tierCompletionRouter,
    ISchemaRemediationAgentCompletionClient schemaRemediationClient,
    IAgentResultParser resultParser,
    IAgentExecutionTraceRecorder traceRecorder,
    IAgentSystemPromptCatalog systemPromptCatalog,
    IAuditService auditService,
    IScopeContextProvider scopeContextProvider,
    IRetrievalQueryService retrievalQueryService,
    IRetrievalGroundingTraceWriter retrievalGroundingTraceWriter,
    IOptionsMonitor<AgentSchemaRemediationOptions> schemaRemediationOptions,
    ILogger<TopologyAgentHandler> logger)
    : IAgentHandler
{
    private static readonly JsonSerializerOptions TraceJsonOptions = new(JsonSerializerDefaults.Web)
    {
        WriteIndented = true
    };

    private readonly IRetrievalQueryService _retrievalQueryService =
        retrievalQueryService ?? throw new ArgumentNullException(nameof(retrievalQueryService));

    private readonly IRetrievalGroundingTraceWriter _retrievalGroundingTraceWriter =
        retrievalGroundingTraceWriter ?? throw new ArgumentNullException(nameof(retrievalGroundingTraceWriter));

    private readonly ILogger<TopologyAgentHandler> _logger =
        logger ?? throw new ArgumentNullException(nameof(logger));

    public AgentType AgentType => AgentType.Topology;

    /// <inheritdoc />
    public string AgentTypeKey => AgentTypeKeys.Topology;

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
            .ResolveAsync(AgentType.Topology, tenantId, runGuid, cancellationToken);
        string systemPrompt = systemResolved.Text;
        AgentPromptActivityTags.Apply(systemResolved);
        AgentPromptReproMetadata promptRepro = systemResolved.ToReproMetadata();
        string baseUserPrompt = BuildUserPrompt(runId, request, evidence, task);
        baseUserPrompt = await AppendExemplarStylePriorAsync(runId, request, baseUserPrompt, cancellationToken)
            .ConfigureAwait(false);
        string lastCompletionJson = string.Empty;

        try
        {
            (IAgentCompletionClient completionClient, IAgentCompletionClient remediationClient) =
                AgentHandlerLlmResolution.ResolveCompletionClients(
                    tierCompletionRouter,
                    schemaRemediationClient,
                    AgentType.Topology,
                    task);

            (string rawJson, AgentResult parsed) = await LlmAgentSchemaCompletion.CompleteAsync(
                completionClient,
                resultParser,
                schemaRemediationOptions,
                AgentType.Topology,
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
                AgentType.Topology,
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
                AgentType.Topology,
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

        sb.AppendLine("Generate a topology AgentResult.");
        sb.AppendLine();

        AgentUserPromptBuilder.AppendRunHeader(sb, runId, task.TaskId, "Topology");
        AgentUserPromptBuilder.AppendArchitectureRequestAndEvidence(sb, request, evidence);
        AgentUserPromptBuilder.AppendTaskObjectiveToolsAndSources(sb, task);

        sb.AppendLine("Important guidance:");
        sb.AppendLine("- Produce a simple, coherent MVP-quality Azure topology.");
        sb.AppendLine("- Prefer App Service over AKS unless AKS is truly necessary.");
        sb.AppendLine("- If Azure AI Search is required, include it explicitly.");
        sb.AppendLine("- If SQL metadata is implied, include a SQL datastore explicitly.");
        sb.AppendLine("- Use stable IDs such as svc-api, svc-search, ds-metadata where appropriate.");
        sb.AppendLine("- Return JSON only.");

        return sb.ToString();
    }

    private async Task<string> AppendExemplarStylePriorAsync(
        string runId,
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
                QueryText = TopologyExemplarStylePriorFormatter.BuildExemplarQueryText(request),
                TopK = 6,
                IncludePlatformCorpora = true,
            };

            IReadOnlyList<RetrievalHit> hits = await _retrievalQueryService
                .SearchAsync(query, cancellationToken)
                .ConfigureAwait(false);

            await AppendGroundingTraceAsync(scope, runId, query, hits, cancellationToken).ConfigureAwait(false);

            List<RetrievalHit> exemplarHits = hits
                .Where(static hit =>
                    string.Equals(hit.CorpusKind, "ReferenceArchitecture", StringComparison.OrdinalIgnoreCase))
                .Take(3)
                .ToList();

            string block = TopologyExemplarStylePriorFormatter.FormatStylePriorBlock(exemplarHits);

            return baseUserPrompt.TrimEnd() + "\n\n" + block + "\n";
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {

            if (_logger.IsEnabled(LogLevel.Warning))
            {
                _logger.LogWarning(
                    ex,
                    "Topology agent exemplar retrieval failed; continuing fail-open for tenant {TenantId}.",
                    scope.TenantId);
            }

            string block = TopologyExemplarStylePriorFormatter.FormatStylePriorBlock([]);

            return baseUserPrompt.TrimEnd() + "\n\n" + block + "\n";
        }
    }

    private async Task AppendGroundingTraceAsync(
        ScopeContext scope,
        string runId,
        RetrievalQuery query,
        IReadOnlyList<RetrievalHit> hits,
        CancellationToken cancellationToken)
    {
        if (!AgentRunIdParser.TryParse(runId, out Guid runGuid))
            return;

        RetrievalGroundingTraceInsert insert = RetrievalGroundingTraceBuilder.Build(
            scope,
            runGuid,
            AgentType.Topology.ToString(),
            query,
            hits);

        try
        {
            await _retrievalGroundingTraceWriter.AppendAsync(insert, cancellationToken).ConfigureAwait(false);
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {

            if (_logger.IsEnabled(LogLevel.Warning))
            {
                _logger.LogWarning(
                    ex,
                    "Failed to persist retrieval grounding trace for topology agent run {RunId}.",
                    runId);
            }
        }
    }
}
