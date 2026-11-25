using System.Data.SqlTypes;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;

using ArchLucid.Api.Attributes;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Application.Architecture;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.Conversation;
using ArchLucid.Core.Pagination;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;
using ArchLucid.Host.Core.Services.Ask;
using ArchLucid.Persistence.Conversation;
using ArchLucid.Persistence.Interfaces;

using Asp.Versioning;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace ArchLucid.Api.Controllers.Planning;

/// <summary>
/// Provides scoped conversation history only for completed turns whose actor and evidence
/// provenance can still be authorized. Unverified legacy messages are not exposed.
/// </summary>
[ApiController]
[Authorize(Policy = ArchLucidPolicies.ReadAuthority)]
[ApiVersion("1.0")]
[Route("v{version:apiVersion}/conversations")]
[EnableRateLimiting("fixed")]
[RequiresCommercialTenantTier(TenantTier.Standard)]
public sealed class ConversationController(
    IConversationThreadRepository threadRepository,
    IConversationMessageRepository messageRepository,
    IScopeContextProvider scopeProvider,
    IAskEvidenceAccess evidenceAccess,
    IRunRepository runRepository)
    : ControllerBase
{
    private const int MaxThreadCandidates = 500;
    private const int ListingHistoryTake = 40;

    /// <summary>Lists visible conversation threads, paginating only after verifying visibility.</summary>
    [HttpGet]
    [ProducesResponseType(typeof(IReadOnlyList<ConversationThread>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(PagedResponse<ConversationThread>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> ListThreads(
        int take = 50,
        [FromQuery] int? page = null,
        [FromQuery] int pageSize = PaginationDefaults.DefaultPageSize,
        CancellationToken ct = default)
    {
        ScopeContext scope = scopeProvider.GetCurrentScope();
        string? actorId = evidenceAccess.GetAuthorizedActorId();
        if (!HasIdentifiedActor(actorId) || !IsCompleteScope(scope))
            return this.NotFoundProblem("Conversation history is not available for the current caller.",
                ProblemTypes.ResourceNotFound);

        // Raw scope-wide totals and headers are discovery inputs, not public results.
        List<ConversationThread>? candidates = await LoadCandidateThreadsAsync(scope, ct);
        if (candidates is null)
            return ListingBudgetConflict();

        Dictionary<Guid, bool> decisions = [];
        List<ConversationThread> visible = [];
        HashSet<Guid>? projectRuns = null;
        foreach (ConversationThread thread in candidates)
        {
            ct.ThrowIfCancellationRequested();
            HashSet<Guid>? anchors = await ResolveThreadAnchorsAsync(thread, scope, decisions, ct);
            if (anchors is null)
                continue;

            projectRuns ??= await AuthorizedEvidenceRunResolver.ResolveProjectAsync(
                runRepository, scope, (id, token) => CanReadRunAsync(scope, id, decisions, token), ct);
            if (projectRuns is null)
                return ListingBudgetConflict();

            HashSet<Guid> authorizedRuns = new(projectRuns);
            authorizedRuns.UnionWith(anchors);

            IReadOnlyList<ConversationProofRow> proofs =
                await messageRepository.GetRecentProofsAsync(scope, thread.ThreadId, ListingHistoryTake, ct);
            var verified = AskHistoryEvidenceScope.SelectVerifiedTurnReferences(
                proofs, thread.ThreadId, actorId!, authorizedRuns);
            if (verified.Count == 0)
                continue;

            // Do not reveal a title or last activity caused by an unverified turn.
            visible.Add(new ConversationThread
            {
                ThreadId = thread.ThreadId,
                TenantId = thread.TenantId,
                WorkspaceId = thread.WorkspaceId,
                ProjectId = thread.ProjectId,
                RunId = thread.RunId,
                BaseRunId = thread.BaseRunId,
                TargetRunId = thread.TargetRunId,
                Title = "Architecture Conversation",
                CreatedUtc = verified.Min(turn => turn.Answer.CreatedUtc),
                LastUpdatedUtc = verified.Max(turn => turn.Answer.CreatedUtc),
            });
        }

        List<ConversationThread> ordered = visible.OrderByDescending(t => t.LastUpdatedUtc)
            .ThenBy(t => new SqlGuid(t.ThreadId)).ToList();
        if (page.HasValue)
            return Ok(PagedResponseBuilder.Build(ordered, page.Value, pageSize));

        int safeTake = Math.Clamp(take, 1, PaginationDefaults.MaxPageSize);
        List<ConversationThread> recent = ordered.Take(safeTake).ToList();
        return Ok(PagedResponseBuilder.FromDatabasePage(recent, recent.Count, 1, safeTake));
    }

    /// <summary>Returns completed, currently authorized conversation turns within the recent message window.</summary>
    [HttpGet("{threadId:guid}/messages")]
    [ProducesResponseType(typeof(IReadOnlyList<ConversationMessage>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(Microsoft.AspNetCore.Mvc.ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetMessages(Guid threadId, int take = 100, CancellationToken ct = default)
    {
        IActionResult NotFoundThread() => this.NotFoundProblem(
            $"Conversation thread '{threadId}' was not found in the current scope.", ProblemTypes.ResourceNotFound);

        ScopeContext scope = scopeProvider.GetCurrentScope();
        string? actorId = evidenceAccess.GetAuthorizedActorId();
        if (threadId == Guid.Empty || !HasIdentifiedActor(actorId) || !IsCompleteScope(scope))
            return NotFoundThread();

        ConversationThread? thread = await threadRepository.GetByIdAsync(threadId, ct);
        if (thread is null || thread.ThreadId != threadId)
            return NotFoundThread();

        Dictionary<Guid, bool> decisions = [];
        HashSet<Guid>? anchors = await ResolveThreadAnchorsAsync(thread, scope, decisions, ct);
        if (anchors is null)
            return NotFoundThread();

        HashSet<Guid>? projectRuns = await AuthorizedEvidenceRunResolver.ResolveProjectAsync(
            runRepository, scope, (id, token) => CanReadRunAsync(scope, id, decisions, token), ct);
        // Match Ask's anchored fallback; never treat incomplete enumeration as unrestricted.
        if (projectRuns is null && thread.RunId is null)
            return NotFoundThread();

        HashSet<Guid> authorizedRuns = projectRuns ?? [];
        authorizedRuns.UnionWith(anchors);

        // Verify the bounded proof window first. Denied turns never enter the payload query.
        IReadOnlyList<ConversationProofRow> proofs = await messageRepository.GetRecentProofsAsync(
            scope, threadId, PaginationDefaults.MaxListingTake, ct);
        var pairs = AskHistoryEvidenceScope.SelectVerifiedTurnReferences(proofs, threadId, actorId!, authorizedRuns);
        if (pairs.Count == 0)
            return NotFoundThread();

        var messageIds = pairs.SelectMany(pair => new[] { pair.Question.MessageId, pair.Answer.MessageId }).ToHashSet();
        IReadOnlyList<ConversationMessage> messages = await messageRepository.GetAuthorizedMessagesAsync(
            scope, threadId, messageIds, ct);
        if (messages.Count != messageIds.Count || !messageIds.SetEquals(messages.Select(m => m.MessageId)) ||
            messages.Any(m => m.ThreadId != threadId))
            return NotFoundThread();

        // Rebind the hydrated question text to the same proof before returning it.
        IReadOnlyList<ConversationMessage> verified = AskHistoryEvidenceScope.SelectVerifiedTurns(
            messages, threadId, actorId!, authorizedRuns);
        if (verified.Count == 0)
            return NotFoundThread();

        int safeTake = Math.Clamp(take, 1, PaginationDefaults.MaxListingTake);
        return Ok(ProjectPublicMessages(verified).TakeLast(safeTake).ToList());
    }

    private static bool HasIdentifiedActor(string? actorId) =>
        !string.IsNullOrWhiteSpace(actorId) &&
        !string.Equals(actorId, "api-user", StringComparison.OrdinalIgnoreCase);

    private static bool IsCompleteScope(ScopeContext scope) =>
        scope.TenantId != Guid.Empty && scope.WorkspaceId != Guid.Empty && scope.ProjectId != Guid.Empty;

    private IActionResult ListingBudgetConflict() => this.ConflictProblem(
        "Conversation history could not be completely authorized within the listing budget.",
        ProblemTypes.Conflict);

    private async Task<List<ConversationThread>?> LoadCandidateThreadsAsync(ScopeContext scope, CancellationToken ct)
    {
        List<ConversationThread> candidates = [];
        HashSet<Guid> seen = [];
        int? expectedTotal = null;
        for (int skip = 0; skip < MaxThreadCandidates;)
        {
            int pageTake = Math.Min(PaginationDefaults.MaxPageSize, MaxThreadCandidates - skip);
            (IReadOnlyList<ConversationThread> items, int total) = await threadRepository.ListByScopePagedAsync(
                scope.TenantId, scope.WorkspaceId, scope.ProjectId, skip, pageTake, ct);
            if (total < 0 || total > MaxThreadCandidates ||
                (expectedTotal.HasValue && expectedTotal.Value != total) ||
                items.Count != Math.Min(pageTake, Math.Max(0, total - skip)))
                return null;

            expectedTotal = total;
            foreach (ConversationThread item in items)
            {
                if (!seen.Add(item.ThreadId))
                    return null;
                candidates.Add(item);
            }

            skip += items.Count;
            if (skip >= total)
                return candidates;
        }

        return null;
    }

    private async Task<HashSet<Guid>?> ResolveThreadAnchorsAsync(
        ConversationThread thread, ScopeContext scope, Dictionary<Guid, bool> decisions, CancellationToken ct)
    {
        if (thread.ThreadId == Guid.Empty || thread.ArchivedUtc.HasValue ||
            thread.TenantId != scope.TenantId || thread.WorkspaceId != scope.WorkspaceId ||
            thread.ProjectId != scope.ProjectId ||
            thread.BaseRunId.HasValue != thread.TargetRunId.HasValue ||
            (thread.RunId is null && thread.BaseRunId.HasValue))
            return null;

        HashSet<Guid> anchors = [];
        foreach (Guid? candidate in new[] { thread.RunId, thread.BaseRunId, thread.TargetRunId })
        {
            if (candidate is not Guid id)
                continue;
            if (id == Guid.Empty || !await CanReadRunAsync(scope, id, decisions, ct))
                return null;
            anchors.Add(id);
        }

        return anchors;
    }

    private async Task<bool> CanReadRunAsync(
        ScopeContext scope, Guid runId, Dictionary<Guid, bool> decisions, CancellationToken ct)
    {
        if (!decisions.TryGetValue(runId, out bool allowed))
        {
            allowed = await evidenceAccess.CanReadRunAsync(scope, runId, ct);
            decisions.Add(runId, allowed);
        }

        return allowed;
    }

    private static IEnumerable<ConversationMessage> ProjectPublicMessages(IReadOnlyList<ConversationMessage> verified)
    {
        // The V1 proof binds question text, not the original user row's identity. Return a
        // stable display-only question ID and the verified completion time rather than
        // leaking an unrelated matching row's identifier, timestamp or metadata.
        for (int i = 0; i + 1 < verified.Count; i += 2)
        {
            ConversationMessage question = verified[i];
            ConversationMessage answer = verified[i + 1];
            byte[] digest = SHA256.HashData(Encoding.UTF8.GetBytes($"ask-question-display|{answer.MessageId:N}"));
            yield return new ConversationMessage
            {
                MessageId = new Guid(digest.AsSpan(0, 16)),
                ThreadId = answer.ThreadId,
                Role = ConversationMessageRole.User,
                Content = question.Content,
                CreatedUtc = answer.CreatedUtc,
                MetadataJson = "{}",
            };
            yield return new ConversationMessage
            {
                MessageId = answer.MessageId,
                ThreadId = answer.ThreadId,
                Role = ConversationMessageRole.Assistant,
                Content = answer.Content,
                CreatedUtc = answer.CreatedUtc,
                MetadataJson = PublicAssistantMetadata(answer.MetadataJson),
            };
        }
    }

    private static string PublicAssistantMetadata(string metadata)
    {
        using JsonDocument document = JsonDocument.Parse(metadata);
        Dictionary<string, JsonElement> publicValues = new(StringComparer.Ordinal);
        foreach (JsonProperty property in document.RootElement.EnumerateObject())
        {
            if (property.Name is "referencedDecisions" or "referencedFindings" or "referencedArtifacts" or
                "referencedDecisionsStoredEmpty" or "referencedDecisionsNotStored" or
                "referencedFindingsStoredEmpty" or "referencedFindingsNotStored" or
                "referencedArtifactsStoredEmpty" or "referencedArtifactsNotStored")
                publicValues.TryAdd(property.Name, property.Value);
        }

        return JsonSerializer.Serialize(publicValues);
    }
}
