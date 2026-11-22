using ArchLucid.Contracts.Architecture;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Repositories;

namespace ArchLucid.Application.Tests.Persistence;

public sealed class InMemoryArchitectureVersionRepositoryTests
{
    [Fact]
    public async Task CreateAndReads_ReturnIndependentSnapshots()
    {
        var repository = new InMemoryArchitectureVersionRepository();
        var scope = new ScopeContext { TenantId = Guid.NewGuid(), WorkspaceId = Guid.NewGuid(), ProjectId = Guid.NewGuid() };
        var input = new ArchitectureVersionRecord
        {
            ArchitectureId = Guid.NewGuid(),
            VersionNumber = 1,
            ContentHashSha256 = [1, 2, 3],
            IntakeRequestHashSha256 = [4, 5, 6],
            SourceRequestId = "original",
        };

        ArchitectureVersionRecord created = await repository.CreateAsync(scope, input, CancellationToken.None);
        created.SourceRequestId = "mutated";
        created.ContentHashSha256[0] = 9;

        ArchitectureVersionRecord stored = (await repository.GetByIdAsync(
            scope,
            created.ArchitectureVersionId,
            CancellationToken.None))!;
        Assert.Equal("original", stored.SourceRequestId);
        Assert.Equal(1, stored.ContentHashSha256[0]);

        stored.IntakeRequestHashSha256[0] = 9;
        ArchitectureVersionRecord reread = (await repository.GetByContentHashAsync(
            scope,
            input.ArchitectureId,
            input.ContentHashSha256,
            CancellationToken.None))!;
        Assert.Equal(4, reread.IntakeRequestHashSha256[0]);
    }
}
