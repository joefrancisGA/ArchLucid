using ArchLucid.Application.InfraEvidence.SecureNowQuestionDispositions;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.InfraEvidence;

using FluentAssertions;

using Moq;

namespace ArchLucid.Application.Tests.InfraEvidence;

[Trait("Category", "Unit")]
[Trait("Suite", "Application")]
public sealed class SecureNowQuestionDispositionServiceTests
{
    private static readonly ScopeContext Scope = new()
    {
        TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
        WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
        ProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
    };

    private static readonly Guid SnapshotId =
        Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd");

    [Fact]
    public async Task Ignore_is_returned_for_a_later_snapshot_of_the_same_subscription_and_resource()
    {
        InMemoryDispositionRepository repository = new();
        SecureNowQuestionDispositionService sut = CreateSut(repository);

        SecureNowQuestionDispositionMutationResult ignored = await sut.IgnoreAsync(
            Scope,
            SnapshotId,
            CreateWriteRequest("SUB-1", "/subscriptions/SUB-1/resourceGroups/RG/providers/Microsoft.Compute/virtualMachines/VM1"),
            "actor");

        ignored.Succeeded.Should().BeTrue();

        IReadOnlyList<SecureNowQuestionDispositionRecord> rows = await sut.ListAsync(
            Scope,
            Guid.Parse("eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee"));

        rows.Should().ContainSingle();
        rows[0].Status.Should().Be(SecureNowQuestionDispositionStatus.Ignored);
    }

    [Fact]
    public async Task Resource_identity_is_case_insensitive()
    {
        InMemoryDispositionRepository repository = new();
        SecureNowQuestionDispositionService sut = CreateSut(repository);

        await sut.IgnoreAsync(
            Scope,
            SnapshotId,
            CreateWriteRequest("sub-1", "/subscriptions/sub-1/resourceGroups/rg/resource"),
            "actor");

        SecureNowQuestionDispositionRecord? row = await repository.TryGetByIdentityAsync(
            Scope.TenantId,
            "SUB-1",
            "/SUBSCRIPTIONS/SUB-1/RESOURCEGROUPS/RG/RESOURCE",
            "orphan-still-needed@v1");

        row.Should().NotBeNull();
    }

    [Fact]
    public async Task Different_subscription_does_not_see_the_row()
    {
        InMemoryDispositionRepository repository = new();
        SecureNowQuestionDispositionService sut = CreateSut(repository);

        await sut.IgnoreAsync(
            Scope,
            SnapshotId,
            CreateWriteRequest("sub-1", "/subscriptions/sub-1/resource"),
            "actor");

        IReadOnlyList<SecureNowQuestionDispositionRecord> rows = await sut.ListAsync(
            Scope,
            SnapshotId,
            CancellationToken.None);

        rows.Should().ContainSingle();
        rows[0].SubscriptionId.Should().Be("sub-1");
    }

[Fact]
public async Task Foreign_snapshot_cannot_read_or_write()
{
    InMemoryDispositionRepository repository = new();
    SecureNowQuestionDispositionService sut = CreateSut(repository, snapshotOwned: false);

    SecureNowQuestionDispositionMutationResult result = await sut.IgnoreAsync(
        Scope,
        SnapshotId,
        CreateWriteRequest("sub-1", "/subscriptions/sub-1/resource"),
        "actor");
    IReadOnlyList<SecureNowQuestionDispositionRecord> rows = await sut.ListAsync(Scope, SnapshotId);

    result.Succeeded.Should().BeFalse();
    result.ErrorMessage.Should().Be("Snapshot was not found.");
    repository.Rows.Should().BeEmpty();
    rows.Should().BeEmpty();
}

    [Fact]
    public async Task Ignore_requires_reason_and_expiration_cannot_exceed_ninety_days()
    {
        InMemoryDispositionRepository repository = new();
        SecureNowQuestionDispositionService sut = CreateSut(repository);

        SecureNowQuestionDispositionMutationResult noReason = await sut.IgnoreAsync(
            Scope,
            SnapshotId,
            CreateWriteRequest("sub-1", "/subscriptions/sub-1/resource") with { Reason = " " },
            "actor");
        SecureNowQuestionDispositionMutationResult tooLong = await sut.IgnoreAsync(
            Scope,
            SnapshotId,
            CreateWriteRequest("sub-1", "/subscriptions/sub-1/resource") with
            {
                ExpirationUtc = DateTime.UtcNow.AddDays(91),
            },
            "actor");

        noReason.ErrorMessage.Should().Be("Reason is required.");
        tooLong.ErrorMessage.Should().Be("ExpirationUtc cannot be more than 90 days ahead.");
    }

