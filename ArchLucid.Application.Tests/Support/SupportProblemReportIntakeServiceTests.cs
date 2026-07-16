using ArchLucid.Application.Notifications.Email;
using ArchLucid.Application.Support;
using ArchLucid.Contracts.Support;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Support;

using FluentAssertions;

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
        SupportProblemReportIntakeService sut = BuildSut(out _, out _);

        SubmitSupportProblemReportRequest request = new()
        {
            ConsentGranted = false,
            Context = new ReportProblemContextDto { RoutePath = "/reviews" }
        };

        Func<Task> act = async () => await sut.SubmitAsync(DefaultScope, "actor-1", request, CancellationToken.None);

        await act.Should().ThrowAsync<SupportProblemReportConsentRequiredException>();
    }

    [Fact]
    public async Task SubmitAsync_with_mismatched_tenant_throws()
    {
        SupportProblemReportIntakeService sut = BuildSut(out _, out _);

        SubmitSupportProblemReportRequest request = new()
        {
            ConsentGranted = true,
            Context = new ReportProblemContextDto
            {
                TenantId = Guid.NewGuid().ToString("D"),
                WorkspaceId = DefaultScope.WorkspaceId.ToString("D")
            }
        };

        Func<Task> act = async () => await sut.SubmitAsync(DefaultScope, "actor-1", request, CancellationToken.None);

        await act.Should().ThrowAsync<SupportProblemReportScopeMismatchException>();
    }

    [Fact]
    public async Task SubmitAsync_persists_scope_aligned_envelope_and_returns_reference()
    {
        SupportProblemReportIntakeService sut = BuildSut(out Mock<ISupportProblemReportRepository> repo, out Mock<ISupportProblemReportNotifier> notifier);

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
            await sut.SubmitAsync(DefaultScope, "actor-1", request, CancellationToken.None);

        response.ReferenceId.Should().Be(referenceId);
        response.SubmittedAtUtc.Should().Be(createdUtc);
        response.SlaMessage.Should().Be(SupportProblemReportIntakeService.SlaMessage);

        repo.Verify(
            r => r.InsertAsync(
                It.Is<SupportProblemReportInsert>(insert =>
                    insert.TenantId == DefaultScope.TenantId
                    && insert.WorkspaceId == DefaultScope.WorkspaceId
                    && insert.OperatorNote == "Export failed after commit"
                    && insert.CorrelationId == "corr-1"),
                It.IsAny<CancellationToken>()),
            Times.Once);

        notifier.Verify(
            n => n.NotifySupportInboxAsync(It.IsAny<SupportProblemReportRecord>(), "actor-1", It.IsAny<CancellationToken>()),
            Times.Once);
    }

    private static SupportProblemReportIntakeService BuildSut(
        out Mock<ISupportProblemReportRepository> repo,
        out Mock<ISupportProblemReportNotifier> notifier)
    {
        repo = new Mock<ISupportProblemReportRepository>(MockBehavior.Strict);
        notifier = new Mock<ISupportProblemReportNotifier>(MockBehavior.Strict);
        notifier.Setup(n => n.NotifySupportInboxAsync(It.IsAny<SupportProblemReportRecord>(), It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        return new SupportProblemReportIntakeService(repo.Object, notifier.Object, TimeProvider.System);
    }
}
