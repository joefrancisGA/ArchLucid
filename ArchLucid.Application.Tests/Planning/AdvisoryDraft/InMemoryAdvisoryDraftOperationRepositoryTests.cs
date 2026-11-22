using ArchLucid.Contracts.Operations;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Planning;

namespace ArchLucid.Application.Tests.Planning.AdvisoryDraft;

public sealed class InMemoryAdvisoryDraftOperationRepositoryTests
{
    [Fact]
    public async Task InsertAndGet_ReturnIndependentRowSnapshots()
    {
        var repository = new InMemoryAdvisoryDraftOperationRepository();
        AdvisoryDraftOperationRow row = CreateRow();

        await repository.TryInsertPendingAsync(row, CancellationToken.None);
        row.StepLabel = "mutated without update";

        AdvisoryDraftOperationRow stored = (await repository.GetAsync(
            row.TenantId,
            row.WorkspaceId,
            row.ProjectId,
            row.OperationId,
            CancellationToken.None))!;
        stored.StepLabel = "mutated read";

        AdvisoryDraftOperationRow reread = (await repository.GetAsync(
            row.TenantId,
            row.WorkspaceId,
            row.ProjectId,
            row.OperationId,
            CancellationToken.None))!;
        Assert.Equal("queued", reread.StepLabel);
    }

    private static AdvisoryDraftOperationRow CreateRow() =>
        new()
        {
            TenantId = Guid.NewGuid(),
            WorkspaceId = Guid.NewGuid(),
            ProjectId = Guid.NewGuid(),
            OperationId = Guid.NewGuid(),
            State = OperationState.Pending,
            StepLabel = "queued",
            CreatedUtc = DateTimeOffset.UtcNow,
            HeartbeatUtc = DateTimeOffset.UtcNow,
        };
}