    [Fact]
    public async Task Reopen_sets_open_and_appends_an_audit_entry()
    {
        InMemoryDispositionRepository repository = new();
        SecureNowQuestionDispositionService sut = CreateSut(repository);
        SecureNowQuestionDispositionWriteRequest request =
            CreateWriteRequest("sub-1", "/subscriptions/sub-1/resource");

        await sut.IgnoreAsync(Scope, SnapshotId, request, "actor");
        SecureNowQuestionDispositionMutationResult reopened = await sut.ReopenAsync(
            Scope,
            SnapshotId,
            new SecureNowQuestionDispositionReopenRequest
            {
                SubscriptionId = request.SubscriptionId,
                ResourceId = request.ResourceId,
                QuestionKey = request.QuestionKey,
                Reason = "Evidence changed.",
            },
            "reviewer");

        reopened.Succeeded.Should().BeTrue();
        reopened.Record!.Status.Should().Be(SecureNowQuestionDispositionStatus.Open);
        reopened.Record.AuditEntries.Should().ContainSingle(entry =>
            entry.Action == "Reopened" && entry.Reason == "Evidence changed.");
    }

    [Fact]
    public async Task Question_key_requires_a_positive_version()
    {
        InMemoryDispositionRepository repository = new();
        SecureNowQuestionDispositionService sut = CreateSut(repository);

        SecureNowQuestionDispositionMutationResult result = await sut.IgnoreAsync(
            Scope,
            SnapshotId,
            CreateWriteRequest("sub-1", "/subscriptions/sub-1/resource") with
            {
                QuestionKey = "orphan-still-needed",
            },
            "actor");

        result.ErrorMessage.Should().Be("QuestionKey must end with a positive version such as @v1.");
    }

    private static SecureNowQuestionDispositionService CreateSut(
        InMemoryDispositionRepository repository,
        bool snapshotOwned = true)
    {
        Mock<IAzureInventorySnapshotRepository> snapshots = new();
        snapshots
            .Setup(item => item.TryGetSnapshotDetailAsync(
                Scope,
                It.IsAny<Guid>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(
                (ScopeContext _, Guid _, CancellationToken _) => snapshotOwned
                    ? new AzureInventorySnapshotDetailReadModel
                    {
                        Header = new AzureInventorySnapshotRecord
                        {
                            SubscriptionId = "sub-1",
                            TenantId = Scope.TenantId,
                            WorkspaceId = Scope.WorkspaceId,
                            ProjectId = Scope.ProjectId,
                        },
                    }
                    : null);

        Mock<IAuditService> audit = new();
        audit
            .Setup(item => item.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        return new SecureNowQuestionDispositionService(repository, snapshots.Object, audit.Object);
    }

    private static SecureNowQuestionDispositionWriteRequest CreateWriteRequest(
        string subscriptionId,
        string resourceId) =>
        new()
        {
            SubscriptionId = subscriptionId,
            ResourceId = resourceId,
            QuestionKey = "orphan-still-needed@v1",
            Source = SecureNowQuestionSource.InventoryEvidence,
            ScopeKind = SecureNowQuestionScopeKind.Resource,
            AnswerCode = "Keep",
            AnswerText = "Keep it.",
            Reason = "Reviewed by operator.",
            EvidenceFingerprint = "fingerprint-1",
        };

    private sealed class InMemoryDispositionRepository : ISecureNowQuestionDispositionRepository
    {
        public List<SecureNowQuestionDispositionRecord> Rows { get; } = [];

        public Task<IReadOnlyList<SecureNowQuestionDispositionRecord>> ListByTenantAndSubscriptionAsync(
            Guid tenantId,
            string subscriptionId,
            CancellationToken cancellationToken = default) =>
            Task.FromResult<IReadOnlyList<SecureNowQuestionDispositionRecord>>(
                Rows
                    .Where(row => row.TenantId == tenantId
                                  && string.Equals(row.SubscriptionId, subscriptionId, StringComparison.OrdinalIgnoreCase))
                    .ToList());

        public Task<SecureNowQuestionDispositionRecord?> TryGetByIdentityAsync(
            Guid tenantId,
            string subscriptionId,
            string resourceId,
            string questionKey,
            CancellationToken cancellationToken = default) =>
            Task.FromResult(
                Rows.SingleOrDefault(row =>
                    row.TenantId == tenantId
                    && string.Equals(row.SubscriptionId, subscriptionId, StringComparison.OrdinalIgnoreCase)
                    && string.Equals(row.ResourceId, resourceId, StringComparison.OrdinalIgnoreCase)
                    && string.Equals(row.QuestionKey, questionKey, StringComparison.Ordinal)));

        public Task UpsertAsync(
            SecureNowQuestionDispositionRecord record,
            CancellationToken cancellationToken = default)
        {
            Rows.RemoveAll(row =>
                row.TenantId == record.TenantId
                && row.SubscriptionId == record.SubscriptionId
                && row.ResourceId == record.ResourceId
                && row.QuestionKey == record.QuestionKey);
            Rows.Add(record);
            return Task.CompletedTask;
        }
    }
}
