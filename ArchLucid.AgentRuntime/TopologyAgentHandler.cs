using System.Text;
using System.Text.Json;

using ArchLucid.AgentRuntime.Prompts;
using ArchLucid.Core.TechnologyLedger;
using ArchLucid.Contracts.Abstractions.Agents;
using ArchLucid.Contracts.Agents;
using ArchLucid.Core.AgentEvaluation;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Persistence.TechnologyLedger;
using ArchLucid.Contracts.Requests;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Diagnostics;
using ArchLucid.Core.Retrieval;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Data.Repositories;
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
    ITechnologyLedgerRepository technologyLedgerRepository,
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

    private readonly IScopeContextProvider _scopeContextProvider =
        scopeContextProvider ?? throw new ArgumentNullException(nameof(scopeContextProvider));

    private readonly ITechnologyLedgerRepository _technologyLedgerRepository =
        technologyLedgerRepository ?? throw new ArgumentNullException(nameof(technologyLedgerRepository));

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

        Guid tenantId = _scopeContextProvider.GetCurrentScope().TenantId;

        if (!AgentRunIdParser.TryParse(runId, out Guid runGuid))
            throw new InvalidOperationException($"Run id '{runId}' is not a valid GUID for prompt variant resolution.");

        ScopeContext scope = _scopeContextProvider.GetCurrentScope();
        IReadOnlyList<TechnologyLedgerEntry> ledgerEntries =
            await _technologyLedgerRepository.GetByRunIdAsync(scope, runId, cancellationToken);
        CloudProvider effectiveCloudTarget = TechnologyLedgerEffectiveCloudTarget.Resolve(request, ledgerEntries);

        ResolvedSystemPrompt systemResolved = await systemPromptCatalog
            .ResolveAsync(AgentType.Topology, tenantId, runGuid, cancellationToken);
        string systemPrompt = CloudProviderAgentPromptComposer.ApplySystemPromptAddendum(
            systemResolved.Text,
            AgentType.Topology,
            effectiveCloudTarget);
        AgentPromptActivityTags.Apply(systemResolved);
        AgentPromptReproMetadata promptRepro = systemResolved.ToReproMetadata();
        string baseUserPrompt = TechnologyLedgerUserPromptInjection.AppendLedgerContext(
            AgentUserPromptComposer.BuildTopologyUserPrompt(runId, request, evidence, task, effectiveCloudTarget),
            ledgerEntries);
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
                _logger,
                traceRecorder,
                promptRepro,
                cancellationToken);

            lastCompletionJson = rawJson;

            parsed.PromptVariantKey = systemResolved.PromptVariantKey;
            AgentResultFindingEnforcementTierApplier.Apply(parsed);

            return parsed;
        }
        catch (Exception ex)
        {
            AgentCompletionTokenUsage.TryPeek(out int? inTok, out int? outTok, out int? reasoningTok);
            AgentCompletionModelMetadata.TryConsume(out string? modelDeploy, out string? modelVer);

            if (ex is AgentResultSchemaViolationException sv)

                AgentResultSchemaViolationAudit.ScheduleLog(
                    auditService,
                    _scopeContextProvider,
                    sv,
                    runId,
                    task.TaskId,
                    modelDeploy,
                    modelVer);

            if (!AgentSchemaRemediationTraceSupport.ShouldSkipHandlerFailureTrace(ex))
            {
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
            }

            throw;
        }
    }

    private async Task<string> AppendExemplarStylePriorAsync(
        string runId,
        ArchitectureRequest request,
        string baseUserPrompt,
        CancellationToken cancellationToken)
    {
        ScopeContext scope = _scopeContextProvider.GetCurrentScope();

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
                // codeql[cs/log-forging]: run id sanitized for log sink (CWE-117).
                _logger.LogWarning(
                    ex,
                    "Failed to persist retrieval grounding trace for topology agent run {RunId}.",
                    LogSanitizer.Sanitize(runId));
            }
        }
    }
}
