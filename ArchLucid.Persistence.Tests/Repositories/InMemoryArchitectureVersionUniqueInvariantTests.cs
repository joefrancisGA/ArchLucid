using ArchLucid.Contracts.Architecture;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Repositories;

using FluentAssertions;

namespace ArchLucid.Persistence.Tests.Repositories;

[Trait("Category", "Unit")]
public sealed class InMemoryArchitectureVersionUniqueInvariantTests
{
    private static ScopeContext NewScope() => new()
    {
        TenantId = Guid.NewGuid(),
        WorkspaceId = Guid.NewGuid(),
        ProjectId = Guid.NewGuid(),
    };

    [Fact]
    public async Task Same_architecture_version_number_with_distinct_hash_is_rejected()
    {
        InMemoryArchitectureVersionRepository repository = new();
        ScopeContext scope = NewScope();
        Guid architectureId = Guid.NewGuid();

        await repository.CreateAsync(scope, Version(architectureId, 1, 1));

        Func<Task> duplicate = async () => await repository.CreateAsync(
            scope, Version(architectureId, 1, 2));
        await duplicate.Should().ThrowAsync<InvalidOperationException>();

        (await repository.GetLatestVersionNumberAsync(scope, architectureId)).Should().Be(1);
        (await repository.ListByArchitectureIdAsync(scope, architectureId)).Should().ContainSingle();
    }

    [Fact]
    public async Task Same_architecture_content_hash_with_distinct_version_number_is_rejected()
    {
        InMemoryArchitectureVersionRepository repository = new();
        ScopeContext scope = NewScope();
        Guid architectureId = Guid.NewGuid();

        await repository.CreateAsync(scope, Version(architectureId, 1, 9));

        Func<Task> duplicate = async () => await repository.CreateAsync(
            scope, Version(architectureId, 2, 9));
        await duplicate.Should().ThrowAsync<InvalidOperationException>();

        (await repository.GetByContentHashAsync(scope, architectureId, Hash(9))).Should().NotBeNull();
        (await repository.ListByArchitectureIdAsync(scope, architectureId)).Should().ContainSingle();
    }

    [Fact]
    public async Task Concurrent_creates_with_same_number_admit_at_most_one_version()
    {
        InMemoryArchitectureVersionRepository repository = new();
        ScopeContext scope = NewScope();
        Guid architectureId = Guid.NewGuid();

        Task<bool>[] attempts = Enumerable.Range(1, 24)
            .Select(i => Task.Run(async () =>
            {
                try
                {
                    await repository.CreateAsync(scope, Version(architectureId, 1, (byte)i));
                    return true;
                }
                catch (InvalidOperationException)
                {
                    return false;
                }
            }))
            .ToArray();

        bool[] winners = await Task.WhenAll(attempts);
        winners.Count(result => result).Should().Be(1);
        (await repository.ListByArchitectureIdAsync(scope, architectureId)).Should().ContainSingle();
    }

    [Fact]
    public async Task Different_architectures_can_use_identical_version_numbers_and_content_hashes()
    {
        InMemoryArchitectureVersionRepository repository = new();
        ScopeContext scope = NewScope();
        Guid firstId = Guid.NewGuid();
        Guid secondId = Guid.NewGuid();

        await repository.CreateAsync(scope, Version(firstId, 1, 4));
        await repository.CreateAsync(scope, Version(secondId, 1, 4));

        (await repository.ListByArchitectureIdAsync(scope, firstId)).Should().ContainSingle();
        (await repository.ListByArchitectureIdAsync(scope, secondId)).Should().ContainSingle();
    }

    private static byte[] Hash(byte value) => Enumerable.Repeat(value, 32).ToArray();

    private static ArchitectureVersionRecord Version(Guid architectureId, int number, byte hash) => new()
    {
        ArchitectureId = architectureId,
        VersionNumber = number,
        ContentHashSha256 = Hash(hash),
        IntakeRequestHashSha256 = Hash(hash),
    };
}
