using ArchLucid.Contracts.Drafts;
using ArchLucid.Core.Metering;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Tenancy;

using FluentAssertions;

namespace ArchLucid.Persistence.Tests.Repositories;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class DraftRequestRepositoryCoreTests
{
    [Fact]
    public async Task Bind_conversation_preserves_document_and_rejects_stale_revision()
    {
        InMemoryDraftRequestRepository repository = new();
        Guid tenant = Guid.NewGuid(), workspace = Guid.NewGuid(), project = Guid.NewGuid();
        CancellationToken ct = CancellationToken.None;
        DraftRequestResponse original = await repository.CreateAsync(tenant, workspace, project, "architect",
            new DraftRequestDocument { FreeTextIntent = "initial" }, ct);

        DraftRequestResponse changed = (await repository.UpdateAsync(tenant, workspace, project, original.DraftId,
            DraftRequestStatus.Drafting, new DraftRequestDocument { FreeTextIntent = "concurrent edit" },
            null, null, ct))!;

        (await repository.TryBindConversationThreadAsync(original, Guid.NewGuid(), ct)).Should().BeNull();
        Guid threadId = Guid.NewGuid();
        DraftRequestResponse bound = (await repository.TryBindConversationThreadAsync(changed, threadId, ct))!;

        bound.Document.FreeTextIntent.Should().Be("concurrent edit");
        bound.Document.ConversationThreadId.Should().Be(threadId);
        bound.Status.Should().Be(DraftRequestStatus.Drafting);
        bound.DocumentContentHashSha256.Should().Equal(DraftDocumentContentFingerprint.Compute(bound.Document));
        (await repository.TryBindConversationThreadAsync(changed, Guid.NewGuid(), ct)).Should().BeNull();
        (await repository.GetAsync(tenant, workspace, project, original.DraftId, ct))!
            .Document.ConversationThreadId.Should().Be(threadId);
    }

    [Fact]
    public async Task Bind_conversation_rejects_changed_architecture_and_terminal_state()
    {
        InMemoryDraftRequestRepository repository = new();
        Guid tenant = Guid.NewGuid(), workspace = Guid.NewGuid(), project = Guid.NewGuid();
        CancellationToken ct = CancellationToken.None;
        DraftRequestResponse initial = await repository.CreateAsync(tenant, workspace, project, "architect",
            new DraftRequestDocument(), ct);

        await repository.SetArchitectureIdAsync(tenant, workspace, project, initial.DraftId, Guid.NewGuid(), ct);
        (await repository.TryBindConversationThreadAsync(initial, Guid.NewGuid(), ct)).Should().BeNull();
        DraftRequestResponse terminal = (await repository.UpdateAsync(tenant, workspace, project, initial.DraftId,
            DraftRequestStatus.Abandoned, new DraftRequestDocument(), null, null, ct))!;
        (await repository.TryBindConversationThreadAsync(terminal, Guid.NewGuid(), ct)).Should().BeNull();
    }

    [Fact]
    public async Task InMemoryDraftRead_does_not_expose_stored_hash_buffers()
    {
        InMemoryDraftRequestRepository repository = new();
        Guid tenantId = Guid.NewGuid();
        Guid workspaceId = Guid.NewGuid();
        Guid projectId = Guid.NewGuid();
        DraftRequestDocument document = new();
        CancellationToken ct = CancellationToken.None;

        DraftRequestResponse draft = await repository.CreateAsync(
            tenantId, workspaceId, projectId, "architect", document, ct);
        byte[] expectedHash = draft.DocumentContentHashSha256!.ToArray();

        await repository.UpdateAsync(
            tenantId, workspaceId, projectId, draft.DraftId, DraftRequestStatus.RunSpawned, document,
            redirectReason: null, spawnedRunId: "run-1", ct, spawnedDocumentContentHashSha256: expectedHash);

        DraftRequestResponse read = (await repository.GetAsync(tenantId, workspaceId, projectId, draft.DraftId, ct))!;
        read.DocumentContentHashSha256![0] ^= 0xff;
        read.SpawnedDocumentContentHashSha256![0] ^= 0xff;

        DraftRequestResponse reread = (await repository.GetAsync(tenantId, workspaceId, projectId, draft.DraftId, ct))!;
        reread.DocumentContentHashSha256.Should().Equal(expectedHash);
        reread.SpawnedDocumentContentHashSha256.Should().Equal(expectedHash);
    }

