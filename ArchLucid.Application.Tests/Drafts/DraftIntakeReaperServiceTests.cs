using ArchLucid.Application.Drafts;
using ArchLucid.Contracts.Drafts;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Configuration;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Models;

using FluentAssertions;

using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;

using Moq;

namespace ArchLucid.Application.Tests.Drafts;

[Trait("Category", "Unit")]
public sealed class DraftIntakeReaperServiceTests
{
    [Fact]
    public async Task PurgeExpiredTerminalDraftsAsync_DeletesAbandonedRows_AndAudits()
    {
        InMemoryDraftRequestRepository repository = new();
        Guid tenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
        Guid workspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");
        Guid projectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc");

        DraftRequestResponse created = await repository.CreateAsync(
            tenantId,
            workspaceId,
            projectId,
            "operator-1",
            new DraftRequestDocument { FreeTextIntent = "Build a workflow for analysts." },
            CancellationToken.None);

        await repository.UpdateAsync(
            tenantId,
            workspaceId,
            projectId,
            created.DraftId,
            DraftRequestStatus.Abandoned,
            created.Document,
            redirectReason: null,
            spawnedRunId: null,
            CancellationToken.None);

        Mock<IPlatformAuditRepository> platformAudit = new();
        PlatformAuditEvent? captured = null;
        platformAudit
            .Setup(p => p.AppendAsync(It.IsAny<PlatformAuditEvent>(), It.IsAny<CancellationToken>()))
            .Callback<PlatformAuditEvent, CancellationToken>((evt, _) => captured = evt)
            .Returns(Task.CompletedTask);

        DraftIntakeReaperService service = new(
            repository,
            platformAudit.Object,
            new FixedDraftIntakeReaperOptionsMonitor(new DraftIntakeReaperOptions { BatchSize = 100 }),
            NullLogger<DraftIntakeReaperService>.Instance);

        DateTimeOffset cutoff = DateTimeOffset.UtcNow.AddDays(1);

        DraftIntakeReaperResult result =
            await service.PurgeExpiredTerminalDraftsAsync(cutoff, CancellationToken.None);

        result.DraftsDeleted.Should().Be(1);
        (await repository.GetAsync(tenantId, workspaceId, projectId, created.DraftId, CancellationToken.None))
            .Should().BeNull();
        captured.Should().NotBeNull();
        captured!.EventType.Should().Be(AuditEventTypes.DraftIntakeTerminalPurged);
    }

    [Fact]
    public async Task PurgeExpiredTerminalDraftsAsync_SkipsActiveDraftingRows()
    {
        InMemoryDraftRequestRepository repository = new();
        Guid tenantId = Guid.Parse("11111111-1111-1111-1111-111111111111");
        Guid workspaceId = Guid.Parse("22222222-2222-2222-2222-222222222222");
        Guid projectId = Guid.Parse("33333333-3333-3333-3333-333333333333");

        DraftRequestResponse created = await repository.CreateAsync(
            tenantId,
            workspaceId,
            projectId,
            "operator-1",
            new DraftRequestDocument { FreeTextIntent = "Build a workflow for analysts." },
            CancellationToken.None);

        Mock<IPlatformAuditRepository> platformAudit = new();

        DraftIntakeReaperService service = new(
            repository,
            platformAudit.Object,
            new FixedDraftIntakeReaperOptionsMonitor(new DraftIntakeReaperOptions { BatchSize = 100 }),
            NullLogger<DraftIntakeReaperService>.Instance);

        DateTimeOffset cutoff = DateTimeOffset.UtcNow.AddDays(1);

        DraftIntakeReaperResult result =
            await service.PurgeExpiredTerminalDraftsAsync(cutoff, CancellationToken.None);

        result.DraftsDeleted.Should().Be(0);
        (await repository.GetAsync(tenantId, workspaceId, projectId, created.DraftId, CancellationToken.None))
            .Should().NotBeNull();
        platformAudit.Verify(
            p => p.AppendAsync(It.IsAny<PlatformAuditEvent>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    private sealed class FixedDraftIntakeReaperOptionsMonitor(DraftIntakeReaperOptions value) : IOptionsMonitor<DraftIntakeReaperOptions>
    {
        public DraftIntakeReaperOptions CurrentValue => value;

        public DraftIntakeReaperOptions Get(string? name) => value;

        public IDisposable OnChange(Action<DraftIntakeReaperOptions, string?> listener) => NullDisposable.Instance;

        private sealed class NullDisposable : IDisposable
        {
            public static readonly NullDisposable Instance = new();

            public void Dispose()
            {
            }
        }
    }
}
