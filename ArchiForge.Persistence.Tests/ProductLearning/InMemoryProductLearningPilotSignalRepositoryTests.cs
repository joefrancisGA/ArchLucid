using ArchiForge.Contracts.ProductLearning;
using ArchiForge.Persistence.ProductLearning;

using FluentAssertions;

namespace ArchiForge.Persistence.Tests.ProductLearning;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class InMemoryProductLearningPilotSignalRepositoryTests
{
    private static readonly Guid TenantId = Guid.Parse("11111111-1111-1111-1111-111111111111");

    private static readonly Guid WorkspaceId = Guid.Parse("22222222-2222-2222-2222-222222222222");

    private static readonly Guid ProjectId = Guid.Parse("33333333-3333-3333-3333-333333333333");

    [Fact]
    public async Task Insert_then_list_returns_newest_first_with_stable_secondary_sort()
    {
        InMemoryProductLearningPilotSignalRepository repo = new();
        DateTime t0 = new(2026, 4, 1, 12, 0, 0, DateTimeKind.Utc);
        DateTime t1 = new(2026, 4, 1, 12, 0, 1, DateTimeKind.Utc);

        await repo.InsertAsync(
            new ProductLearningPilotSignalRecord
            {
                TenantId = TenantId,
                WorkspaceId = WorkspaceId,
                ProjectId = ProjectId,
                SubjectType = ProductLearningSubjectTypeValues.RunOutput,
                Disposition = ProductLearningDispositionValues.Trusted,
                RecordedUtc = t0,
                SignalId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
            },
            CancellationToken.None);

        await repo.InsertAsync(
            new ProductLearningPilotSignalRecord
            {
                TenantId = TenantId,
                WorkspaceId = WorkspaceId,
                ProjectId = ProjectId,
                SubjectType = ProductLearningSubjectTypeValues.ManifestArtifact,
                Disposition = ProductLearningDispositionValues.Rejected,
                PatternKey = "diagram.layout",
                RecordedUtc = t1,
                SignalId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
            },
            CancellationToken.None);

        IReadOnlyList<ProductLearningPilotSignalRecord> list =
            await repo.ListRecentForScopeAsync(TenantId, WorkspaceId, ProjectId, 10, CancellationToken.None);

        list.Should().HaveCount(2);
        list[0].Disposition.Should().Be(ProductLearningDispositionValues.Rejected);
        list[1].Disposition.Should().Be(ProductLearningDispositionValues.Trusted);
    }

    [Fact]
    public async Task Insert_assigns_id_and_utc_when_defaults()
    {
        InMemoryProductLearningPilotSignalRepository repo = new();

        await repo.InsertAsync(
            new ProductLearningPilotSignalRecord
            {
                TenantId = TenantId,
                WorkspaceId = WorkspaceId,
                ProjectId = ProjectId,
                SubjectType = ProductLearningSubjectTypeValues.Other,
                Disposition = ProductLearningDispositionValues.NeedsFollowUp,
            },
            CancellationToken.None);

        IReadOnlyList<ProductLearningPilotSignalRecord> list =
            await repo.ListRecentForScopeAsync(TenantId, WorkspaceId, ProjectId, 5, CancellationToken.None);

        list.Should().ContainSingle();
        list[0].SignalId.Should().NotBe(Guid.Empty);
        list[0].RecordedUtc.Should().BeAfter(DateTime.MinValue);
        list[0].TriageStatus.Should().Be(ProductLearningTriageStatusValues.Open);
    }

    [Fact]
    public async Task Insert_without_subject_throws()
    {
        InMemoryProductLearningPilotSignalRepository repo = new();

        Func<Task> act = async () => await repo.InsertAsync(
            new ProductLearningPilotSignalRecord
            {
                TenantId = TenantId,
                WorkspaceId = WorkspaceId,
                ProjectId = ProjectId,
                SubjectType = "",
                Disposition = ProductLearningDispositionValues.Trusted,
            },
            CancellationToken.None);

        await act.Should().ThrowAsync<ArgumentException>();
    }
}
