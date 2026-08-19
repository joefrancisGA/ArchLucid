using ArchLucid.Core.Pilots;
using ArchLucid.Persistence.Pilots;

using FluentAssertions;

namespace ArchLucid.Persistence.Tests.Pilots;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class InMemoryPilotCloseoutRepositoryTests
{
    [Fact]
    public async Task InsertAsync_completes_for_valid_record()
    {
        InMemoryPilotCloseoutRepository sut = new();
        PilotCloseoutRecord record = new()
        {
            CloseoutId = Guid.NewGuid(),
            TenantId = Guid.NewGuid(),
            WorkspaceId = Guid.NewGuid(),
            ProjectId = Guid.NewGuid(),
            SpeedScore = 4,
            ManifestPackageScore = 5,
            TraceabilityScore = 5,
            CreatedUtc = DateTimeOffset.UtcNow,
        };

        Func<Task> act = async () => await sut.InsertAsync(record, CancellationToken.None);

        await act.Should().NotThrowAsync();
    }

    [Fact]
    public async Task InsertAsync_throws_when_record_null()
    {
        InMemoryPilotCloseoutRepository sut = new();

        Func<Task> act = async () => await sut.InsertAsync(null!, CancellationToken.None);

        await act.Should().ThrowAsync<ArgumentNullException>();
    }
}
