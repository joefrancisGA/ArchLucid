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
}
