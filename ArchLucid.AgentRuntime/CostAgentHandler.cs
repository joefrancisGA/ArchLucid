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
using ArchLucid.Retrieval.Pricing;

using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace ArchLucid.AgentRuntime;

/// <summary>
///     <see cref="AgentType.Cost" /> handler with multi-cloud structured retail grounding (RAG-V1-003 / TB-603).
/// </summary>
public sealed class CostAgentHandler(
    IAgentTierCompletionRouter tierCompletionRouter,
    ISchemaRemediationAgentCompletionClient schemaRemediationClient,
    IAgentResultParser resultParser,
    IAgentExecutionTraceRecorder traceRecorder,
    IAgentSystemPromptCatalog systemPromptCatalog,
    IAuditService auditService,
    IScopeContextProvider scopeContextProvider,
    ITechnologyLedgerRepository technologyLedgerRepository,
    CostRetailGroundingLookups retailGroundingLookups,
    AgentPolicyPackRetrievalAppender policyPackRetrievalAppender,
    IRetrievalGroundingTraceWriter retrievalGroundingTraceWriter,
    IOptionsMonitor<AgentSchemaRemediationOptions> schemaRemediationOptions,
    ILogger<CostAgentHandler> logger)
    : IAgentHandler
{
    private readonly IScopeContextProvider _scopeContextProvider =
        scopeContextProvider ?? throw new ArgumentNullException(nameof(scopeContextProvider));

    private readonly ITechnologyLedgerRepository _technologyLedgerRepository =
        technologyLedgerRepository ?? throw new ArgumentNullException(nameof(technologyLedgerRepository));

    private readonly CostRetailGroundingLookups _retailGroundingLookups =
        retailGroundingLookups ?? throw new ArgumentNullException(nameof(retailGroundingLookups));

    private readonly AgentPolicyPackRetrievalAppender _policyPackRetrievalAppender =
        policyPackRetrievalAppender ?? throw new ArgumentNullException(nameof(policyPackRetrievalAppender));

    private readonly IRetrievalGroundingTraceWriter _retrievalGroundingTraceWriter =
        retrievalGroundingTraceWriter ?? throw new ArgumentNullException(nameof(retrievalGroundingTraceWriter));

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

        Guid tenantId = _scopeContextProvider.GetCurrentScope().TenantId;

        if (!AgentRunIdParser.TryParse(runId, out Guid runGuid))
            throw new InvalidOperationException($"Run id '{runId}' is not a valid GUID for prompt variant resolution.");

        (CloudProvider effectiveCloudTarget, IReadOnlyList<TechnologyLedgerEntry> ledgerEntries) =
            await TechnologyLedgerUserPromptInjection.LoadAsync(
                _technologyLedgerRepository,
                _scopeContextProvider,
                runId,
                request,
                cancellationToken).ConfigureAwait(false);

        ResolvedSystemPrompt systemResolved = await systemPromptCatalog
            .ResolveAsync(AgentType.Cost, tenantId, runGuid, cancellationToken);
        string systemPrompt = CloudProviderAgentPromptComposer.ApplySystemPromptAddendum(
            systemResolved.Text,
            AgentType.Cost,
            effectiveCloudTarget);
        AgentPromptActivityTags.Apply(systemResolved);
        AgentPromptReproMetadata promptRepro = systemResolved.ToReproMetadata();
        CostRetailGroundingResult retailGrounding = CostRetailGroundingBuilder.Build(
            request,
            evidence,
            _retailGroundingLookups,
            effectiveCloudTarget);
        string baseUserPrompt = TechnologyLedgerUserPromptInjection.AppendLedgerContext(
            AgentUserPromptComposer.BuildCostUserPrompt(
                runId,
                request,
                evidence,
                task,
                effectiveCloudTarget,
                retailGrounding),
            ledgerEntries);
        await TryPersistRetailGroundingTraceAsync(runId, request, retailGrounding, cancellationToken);
        baseUserPrompt = (await _policyPackRetrievalAppender
            .AppendAsync(AgentType.Cost, request, runId, baseUserPrompt, cancellationToken)
            .ConfigureAwait(false)).Prompt;

        return await AgentHandlerCompletionExecutor.CompleteWithSchemaRemediationAsync(
            tierCompletionRouter,
            schemaRemediationClient,
            resultParser,
            schemaRemediationOptions,
            traceRecorder,
            auditService,
            _scopeContextProvider,
            _logger,
            AgentType.Cost,
            runId,
            task,
            request,
            systemPrompt,
            baseUserPrompt,
            promptRepro,
            systemResolved.PromptVariantKey,
            cancellationToken: cancellationToken);
    }

    internal static string BuildUserPrompt(
        string runId,
        ArchitectureRequest request,
        AgentEvidencePackage evidence,
        AgentTask task,
        CloudProvider effectiveCloudTarget,
        CostRetailGroundingResult grounding,
        IReadOnlyList<TechnologyLedgerEntry> ledgerEntries) =>
        TechnologyLedgerUserPromptInjection.AppendLedgerContext(
            AgentUserPromptComposer.BuildCostUserPrompt(
                runId,
                request,
                evidence,
                task,
                effectiveCloudTarget,
                grounding),
            ledgerEntries);


    private async Task TryPersistRetailGroundingTraceAsync(
        string runId,
        ArchitectureRequest request,
        CostRetailGroundingResult grounding,
        CancellationToken cancellationToken)
    {
        if (grounding.SkippedRetailGrounding)
            return;

        if (!AgentRunIdParser.TryParse(runId, out Guid runGuid))
            return;

        ScopeContext scope = _scopeContextProvider.GetCurrentScope();

        RetrievalGroundingTraceInsert insert =
            RetailPriceRetrievalGroundingTraceMapper.BuildInsert(scope, runGuid, request, grounding);

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
                    "Failed to persist retail-price grounding trace for cost agent run {RunId}.",
                    LogSanitizer.Sanitize(runId));
            }
        }
    }
}
