using ArchLucid.Core.Audit;
using ArchLucid.Persistence.Audit;

namespace ArchLucid.Persistence.Tests.Contracts;

/// <summary>
///     Runs <see cref="AuditRepositoryContractTests" /> against <see cref="InMemoryAuditRepository" />.
/// </summary>
[Trait("Category", "Unit")]
public sealed class InMemoryAuditRepositoryContractTests : AuditRepositoryContractTests
{
    protected override IAuditRepository CreateRepository()
    {
        return new InMemoryAuditRepository();
    }

    [Fact]
    public async Task FullReadsAndAppendDoNotShareMutableStoredEvents()
    {
        IAuditRepository repository = CreateRepository();
        AuditEvent entry = new()
        {
            TenantId = Guid.NewGuid(),
            WorkspaceId = Guid.NewGuid(),
            ProjectId = Guid.NewGuid(),
            EventType = "Original",
            DataJson = """{"status":"original"}"""
        };
        Guid workspaceId = entry.WorkspaceId;
        CancellationToken ct = CancellationToken.None;

        await repository.AppendAsync(entry, ct);
        entry.WorkspaceId = Guid.NewGuid();
        entry.EventType = "Changed by writer";

        AuditEventFilter filter = new() { IncludeDataJson = true };
        AuditEvent read = Assert.Single(await repository.GetFilteredAsync(
            entry.TenantId, workspaceId, entry.ProjectId, filter, ct));
        Assert.Equal("Original", read.EventType);
        read.DataJson = "{}";

        AuditEvent exported = Assert.Single(await repository.GetFilteredExportAsync(
            entry.TenantId, workspaceId, entry.ProjectId, filter, ct));
        Assert.Equal("""{"status":"original"}""", exported.DataJson);
        exported.EventType = "Changed by exporter";

        AuditEvent original = Assert.Single(await repository.GetExportAsync(
            entry.TenantId, workspaceId, entry.ProjectId, entry.OccurredUtc.AddDays(-1), entry.OccurredUtc.AddDays(1), 1, ct));
        Assert.Equal("Original", original.EventType);
    }
}
