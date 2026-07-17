using ArchLucid.Application.Notifications.Email;
using ArchLucid.Application.Support;
using ArchLucid.Contracts.Support;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Support;

using FluentAssertions;

using Microsoft.Extensions.Logging.Abstractions;

using Moq;

namespace ArchLucid.Application.Tests.Support;

[Trait("Suite", "Application")]
public sealed class SupportProblemReportIntakeServiceTests
{
    private static readonly ScopeContext DefaultScope = new()
    {
        TenantId = Guid.Parse("11111111-1111-1111-1111-111111111111"),
        WorkspaceId = Guid.Parse("22222222-2222-2222-2222-222222222222"),
        ProjectId = Guid.Parse("33333333-3333-3333-3333-333333333333")
    };

    [Fact]
    public async Task SubmitAsync_without_consent_throws()
    {
        SupportProblemReportIntakeService sut = BuildSut(out _, out _, out _, out _);

        SubmitSupportProblemReportRequest request = new()
        {
            ConsentGranted = false,
            Context = new ReportProblemContextDto { RoutePath = "/reviews" }
        };

        Func<Task> act = async () => await sut.SubmitAsync(DefaultScope, "actor-1", null, request, CancellationToken.None);

        await act.Should().ThrowAsync<SupportProblemReportConsentRequiredException>();
    }

    [Fact]
    public async Task SubmitAsync_with_mismatched_tenant_throws()
    {
        SupportProblemReportIntakeService sut = BuildSut(out _, out _, out _, out _);

        SubmitSupportProblemReportRequest request = new()
        {
            ConsentGranted = true,
            Context = new ReportProblemContextDto
            {
                TenantId = Guid.NewGuid().ToString("D"),
                WorkspaceId = DefaultScope.WorkspaceId.ToString("D")
            }
        };

        Func<Task> act = async () => await sut.SubmitAsync(DefaultScope, "actor-1", null, request, CancellationToken.None);

        await act.Should().ThrowAsync<SupportProblemReportScopeMismatchException>();
    }