    [Fact]
    public void ListRunSpawnedInScope_uses_sql_draft_id_order_for_tied_timestamps_before_cap()
    {
        Guid tenantId = Guid.NewGuid();
        Guid workspaceId = Guid.NewGuid();
        Guid projectId = Guid.NewGuid();
        // SQL GUID order compares the node bytes ahead of the first group.
        Guid lowerSqlId = Guid.Parse("ffffffff-0000-0000-0000-000000000001");
        Guid higherSqlId = Guid.Parse("00000000-0000-0000-0000-000000000002");
        DateTime updatedUtc = new(2026, 11, 20, 13, 0, 0, DateTimeKind.Utc);

        InMemoryDraftRequestStoredDraft lower = new()
        {
            DraftId = lowerSqlId,
            TenantId = tenantId,
            WorkspaceId = workspaceId,
            ProjectId = projectId,
            Status = DraftRequestStatus.RunSpawned,
            UpdatedUtc = updatedUtc,
        };
        InMemoryDraftRequestStoredDraft higher = lower with { DraftId = higherSqlId };

        IReadOnlyList<DraftRequestResponse> drafts = DraftRequestRepositoryCore.ListRunSpawnedInScope(
            [lower, higher], tenantId, workspaceId, projectId, Guid.Empty, 1,
            static draft => new DraftRequestResponse { DraftId = draft.DraftId });

        drafts.Should().ContainSingle().Which.DraftId.Should().Be(higherSqlId);
    }

    [Fact]
    public void NormalizeSystemName_uppercases() =>
        DraftRequestRepositoryCore.NormalizeSystemName(" abc ").Should().Be("ABC");

