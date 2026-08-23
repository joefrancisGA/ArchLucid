using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Requests;
using ArchLucid.Core.Diagnostics;
using ArchLucid.Core.Retrieval;
using ArchLucid.Core.Scoping;
using ArchLucid.Retrieval.Compliance;
using ArchLucid.Retrieval.Evaluation;
using ArchLucid.Retrieval.PolicyPacks;

using Microsoft.Extensions.Logging;

namespace ArchLucid.AgentRuntime;

/// <summary>
///     Shared policy-pack RAG hook for compliance, topology, and cost agents.
/// </summary>
public sealed class AgentPolicyPackRetrievalAppender(
    IScopeContextProvider scopeContextProvider,
    IRetrievalQueryService retrievalQueryService,
    IRetrievalCitationFormatter retrievalCitationFormatter,
    IRetrievalGroundingTraceWriter retrievalGroundingTraceWriter,
    AgentPolicyPackRulePackIdResolver agentPolicyPackRulePackIdResolver,
    ILogger<AgentPolicyPackRetrievalAppender> logger)
{
    private const int PolicyPackTopK = 6;

    private readonly IScopeContextProvider _scopeContextProvider =
        scopeContextProvider ?? throw new ArgumentNullException(nameof(scopeContextProvider));

    private readonly IRetrievalQueryService _retrievalQueryService =
        retrievalQueryService ?? throw new ArgumentNullException(nameof(retrievalQueryService));

    private readonly IRetrievalCitationFormatter _retrievalCitationFormatter =
        retrievalCitationFormatter ?? throw new ArgumentNullException(nameof(retrievalCitationFormatter));

    private readonly IRetrievalGroundingTraceWriter _retrievalGroundingTraceWriter =
        retrievalGroundingTraceWriter ?? throw new ArgumentNullException(nameof(retrievalGroundingTraceWriter));

    private readonly AgentPolicyPackRulePackIdResolver _agentPolicyPackRulePackIdResolver =
        agentPolicyPackRulePackIdResolver
        ?? throw new ArgumentNullException(nameof(agentPolicyPackRulePackIdResolver));

    private readonly ILogger<AgentPolicyPackRetrievalAppender> _logger =
        logger ?? throw new ArgumentNullException(nameof(logger));

    public async Task<(string Prompt, IReadOnlyList<RetrievalHit> Hits)> AppendAsync(
        AgentType agentType,
        ArchitectureRequest request,
        string runId,
        string baseUserPrompt,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(request);
        ArgumentException.ThrowIfNullOrWhiteSpace(baseUserPrompt);

        ScopeContext scope = _scopeContextProvider.GetCurrentScope();
        string queryText = PolicyPackRetrievalPromptFormatter.BuildPolicyQueryText(request, agentType);

        try
        {
            HashSet<string> allowedRulePackIds = await _agentPolicyPackRulePackIdResolver
                .ResolveAsync(scope.TenantId, scope.WorkspaceId, scope.ProjectId, agentType, cancellationToken)
                .ConfigureAwait(false);

            RetrievalQuery query = BuildQuery(scope, queryText, allowedRulePackIds);

            IReadOnlyList<RetrievalHit> hits =
                await _retrievalQueryService.SearchAsync(query, cancellationToken).ConfigureAwait(false);

            if (hits.Count == 0 && _logger.IsEnabled(LogLevel.Warning))
            {
                _logger.LogWarning(
                    "{AgentType} agent policy-pack retrieval returned zero hits for tenant {TenantId}.",
                    agentType,
                    scope.TenantId);
            }

            string block = PolicyPackRetrievalPromptFormatter.FormatPolicyPackBlock(
                agentType,
                hits,
                _retrievalCitationFormatter);
            string prompt = baseUserPrompt.TrimEnd() + "\n\n" + block + "\n";

            await AppendGroundingTraceAsync(scope, runId, agentType, query, hits, cancellationToken)
                .ConfigureAwait(false);

            return (prompt, hits);
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            if (_logger.IsEnabled(LogLevel.Warning))
            {
                _logger.LogWarning(
                    ex,
                    "{AgentType} agent policy-pack retrieval failed; continuing fail-open for tenant {TenantId}.",
                    agentType,
                    scope.TenantId);
            }

            RetrievalQuery failedQuery = BuildQuery(scope, queryText, allowedRulePackIds: null);

            await AppendGroundingTraceAsync(scope, runId, agentType, failedQuery, [], cancellationToken)
                .ConfigureAwait(false);

            string prompt = baseUserPrompt.TrimEnd()
                + "\n\n"
                + PolicyPackRetrievalPromptFormatter.FormatPolicyPackBlock(agentType, [], _retrievalCitationFormatter)
                + "\n";

            return (prompt, []);
        }
    }

    public static void RecordRetrievalFaithfulness(
        IReadOnlyList<RetrievalHit> hits,
        string agentOutputText,
        Guid tenantId)
    {
        if (hits.Count == 0)
            return;

        RetrievalFaithfulnessEvaluator.EvaluateAndRecord(hits, agentOutputText, tenantId);
    }

    private static RetrievalQuery BuildQuery(
        ScopeContext scope,
        string queryText,
        HashSet<string>? allowedRulePackIds) =>
        new()
        {
            TenantId = scope.TenantId,
            WorkspaceId = scope.WorkspaceId,
            ProjectId = scope.ProjectId,
            QueryText = queryText,
            TopK = PolicyPackTopK,
            IncludePlatformCorpora = true,
            AllowedPolicyPackRulePackIds = allowedRulePackIds,
        };

    private async Task AppendGroundingTraceAsync(
        ScopeContext scope,
        string runId,
        AgentType agentType,
        RetrievalQuery query,
        IReadOnlyList<RetrievalHit> hits,
        CancellationToken cancellationToken)
    {
        if (!AgentRunIdParser.TryParse(runId, out Guid runGuid))
            return;

        RetrievalGroundingTraceInsert insert = RetrievalGroundingTraceBuilder.Build(
            scope,
            runGuid,
            agentType.ToString(),
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
                    "Failed to persist retrieval grounding trace for {AgentType} agent run {RunId}.",
                    agentType,
                    LogSanitizer.Sanitize(runId));
            }
        }
    }
}