    [Fact]
    public async Task SubmitAsync_persists_scope_aligned_envelope_and_returns_reference()
    {
        SupportProblemReportIntakeService sut = BuildSut(
            out Mock<ISupportProblemReportRepository> repo,
            out Mock<ISupportProblemReportNotifier> notifier,
            out _,
            out _);

        Guid referenceId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
        DateTimeOffset createdUtc = new(2026, 7, 16, 12, 0, 0, TimeSpan.Zero);

        repo.Setup(r => r.InsertAsync(It.IsAny<SupportProblemReportInsert>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(
                new SupportProblemReportRecord
                {
                    Id = referenceId,
                    TenantId = DefaultScope.TenantId,
                    WorkspaceId = DefaultScope.WorkspaceId,
                    ProjectId = DefaultScope.ProjectId,
                    SubmittedByActorId = "actor-1",
                    ContextJson = "{}",
                    Status = SupportProblemReportStatus.Open,
                    CreatedUtc = createdUtc
                });

        SubmitSupportProblemReportRequest request = new()
        {
            ConsentGranted = true,
            OperatorNote = "  Export failed after commit  ",
            Context = new ReportProblemContextDto
            {
                ReviewId = "run-1",
                CorrelationId = "corr-1",
                RoutePath = "/reviews/run-1",
                ErrorTitle = "Load failed"
            }
        };

        SubmitSupportProblemReportResponse response =
            await sut.SubmitAsync(DefaultScope, "actor-1", null, request, CancellationToken.None);

        response.ReferenceId.Should().Be(referenceId);
        response.SubmittedAtUtc.Should().Be(createdUtc);
        response.SlaMessage.Should().Be(SupportProblemReportIntakeService.SlaMessage);
        response.SupportBundleAttached.Should().BeFalse();
        response.SupportBundleAttachWarning.Should().BeNull();

        repo.Verify(
            r => r.InsertAsync(
                It.Is<SupportProblemReportInsert>(insert =>
                    insert.TenantId == DefaultScope.TenantId
                    && insert.WorkspaceId == DefaultScope.WorkspaceId
                    && insert.OperatorNote == "Export failed after commit"
                    && insert.CorrelationId == "corr-1"
                    && insert.SupportBundleBlobPath == null),
                It.IsAny<CancellationToken>()),
            Times.Once);

        notifier.Verify(
            n => n.NotifySupportInboxAsync(
                It.IsAny<SupportProblemReportRecord>(),
                "actor-1",
                false,
                It.IsAny<CancellationToken>()),
            Times.Once);

        notifier.Verify(
            n => n.NotifySubmitterAsync(
                It.IsAny<SupportProblemReportRecord>(),
                It.IsAny<string>(),
                It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task SubmitAsync_with_submitter_mailbox_sends_auto_ack()
    {
        SupportProblemReportIntakeService sut = BuildSut(
            out Mock<ISupportProblemReportRepository> repo,
            out Mock<ISupportProblemReportNotifier> notifier,
            out _,
            out _);

        Guid referenceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");
        DateTimeOffset createdUtc = new(2026, 7, 17, 10, 0, 0, TimeSpan.Zero);

        repo.Setup(r => r.InsertAsync(It.IsAny<SupportProblemReportInsert>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(
                new SupportProblemReportRecord
                {
                    Id = referenceId,
                    TenantId = DefaultScope.TenantId,
                    WorkspaceId = DefaultScope.WorkspaceId,
                    ProjectId = DefaultScope.ProjectId,
                    SubmittedByActorId = "actor-1",
                    ContextJson = "{}",
                    Status = SupportProblemReportStatus.Open,
                    CreatedUtc = createdUtc
                });

        SubmitSupportProblemReportRequest request = new()
        {
            ConsentGranted = true,
            Context = new ReportProblemContextDto { RoutePath = "/reviews" }
        };

        await sut.SubmitAsync(DefaultScope, "actor-1", "operator@example.com", request, CancellationToken.None);

        notifier.Verify(
            n => n.NotifySubmitterAsync(
                It.Is<SupportProblemReportRecord>(record => record.Id == referenceId),
                "operator@example.com",
                It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task SubmitAsync_with_attach_stores_bundle_and_sets_response_flags()
    {
        SupportProblemReportIntakeService sut = BuildSut(
            out Mock<ISupportProblemReportRepository> repo,
            out Mock<ISupportProblemReportNotifier> notifier,
            out Mock<ISupportBundleAssembler> assembler,
            out Mock<ISupportProblemReportBundleStore> bundleStore);

        byte[] zipBytes = [0x50, 0x4B, 0x03, 0x04];
        DateTimeOffset generatedUtc = new(2026, 7, 16, 13, 0, 0, TimeSpan.Zero);
        SupportBundleArtifact artifact = new(
            zipBytes,
            "support-bundle.zip",
            "application/zip",
            generatedUtc,
            generatedUtc.AddDays(30));

        Guid capturedReportId = Guid.Empty;

        assembler.Setup(a => a.AssembleAsync(It.IsAny<SupportBundleRequest>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(artifact);

        bundleStore.Setup(b => b.TryStoreAsync(It.IsAny<Guid>(), zipBytes, "support-bundle.zip", It.IsAny<CancellationToken>()))
            .Callback<Guid, byte[], string, CancellationToken>((reportId, _, _, _) => capturedReportId = reportId)
            .ReturnsAsync("file:///tmp/support-bundle.zip");

        repo.Setup(r => r.InsertAsync(It.IsAny<SupportProblemReportInsert>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(
                (SupportProblemReportInsert insert, CancellationToken _) =>
                    new SupportProblemReportRecord
                    {
                        Id = insert.Id,
                        TenantId = insert.TenantId,
                        WorkspaceId = insert.WorkspaceId,
                        ProjectId = insert.ProjectId,
                        SubmittedByActorId = insert.SubmittedByActorId,
                        ContextJson = insert.ContextJson,
                        Status = SupportProblemReportStatus.Open,
                        CreatedUtc = generatedUtc
                    });

        repo.Setup(r => r.UpdateSupportBundleBlobPathAsync(
                DefaultScope.TenantId,
                It.IsAny<Guid>(),
                "file:///tmp/support-bundle.zip",
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(
                (Guid _, Guid reportId, string blobPath, CancellationToken _) =>
                    new SupportProblemReportRecord
                    {
                        Id = reportId,
                        TenantId = DefaultScope.TenantId,
                        WorkspaceId = DefaultScope.WorkspaceId,
                        ProjectId = DefaultScope.ProjectId,
                        SubmittedByActorId = "actor-1",
                        ContextJson = "{}",
                        SupportBundleBlobPath = blobPath,
                        Status = SupportProblemReportStatus.Open,
                        CreatedUtc = generatedUtc
                    });

        SubmitSupportProblemReportRequest request = new()
        {
            ConsentGranted = true,
            AttachSupportBundle = true,
            Context = new ReportProblemContextDto { RoutePath = "/reviews" }
        };

        SubmitSupportProblemReportResponse response =
            await sut.SubmitAsync(DefaultScope, "actor-1", null, request, CancellationToken.None);

        capturedReportId.Should().NotBe(Guid.Empty);
        response.ReferenceId.Should().Be(capturedReportId);
        response.SupportBundleAttached.Should().BeTrue();
        response.SupportBundleAttachWarning.Should().BeNull();

        repo.Verify(
            r => r.InsertAsync(
                It.Is<SupportProblemReportInsert>(insert =>
                    insert.Id == capturedReportId
                    && insert.SupportBundleBlobPath == null),
                It.IsAny<CancellationToken>()),
            Times.Once);

        repo.Verify(
            r => r.UpdateSupportBundleBlobPathAsync(
                DefaultScope.TenantId,
                capturedReportId,
                "file:///tmp/support-bundle.zip",
                It.IsAny<CancellationToken>()),
            Times.Once);

        notifier.Verify(
            n => n.NotifySupportInboxAsync(
                It.IsAny<SupportProblemReportRecord>(),
                "actor-1",
                true,
                It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task SubmitAsync_with_attach_when_store_fails_still_persists_report_and_returns_warning()
    {
        SupportProblemReportIntakeService sut = BuildSut(
            out Mock<ISupportProblemReportRepository> repo,
            out Mock<ISupportProblemReportNotifier> notifier,
            out Mock<ISupportBundleAssembler> assembler,
            out Mock<ISupportProblemReportBundleStore> bundleStore);

        DateTimeOffset createdUtc = new(2026, 7, 16, 14, 0, 0, TimeSpan.Zero);
        byte[] zipBytes = [0x50, 0x4B, 0x03, 0x04];
        SupportBundleArtifact artifact = new(
            zipBytes,
            "support-bundle.zip",
            "application/zip",
            createdUtc,
            createdUtc.AddDays(30));

        assembler.Setup(a => a.AssembleAsync(It.IsAny<SupportBundleRequest>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(artifact);

        bundleStore.Setup(b => b.TryStoreAsync(It.IsAny<Guid>(), zipBytes, "support-bundle.zip", It.IsAny<CancellationToken>()))
            .ReturnsAsync((string?)null);

        repo.Setup(r => r.InsertAsync(It.IsAny<SupportProblemReportInsert>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(
                (SupportProblemReportInsert insert, CancellationToken _) =>
                    new SupportProblemReportRecord
                    {
                        Id = insert.Id,
                        TenantId = insert.TenantId,
                        WorkspaceId = insert.WorkspaceId,
                        ProjectId = insert.ProjectId,
                        SubmittedByActorId = insert.SubmittedByActorId,
                        ContextJson = insert.ContextJson,
                        Status = SupportProblemReportStatus.Open,
                        CreatedUtc = createdUtc
                    });

        SubmitSupportProblemReportRequest request = new()
        {
            ConsentGranted = true,
            AttachSupportBundle = true,
            Context = new ReportProblemContextDto { RoutePath = "/reviews" }
        };

        SubmitSupportProblemReportResponse response =
            await sut.SubmitAsync(DefaultScope, "actor-1", null, request, CancellationToken.None);

        response.SupportBundleAttached.Should().BeFalse();
        response.SupportBundleAttachWarning.Should().Be(SupportProblemReportIntakeService.SupportBundleAttachFailedWarning);

        repo.Verify(
            r => r.InsertAsync(
                It.Is<SupportProblemReportInsert>(insert => insert.SupportBundleBlobPath == null),
                It.IsAny<CancellationToken>()),
            Times.Once);

        repo.Verify(
            r => r.UpdateSupportBundleBlobPathAsync(
                It.IsAny<Guid>(),
                It.IsAny<Guid>(),
                It.IsAny<string>(),
                It.IsAny<CancellationToken>()),
            Times.Never);

        notifier.Verify(
            n => n.NotifySupportInboxAsync(
                It.IsAny<SupportProblemReportRecord>(),
                "actor-1",
                false,
                It.IsAny<CancellationToken>()),
            Times.Once);
    }

    private static SupportProblemReportIntakeService BuildSut(
        out Mock<ISupportProblemReportRepository> repo,
        out Mock<ISupportProblemReportNotifier> notifier,
        out Mock<ISupportBundleAssembler> assembler,
        out Mock<ISupportProblemReportBundleStore> bundleStore)
    {
        repo = new Mock<ISupportProblemReportRepository>(MockBehavior.Strict);
        notifier = new Mock<ISupportProblemReportNotifier>(MockBehavior.Strict);
        notifier.Setup(n => n.NotifySupportInboxAsync(
                It.IsAny<SupportProblemReportRecord>(),
                It.IsAny<string>(),
                It.IsAny<bool>(),
                It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);
        notifier.Setup(n => n.NotifySubmitterAsync(
                It.IsAny<SupportProblemReportRecord>(),
                It.IsAny<string>(),
                It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        assembler = new Mock<ISupportBundleAssembler>(MockBehavior.Strict);
        bundleStore = new Mock<ISupportProblemReportBundleStore>(MockBehavior.Strict);

        return new SupportProblemReportIntakeService(
            repo.Object,
            notifier.Object,
            assembler.Object,
            bundleStore.Object,
            NullLogger<SupportProblemReportIntakeService>.Instance);
    }
}
