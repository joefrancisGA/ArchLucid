using ArchLucid.Contracts.Architecture;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Repositories;

using FluentAssertions;

namespace ArchLucid.Persistence.Tests.Repositories;

[Trait("Category", "Unit")]
public sealed class InMemoryArchitectureIdentityRepositoryTests
{
    private static readonly ScopeContext Scope = new()
    {
        TenantId = Guid.Parse("11111111-1111-1111-1111-111111111111"),
        WorkspaceId = Guid.Parse("22222222-2222-2222-2222-222222222222"),
        ProjectId = Guid.Parse("33333333-3333-3333-3333-333333333333"),
    };

    [Fact]
    public async Task CreateAsync_requires_display_name_and_round_trips_name()
    {
        InMemoryArchitectureIdentityRepository repository = new();

        ArchitectureIdentityRecord created = await repository.CreateAsync(
            Scope,
            "Vertex platform",
            "model-1");

        created.DisplayName.Should().Be("Vertex platform");
        created.CurrentModelId.Should().Be("model-1");

        ArchitectureIdentityRecord? loaded = await repository.GetByIdAsync(Scope, created.ArchitectureId);

        loaded.Should().NotBeNull();
        loaded!.DisplayName.Should().Be("Vertex platform");
    }

    [Fact]
    public async Task CreateAsync_rejects_blank_display_name()
    {
        InMemoryArchitectureIdentityRepository repository = new();

        Func<Task> act = () => repository.CreateAsync(Scope, "   ", "model-1");

        await act.Should().ThrowAsync<ArgumentException>();
    }
}
