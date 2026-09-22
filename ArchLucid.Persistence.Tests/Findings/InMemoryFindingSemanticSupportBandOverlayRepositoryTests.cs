using ArchLucid.Contracts.Findings;
using ArchLucid.Core.Persistence;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Findings;

using FluentAssertions;

namespace ArchLucid.Persistence.Tests.Findings;

[Trait("Category", "Unit")]
[Trait("Suite", "Persistence")]
public sealed class InMemoryFindingSemanticSupportBandOverlayRepositoryTests
{
    [Fact]
    public async Task FreezeSnapshot_blocks_further_upserts()
    {
        InMemoryFindingSemanticSupportBandOverlayRepository repository = new();
        Guid snapshotId = Guid.NewGuid();
        ScopeContext scope = new()
        {
            TenantId = Guid.NewGuid(),
            WorkspaceId = Guid.NewGuid(),
            ProjectId = Guid.NewGuid(),
        };

        FindingSemanticSupportBandOverlayRecord overlay = new()
        {
            FindingId = "finding-1",
            Band = FindingSemanticSupportBand.Unchecked,
            ScorerVersion = "as057-v1",
        };

        await repository.UpsertAsync(snapshotId, scope, overlay, CancellationToken.None);
        await repository.FreezeSnapshotAsync(snapshotId, scope, CancellationToken.None);

        FindingSemanticSupportBandOverlayRecord rescore = new()
        {
            FindingId = "finding-1",
            Band = FindingSemanticSupportBand.Supported,
            ScorerVersion = "as057-v1",
        };

        Func<Task> act = () => repository.UpsertAsync(snapshotId, scope, rescore, CancellationToken.None);

        await act.Should().ThrowAsync<InvalidOperationException>();
    }
}
