using System.Text.Json;

using ArchLucid.Application.Ask;
using ArchLucid.Core.Manifest;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Host.Core.Ask;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Queries;
using ArchLucid.Contracts.Common;
using ArchLucid.Core.Ask;
using ArchLucid.Core.Comparison;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Conversation;
using ArchLucid.Core.Diagnostics;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Models;
using ArchLucid.Provenance;
using ArchLucid.Core.Retrieval;
using ArchLucid.Retrieval.Chunking;
using ArchLucid.Retrieval.Models;

using Microsoft.Extensions.Options;

namespace ArchLucid.Host.Core.Services.Ask;

/// <summary>Loads run/workspace context, retrieval hits, and conversation history for Ask.</summary>
public sealed class AskContextPreparer(
    IAuthorityQueryService query,
    IProvenanceQueryService provenanceQuery,
    IComparisonService comparison,
    IConversationService conversationService,
    IRetrievalQueryService retrievalQuery,
    AskConversationHistoryBuilder conversationHistoryBuilder,
    IOptionsMonitor<AskRetrievalOptions> askRetrievalOptions,
    IRunRepository runRepository,
    IManifestHashService manifestHashService,
    ILogger<AskContextPreparer> logger)
{
    private const int HistoryTake = 40;

    private readonly IAuthorityQueryService _query =
        query ?? throw new ArgumentNullException(nameof(query));

    private readonly IProvenanceQueryService _provenanceQuery =
        provenanceQuery ?? throw new ArgumentNullException(nameof(provenanceQuery));

    private readonly IComparisonService _comparison =
        comparison ?? throw new ArgumentNullException(nameof(comparison));

    private readonly IConversationService _conversationService =
        conversationService ?? throw new ArgumentNullException(nameof(conversationService));

    private readonly IRetrievalQueryService _retrievalQuery =
        retrievalQuery ?? throw new ArgumentNullException(nameof(retrievalQuery));

    private readonly AskConversationHistoryBuilder _conversationHistoryBuilder =
        conversationHistoryBuilder ?? throw new ArgumentNullException(nameof(conversationHistoryBuilder));

    private readonly IOptionsMonitor<AskRetrievalOptions> _askRetrievalOptions =
        askRetrievalOptions ?? throw new ArgumentNullException(nameof(askRetrievalOptions));

    private readonly IRunRepository _runRepository =
        runRepository ?? throw new ArgumentNullException(nameof(runRepository));

    private readonly IManifestHashService _manifestHashService =
        manifestHashService ?? throw new ArgumentNullException(nameof(manifestHashService));

    private readonly ILogger<AskContextPreparer> _logger =
        logger ?? throw new ArgumentNullException(nameof(logger));

    public async Task<AskPreparedContext> PrepareAsync(
        AskRequest request,
        ScopeContext scope,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(request);

        if (string.IsNullOrWhiteSpace(request.Question))
            throw new ArgumentException("Question is required.", nameof(request));

        ConversationThread thread = await _conversationService.GetOrCreateThreadAsync(
            request.ThreadId,
            scope.TenantId,
            scope.WorkspaceId,
            scope.ProjectId,
            request.RunId,
            request.BaseRunId,
            request.TargetRunId,
            cancellationToken);

        Guid? effectiveRunId = request.RunId ?? thread.RunId;
        Guid? effectiveBaseRunId = request.BaseRunId ?? thread.BaseRunId;
        Guid? effectiveTargetRunId = request.TargetRunId ?? thread.TargetRunId;

        string question = request.Question.Trim();
        await _conversationService.AppendUserMessageAsync(thread.ThreadId, question, cancellationToken);

        IReadOnlyList<ConversationMessage> historyWindow =
            await _conversationService.GetHistoryAsync(thread.ThreadId, HistoryTake, cancellationToken);
        IReadOnlyList<ConversationMessage> priorMessages =
            AskConversationHistoryBuilder.TrimCurrentUserTurn(historyWindow, question);
        string historyText = await _conversationHistoryBuilder.BuildHistoryTextAsync(priorMessages, cancellationToken);

        if (!effectiveRunId.HasValue)
        {
            if (effectiveBaseRunId.HasValue || effectiveTargetRunId.HasValue)
            {
                throw new ArgumentException(
                    "Provide runId when comparing reviews.",
                    nameof(request));
            }

            return await PrepareWorkspaceContextAsync(
                thread,
                question,
                historyText,
                scope,
                cancellationToken);
        }

        RunDetailDto? detail;
        GraphViewModel? graph;
        ComparisonResult? comparisonResult = null;

        if (effectiveBaseRunId.HasValue && effectiveTargetRunId.HasValue)
        {
            Task<RunDetailDto?> detailTask = _query.GetRunDetailAsync(scope, effectiveRunId.Value, cancellationToken);
            Task<GraphViewModel?> graphTask = _provenanceQuery.GetFullGraphAsync(scope, effectiveRunId.Value, cancellationToken);
            Task<RunDetailDto?> baseRunTask = _query.GetRunDetailAsync(scope, effectiveBaseRunId.Value, cancellationToken);
            Task<RunDetailDto?> targetRunTask = _query.GetRunDetailAsync(scope, effectiveTargetRunId.Value, cancellationToken);

            await Task.WhenAll(detailTask, graphTask, baseRunTask, targetRunTask);

            detail = await detailTask;

            if (detail?.GoldenManifest is null)
            {
                throw new InvalidOperationException(
                    "Run not found or has no ManifestDocument for the current scope.");
            }

            graph = await graphTask;
            RunDetailDto? baseRun = await baseRunTask;
            RunDetailDto? targetRun = await targetRunTask;

            if (baseRun?.GoldenManifest is null || targetRun?.GoldenManifest is null)
            {
                throw new ArchLucid.Application.ConflictException(
                    "Ask compare blocked: one or both runs have no committed golden manifest available for sealed hash verification.");
            }

            await AskGroundedRunSealedManifestGuard.EnsureCompareRunsReadyOrThrowAsync(
                effectiveBaseRunId.Value,
                effectiveTargetRunId.Value,
                baseRun.GoldenManifest,
                targetRun.GoldenManifest,
                scope,
                _runRepository,
                _manifestHashService,
                cancellationToken);

            comparisonResult = _comparison.Compare(baseRun.GoldenManifest, targetRun.GoldenManifest);
        }
        else
        {
            Task<RunDetailDto?> detailTask = _query.GetRunDetailAsync(scope, effectiveRunId.Value, cancellationToken);
            Task<GraphViewModel?> graphTask = _provenanceQuery.GetFullGraphAsync(scope, effectiveRunId.Value, cancellationToken);

            await Task.WhenAll(detailTask, graphTask);

            detail = await detailTask;

            if (detail?.GoldenManifest is null)
            {
                throw new InvalidOperationException(
                    "Run not found or has no ManifestDocument for the current scope.");
            }

            graph = await graphTask;
        }

        ManifestDocument manifest = detail.GoldenManifest;

        if (!effectiveBaseRunId.HasValue || !effectiveTargetRunId.HasValue)
        {
            AskGroundedRunSealedManifestGuard.EnsureSingleRunReadyOrThrow(
                effectiveRunId!.Value,
                manifest,
                _manifestHashService);
        }

        object context = ContextBuilder.BuildContext(manifest, graph, comparisonResult);
        string contextJson = JsonSerializer.Serialize(context, ContractJson.CamelCaseIgnoreNullCompact);
        contextJson = TokenAwareContextBudget.TruncateToTokenBudget(contextJson, out bool contextTruncated);

        if (contextTruncated)
        {
            _logger.LogWarning(
                "Ask structured context truncated for token budget (ThreadId={ThreadId}, RunId={RunId}).",
                LogSanitizer.Sanitize(thread.ThreadId.ToString()),
                LogSanitizer.Sanitize(effectiveRunId.Value.ToString()));
        }

        (string retrievalContext, bool retrievalDegraded) = await BuildRetrievalContextAsync(
            scope,
            question,
            detail,
            cancellationToken);

        return new AskPreparedContext(
            thread,
            question,
            historyText,
            manifest,
            effectiveRunId,
            effectiveBaseRunId,
            effectiveTargetRunId,
            comparisonResult,
            contextJson,
            retrievalContext,
            retrievalDegraded,
            scope);
    }

    private async Task<AskPreparedContext> PrepareWorkspaceContextAsync(
        ConversationThread thread,
        string question,
        string historyText,
        ScopeContext scope,
        CancellationToken cancellationToken)
    {
        string contextJson = AskWorkspaceContextBuilder.BuildContextJson(scope);
        (string retrievalContext, bool retrievalDegraded) = await BuildRetrievalContextAsync(
            scope,
            question,
            runDetailForFallback: null,
            cancellationToken);

        return new AskPreparedContext(
            thread,
            question,
            historyText,
            null,
            null,
            null,
            null,
            null,
            contextJson,
            retrievalContext,
            retrievalDegraded,
            scope);
    }

    private async Task<(string Context, bool Degraded)> BuildRetrievalContextAsync(
        ScopeContext scope,
        string question,
        RunDetailDto? runDetailForFallback,
        CancellationToken cancellationToken)
    {
        try
        {
            bool includePolicyPacks = AskRetrievalIntentDetector.DetectPolicyPackIntent(question);
            bool includePlatformDocs = AskRetrievalIntentDetector.DetectPlatformDocIntent(question);
            bool boostPriorManifest = AskRetrievalIntentDetector.DetectPriorManifestIntent(question);
            const int retrievalTopK = 8;
            bool skipExpensiveStages = _askRetrievalOptions.CurrentValue.SkipExpensiveStages;

            IReadOnlyList<RetrievalHit> rawHits = await _retrievalQuery.SearchAsync(
                new RetrievalQuery
                {
                    TenantId = scope.TenantId,
                    WorkspaceId = scope.WorkspaceId,
                    ProjectId = scope.ProjectId,
                    RunId = null,
                    ManifestId = null,
                    QueryText = question,
                    TopK = retrievalTopK,
                    IncludePlatformCorpora = includePolicyPacks || includePlatformDocs,
                    SkipReranking = skipExpensiveStages,
                    SkipQueryExpansion = skipExpensiveStages,
                },
                cancellationToken);

            IReadOnlyList<RetrievalHit> retrievalHits =
                AskRetrievalHitRanker.Rank(rawHits, boostPriorManifest, retrievalTopK);

            return (AskRetrievalContextFormatter.Format(retrievalHits), false);
        }
        catch (OperationCanceledException)
        {
            throw;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Retrieval search failed for Ask; falling back to SQL findings/manifest text search.");
            ArchLucidInstrumentation.RecordRagRetrievalFallback();

            string fallback = runDetailForFallback is null
                ? string.Empty
                : AskRetrievalSqlFallback.BuildFromRunDetail(runDetailForFallback, question);

            return (fallback, true);
        }
    }
}
