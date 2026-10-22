using ArchLucid.Application.Governance.FindingDisposition;
using ArchLucid.Application.Integrations.Itsm;
using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Governance;
using ArchLucid.Persistence.Integrations;

using FluentAssertions;

using Microsoft.Extensions.Logging.Abstractions;

using Moq;

namespace ArchLucid.Application.Tests.Integrations.Itsm;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class ItsmInboundDispositionSyncTests
{
    private static readonly Guid TenantA = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");

    private static readonly Guid WorkspaceA = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");

    private static readonly Guid ProjectA = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc");

    private const string PointerToken = "cG9pbnRlci10b2tlbg==";

    [Fact]
    public async Task TryRecordFromWebhookAsync_when_disposition_unmapped_skips_without_history_lookup()
    {
        Mock<IFindingDispositionService> dispositionService = new();
        ItsmInboundDispositionSync sut =
            new(dispositionService.Object, NullLogger<ItsmInboundDispositionSync>.Instance);

        ItsmInboundDispositionSyncResult result = await sut.TryRecordFromWebhookAsync(
            CreateRow(),
            mappedDisposition: null,
            "Done",
            "jira-webhook",
            PointerToken,
            inspectLatestDisposition: null,
            CancellationToken.None);

        result.WasRecorded.Should().BeFalse();
        result.SkipReason.Should().Be("disposition_unmapped");
        dispositionService.Verify(
            s => s.ListHistoryAsync(It.IsAny<Core.Scoping.ScopeContext>(), It.IsAny<string>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task TryRecordFromWebhookAsync_when_inspect_latest_disposition_matches_skips_record()
    {
        Mock<IFindingDispositionService> dispositionService = new();
        ItsmInboundDispositionSync sut =
            new(dispositionService.Object, NullLogger<ItsmInboundDispositionSync>.Instance);

        ItsmInboundDispositionSyncResult result = await sut.TryRecordFromWebhookAsync(
            CreateRow(),
            FindingDisposition.Remediated,
            "Done",
            "jira-webhook",
            PointerToken,
            FindingDisposition.Remediated,
            CancellationToken.None);

        result.WasRecorded.Should().BeFalse();
        result.SkipReason.Should().Be("disposition_unchanged");
        dispositionService.Verify(
            s => s.RecordAsync(It.IsAny<RecordFindingDispositionRequest>(), It.IsAny<Core.Scoping.ScopeContext>(), It.IsAny<string>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task TryRecordFromWebhookAsync_records_remediated_disposition_with_cas_token()
    {
        Mock<IFindingDispositionService> dispositionService = new();
        dispositionService
            .Setup(s => s.RecordAsync(
                It.Is<RecordFindingDispositionRequest>(r =>
                    r.FindingId == "f1"
                    && r.Disposition == FindingDisposition.Remediated
                    && r.ExpectedCurrentDispositionRowVersionBase64 == PointerToken),
                It.IsAny<Core.Scoping.ScopeContext>(),
                "jira-webhook",
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(
                new FindingDispositionEventDto
                {
                    EventId = Guid.Parse("22222222-2222-2222-2222-222222222222"),
                    FindingId = "f1",
                    Disposition = FindingDisposition.Remediated,
                    ReviewerUserId = "jira-webhook",
                    OccurredAtUtc = DateTimeOffset.UtcNow,
                });
        ItsmInboundDispositionSync sut =
            new(dispositionService.Object, NullLogger<ItsmInboundDispositionSync>.Instance);

        ItsmInboundDispositionSyncResult result = await sut.TryRecordFromWebhookAsync(
            CreateRow(),
            FindingDisposition.Remediated,
            "Done",
            "jira-webhook",
            PointerToken,
            FindingDisposition.Accepted,
            CancellationToken.None);

        result.WasRecorded.Should().BeTrue();
        result.Disposition.Should().Be(FindingDisposition.Remediated);
        result.DispositionEventId.Should().Be(Guid.Parse("22222222-2222-2222-2222-222222222222"));
    }

    [Fact]
    public async Task TryRecordFromWebhookAsync_when_cas_conflict_returns_disposition_conflict_without_throwing()
    {
        Mock<IFindingDispositionService> dispositionService = new();
        dispositionService
            .Setup(s => s.RecordAsync(
                It.IsAny<RecordFindingDispositionRequest>(),
                It.IsAny<Core.Scoping.ScopeContext>(),
                "jira-webhook",
                It.IsAny<CancellationToken>()))
            .ThrowsAsync(
                new FindingDispositionConflictException(
                    "f1",
                    new FindingDispositionConflictDetail
                    {
                        EventId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
                        FindingId = "f1",
                        Disposition = FindingDisposition.Accepted,
                        ReviewerUserId = "alice",
                        OccurredAtUtc = DateTimeOffset.UtcNow,
                        CurrentDispositionRowVersionBase64 = PointerToken,
                    }));
        ItsmInboundDispositionSync sut =
            new(dispositionService.Object, NullLogger<ItsmInboundDispositionSync>.Instance);

        ItsmInboundDispositionSyncResult result = await sut.TryRecordFromWebhookAsync(
            CreateRow(),
            FindingDisposition.Remediated,
            "Done",
            "jira-webhook",
            PointerToken,
            FindingDisposition.Accepted,
            CancellationToken.None);

        result.WasRecorded.Should().BeFalse();
        result.IsDispositionConflict.Should().BeTrue();
        result.SkipReason.Should().Be("disposition_conflict");
        result.ConflictDetail.Should().NotBeNull();
        result.ConflictDetail!.Disposition.Should().Be(FindingDisposition.Accepted);
    }

    [Fact]
    public async Task TryRecordFromWebhookAsync_when_history_lookup_fails_skips_without_throwing()
    {
        Mock<IFindingDispositionService> dispositionService = new();
        dispositionService
            .Setup(s => s.ListHistoryAsync(It.IsAny<Core.Scoping.ScopeContext>(), "f1", It.IsAny<CancellationToken>()))
            .ThrowsAsync(new InvalidOperationException("history store unavailable"));
        ItsmInboundDispositionSync sut =
            new(dispositionService.Object, NullLogger<ItsmInboundDispositionSync>.Instance);

        ItsmInboundDispositionSyncResult result = await sut.TryRecordFromWebhookAsync(
            CreateRow(),
            FindingDisposition.Remediated,
            "Done",
            "jira-webhook",
            currentDispositionRowVersionBase64: null,
            inspectLatestDisposition: null,
            CancellationToken.None);

        result.WasRecorded.Should().BeFalse();
        result.SkipReason.Should().Be("disposition_sync_failed");
        dispositionService.Verify(
            s => s.RecordAsync(It.IsAny<RecordFindingDispositionRequest>(), It.IsAny<Core.Scoping.ScopeContext>(), It.IsAny<string>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task TryRecordFromWebhookAsync_when_record_fails_with_non_argument_exception_skips_without_throwing()
    {
        Mock<IFindingDispositionService> dispositionService = new();
        dispositionService
            .Setup(s => s.RecordAsync(
                It.IsAny<RecordFindingDispositionRequest>(),
                It.IsAny<Core.Scoping.ScopeContext>(),
                "jira-webhook",
                It.IsAny<CancellationToken>()))
            .ThrowsAsync(new InvalidOperationException("record store unavailable"));
        ItsmInboundDispositionSync sut =
            new(dispositionService.Object, NullLogger<ItsmInboundDispositionSync>.Instance);

        ItsmInboundDispositionSyncResult result = await sut.TryRecordFromWebhookAsync(
            CreateRow(),
            FindingDisposition.Remediated,
            "Done",
            "jira-webhook",
            PointerToken,
            FindingDisposition.Accepted,
            CancellationToken.None);

        result.WasRecorded.Should().BeFalse();
        result.SkipReason.Should().Be("disposition_sync_failed");
    }

    private static ItsmFindingCorrelationRecord CreateRow() =>
        new()
        {
            TenantId = TenantA,
            WorkspaceId = WorkspaceA,
            ProjectId = ProjectA,
            FindingId = "f1",
            Provider = "Jira",
            ExternalKey = "KEY-1",
        };
}
