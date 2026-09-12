using ArchLucid.Contracts.InfraEvidence.DiagramPeel;
using ArchLucid.Core.Diagrams;
using ArchLucid.Persistence.Diagrams;

using FluentAssertions;

namespace ArchLucid.Persistence.Tests.Diagrams;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class InMemoryDiagramPeelCatalogRepositoryTests
{
    [Fact]
    public async Task Bootstrapper_seeds_default_rows_when_empty()
    {
        InMemoryDiagramPeelCatalogRepository repository = new();
        DiagramPeelCatalogBootstrapper bootstrapper = new(repository);

        await bootstrapper.EnsureSeededAsync(CancellationToken.None);

        int count = await repository.CountAsync(CancellationToken.None);
        count.Should().Be(DiagramPeelCatalogDefaultSeed.BuildEntries().Count);

        IReadOnlyList<DiagramPeelCatalogEntry> entries = await repository.ListEntriesAsync(CancellationToken.None);
        entries.Should().Contain(entry =>
            string.Equals(entry.ArmResourceType, "Microsoft.Network/networkInterfaces", StringComparison.Ordinal)
            && entry.PeelRank == 30);
    }
}
