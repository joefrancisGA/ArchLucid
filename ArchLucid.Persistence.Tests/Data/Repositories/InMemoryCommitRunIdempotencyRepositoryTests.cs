using ArchLucid.Persistence.Data.Repositories;

using FluentAssertions;

namespace ArchLucid.Persistence.Tests.Data.Repositories;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class InMemoryCommitRunIdempotencyRepositoryTests
{
    [Fact]
    public async Task TryInsert_then_TryGet_round_trips_fingerprint()
    {
        InMemoryCommitRunIdempotencyRepository sut = new();
        Guid tenantId = Guid.Parse("11111111-1111-1111-1111-111111111111");
        Guid workspaceId = Guid.Parse("22222222-2222-2222-2222-222222222222");
        Guid projectId = Guid.Parse("33333333-3333-3333-3333-333333333333");
        byte[] keyHash = [0x01, 0x02];
        byte[] fingerprint = [0xAA, 0xBB];

        bool inserted = await sut.TryInsertAsync(
            tenantId,
            workspaceId,
            projectId,
            "run-1",
            keyHash,
            fingerprint,
            CancellationToken.None);

        inserted.Should().BeTrue();

        CommitRunIdempotencyLookup? lookup = await sut.TryGetAsync(
            tenantId,
            workspaceId,
            projectId,
            "run-1",
            keyHash,
            CancellationToken.None);

        lookup.Should().NotBeNull();
        lookup!.RequestFingerprint.Should().Equal(fingerprint);
        lookup.RequestFingerprint.Should().NotBeSameAs(fingerprint);
    }

    [Fact]
    public async Task TryInsert_returns_false_for_duplicate_key()
    {
        InMemoryCommitRunIdempotencyRepository sut = new();
        Guid tenantId = Guid.NewGuid();
        Guid workspaceId = Guid.NewGuid();
        Guid projectId = Guid.NewGuid();
        byte[] keyHash = [0x10];
        byte[] fingerprint = [0x20];

        (await sut.TryInsertAsync(tenantId, workspaceId, projectId, "run-dup", keyHash, fingerprint, CancellationToken.None))
            .Should().BeTrue();
        (await sut.TryInsertAsync(tenantId, workspaceId, projectId, "run-dup", keyHash, [0x99], CancellationToken.None))
            .Should().BeFalse();
    }

    [Fact]
    public async Task TryGet_returns_null_when_key_missing()
    {
        InMemoryCommitRunIdempotencyRepository sut = new();

        CommitRunIdempotencyLookup? lookup = await sut.TryGetAsync(
            Guid.NewGuid(),
            Guid.NewGuid(),
            Guid.NewGuid(),
            "missing",
            [0x01],
            CancellationToken.None);

        lookup.Should().BeNull();
    }

    [Fact]
    public async Task TryGet_throws_when_idempotency_hash_null()
    {
        InMemoryCommitRunIdempotencyRepository sut = new();

        Func<Task> act = async () =>
            await sut.TryGetAsync(Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid(), "run", null!, CancellationToken.None);

        await act.Should().ThrowAsync<ArgumentNullException>();
    }

    [Fact]
    public async Task TryInsert_throws_when_required_arguments_null()
    {
        InMemoryCommitRunIdempotencyRepository sut = new();
        Guid tenantId = Guid.NewGuid();
        Guid workspaceId = Guid.NewGuid();
        Guid projectId = Guid.NewGuid();
        byte[] keyHash = [0x01];

        Func<Task> missingFingerprint = async () =>
            await sut.TryInsertAsync(tenantId, workspaceId, projectId, "run", keyHash, null!, CancellationToken.None);

        await missingFingerprint.Should().ThrowAsync<ArgumentNullException>();
    }
}