    [Fact]
    public void MatchesProjectScope_requires_all_scope_ids()
    {
        Guid tenantId = Guid.NewGuid();
        Guid workspaceId = Guid.NewGuid();
        Guid projectId = Guid.NewGuid();

        DraftRequestRepositoryCore.MatchesProjectScope(
                tenantId,
                workspaceId,
                projectId,
                tenantId,
                workspaceId,
                projectId)
            .Should()
            .BeTrue();

        DraftRequestRepositoryCore.MatchesProjectScope(
                tenantId,
                workspaceId,
                projectId,
                tenantId,
                workspaceId,
                Guid.NewGuid())
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsReaperEligible_only_terminal_before_cutoff()
    {
        DateTime cutoff = new(2026, 1, 2, 0, 0, 0, DateTimeKind.Utc);

        DraftRequestRepositoryCore
            .IsReaperEligible(DraftRequestStatus.Redirected, cutoff.AddDays(-1), cutoff)
            .Should()
            .BeTrue();

        DraftRequestRepositoryCore
            .IsReaperEligible(DraftRequestStatus.Drafting, cutoff.AddDays(-1), cutoff)
            .Should()
            .BeFalse();

        DraftRequestRepositoryCore
            .IsReaperEligible(DraftRequestStatus.Abandoned, cutoff, cutoff)
            .Should()
            .BeFalse();
    }

    [Fact]
    public void MatchesMutableSystemName_honors_exclude_draft()
    {
        Guid draftId = Guid.NewGuid();

        DraftRequestRepositoryCore
            .MatchesMutableSystemName("Claims", "CLAIMS", draftId, draftId)
            .Should()
            .BeFalse();

        DraftRequestRepositoryCore
            .MatchesMutableSystemName("Claims", "CLAIMS", draftId, null)
            .Should()
            .BeTrue();
    }
}

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class UsageEventRepositoryCoreTests
{
    [Fact]
    public void SelectDistinctIdempotencyKeysForBatchInsert_dedupes_within_batch()
    {
        Guid tenantId = Guid.NewGuid();
        UsageEvent first = new()
        {
            Id = Guid.NewGuid(),
            TenantId = tenantId,
            IdempotencyKey = "dup",
            Kind = UsageMeterKind.LlmPromptTokens,
            Quantity = 1,
            RecordedUtc = DateTimeOffset.UtcNow,
        };
        UsageEvent second = new()
        {
            Id = Guid.NewGuid(),
            TenantId = tenantId,
            IdempotencyKey = "dup",
            Kind = UsageMeterKind.LlmPromptTokens,
            Quantity = 2,
            RecordedUtc = DateTimeOffset.UtcNow,
        };

        List<UsageEvent> selected = UsageEventRepositoryCore.SelectDistinctIdempotencyKeysForBatchInsert(
            [first, second]);

        selected.Should().ContainSingle().Which.Id.Should().Be(first.Id);
    }

    [Fact]
    public void AggregateByKind_groups_matching_period_events()
    {
        Guid tenantId = Guid.NewGuid();
        DateTimeOffset start = new(2026, 1, 1, 0, 0, 0, TimeSpan.Zero);
        DateTimeOffset end = start.AddDays(1);
        UsageEvent[] events =
        [
            new()
            {
                Id = Guid.NewGuid(),
                TenantId = tenantId,
                Kind = UsageMeterKind.LlmPromptTokens,
                Quantity = 3,
                RecordedUtc = start.AddHours(1),
            },
            new()
            {
                Id = Guid.NewGuid(),
                TenantId = tenantId,
                Kind = UsageMeterKind.LlmPromptTokens,
                Quantity = 2,
                RecordedUtc = start.AddHours(2),
            },
        ];

        IReadOnlyList<TenantUsageSummary> summaries =
            UsageEventRepositoryCore.AggregateByKind(events, tenantId, start, end);

        summaries.Should().ContainSingle();
        summaries[0].TotalQuantity.Should().Be(5);
    }

    [Fact]
    public async Task Authorized_revision_never_reads_or_overwrites_a_relinked_draft()
    {
        InMemoryDraftRequestRepository repository = new();
        Guid tenant = Guid.NewGuid();
        Guid workspace = Guid.NewGuid();
        Guid project = Guid.NewGuid();
        Guid prior = Guid.NewGuid();
        CancellationToken ct = CancellationToken.None;
        DraftRequestResponse created = await repository.CreateAsync(
            tenant, workspace, project, "draft-owner", new DraftRequestDocument { PriorRunId = prior.ToString("D") }, ct);
        DraftRequestAccessMetadata facts = (await repository.GetAccessMetadataAsync(
            tenant, workspace, project, created.DraftId, ct))!;
        facts.CreatedByUserId.Should().Be("draft-owner");
        facts.PriorRunId.Should().Be(prior.ToString("D"));
        (await repository.GetAccessMetadataAsync(tenant, workspace, Guid.NewGuid(), created.DraftId, ct)).Should().BeNull();
        DraftRequestResponse original = (await repository.GetAtAccessRevisionAsync(
            tenant, workspace, project, created.DraftId, facts.UpdatedUtc, ct))!;

        Guid architecture = Guid.NewGuid();
        (await repository.SetArchitectureIdAsync(tenant, workspace, project, created.DraftId, architecture, ct))
            .Should().BeTrue();
        original.Document.QuestionAnswers["cost"] = "stale";

        (await repository.GetAtAccessRevisionAsync(
            tenant, workspace, project, created.DraftId, facts.UpdatedUtc, ct)).Should().BeNull();
        (await repository.UpdateAtAccessRevisionAsync(original, ct)).Should().BeNull();

        DraftRequestAccessMetadata changed = (await repository.GetAccessMetadataAsync(
            tenant, workspace, project, created.DraftId, ct))!;
        changed.ArchitectureId.Should().Be(architecture);
        DraftRequestResponse latest = (await repository.GetAtAccessRevisionAsync(
            tenant, workspace, project, created.DraftId, changed.UpdatedUtc, ct))!;
        latest.Document.QuestionAnswers.Should().BeEmpty();
        latest.Document.QuestionAnswers["cost"] = "current";
        DraftRequestResponse written = (await repository.UpdateAtAccessRevisionAsync(latest, ct))!;
        written.Document.QuestionAnswers["cost"].Should().Be("current");
        written.UpdatedUtc.Should().BeAfter(changed.UpdatedUtc);
    }
}
