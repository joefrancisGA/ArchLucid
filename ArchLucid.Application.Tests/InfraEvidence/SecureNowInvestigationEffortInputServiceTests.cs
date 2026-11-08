using ArchLucid.Application.InfraEvidence;
using ArchLucid.Contracts.InfraEvidence;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Audit;

using FluentAssertions;

using Moq;
using Microsoft.Extensions.Logging.Abstractions;

namespace ArchLucid.Application.Tests.InfraEvidence;

[Trait("Category", "Unit")]
[Trait("Suite", "Application")]
public sealed class SecureNowInvestigationEffortInputServiceTests
{
    private static readonly Guid TenantId = Guid.Parse("11111111-1111-1111-1111-111111111111");
    private static readonly Guid WorkspaceId = Guid.Parse("22222222-2222-2222-2222-222222222222");
    private static readonly Guid ProjectId = Guid.Parse("33333333-3333-3333-3333-333333333333");

    [Fact]
    public async Task SaveAsync_then_TryGetLatestAsync_round_trips_operator_inputs()
    {
        InMemoryAuditRepository auditRepository = new();
        SecureNowInvestigationEffortInputService sut = CreateSut(auditRepository);

        SecureNowInvestigationEffortInputsSaveResult saved = await sut.SaveAsync(
            CreateScope(),
            ValidRequest(),
            "operator-actor",
            CancellationToken.None);

        saved.Succeeded.Should().BeTrue();
        saved.Inputs!.BaselineHours.Should().Be("5");

        SecureNowInvestigationEffortInputsResponse? latest =
            await sut.TryGetLatestAsync(CreateScope(), CancellationToken.None);

        latest.Should().NotBeNull();
        latest!.AfterHours.Should().Be("3");
        latest.AnnualCost.Should().Be("5000");
    }

    [Fact]
    public async Task SaveAsync_rejects_fixture_worksheet_tuple()
    {
        SecureNowInvestigationEffortInputService sut = CreateSut(new InMemoryAuditRepository());

        SecureNowInvestigationEffortInputsSaveResult result = await sut.SaveAsync(
            CreateScope(),
            new SecureNowInvestigationEffortInputsWriteRequest
            {
                BaselineHours = "3",
                AfterHours = "2",
                AnnualInvestigations = "20",
                HourlyRate = "100",
                AnnualCost = "10000",
            },
            "operator-actor",
            CancellationToken.None);

        result.Succeeded.Should().BeFalse();
        result.ErrorMessage.Should().Be(SecureNowInvestigationEffortInputService.FixtureWorksheetRejectedMessage);
    }

    [Fact]
    public async Task TryGetLatestAsync_returns_the_newest_record_in_scope()
    {
        InMemoryAuditRepository auditRepository = new();
        SecureNowInvestigationEffortInputService sut = CreateSut(auditRepository);

        await sut.SaveAsync(CreateScope(), ValidRequest(), "operator-actor", CancellationToken.None);
        await sut.SaveAsync(
            CreateScope(),
            new SecureNowInvestigationEffortInputsWriteRequest
            {
                BaselineHours = "8",
                AfterHours = "4",
                AnnualInvestigations = "15",
                HourlyRate = "120",
                AnnualCost = "9000",
            },
            "operator-actor",
            CancellationToken.None);

        SecureNowInvestigationEffortInputsResponse? latest =
            await sut.TryGetLatestAsync(CreateScope(), CancellationToken.None);

        latest.Should().NotBeNull();
        latest!.BaselineHours.Should().Be("8");
    }

    [Fact]
    public async Task SaveAsync_does_not_report_success_when_required_audit_write_fails()
    {
        Mock<IAuditService> auditService = new();
        auditService
            .Setup(service => service.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>()))
            .ThrowsAsync(new InvalidOperationException("audit storage unavailable"));
        SecureNowInvestigationEffortInputService sut =
            new(auditService.Object, new InMemoryAuditRepository(), NullLogger<SecureNowInvestigationEffortInputService>.Instance);

        Func<Task> act = async () =>
            await sut.SaveAsync(CreateScope(), ValidRequest(), "operator-actor", CancellationToken.None);

        await act.Should().ThrowAsync<DurableAuditWriteFailedException>();
    }

    private static SecureNowInvestigationEffortInputsWriteRequest ValidRequest() =>
        new()
        {
            BaselineHours = "5",
            AfterHours = "3",
            AnnualInvestigations = "10",
            HourlyRate = "80",
            AnnualCost = "5000",
        };

    private static SecureNowInvestigationEffortInputService CreateSut(InMemoryAuditRepository auditRepository)
    {
        Mock<IAuditService> auditService = new();
        auditService
            .Setup(service => service.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>()))
            .Returns<AuditEvent, CancellationToken>((auditEvent, ct) => auditRepository.AppendAsync(auditEvent, ct));

        return new SecureNowInvestigationEffortInputService(auditService.Object, auditRepository, NullLogger<SecureNowInvestigationEffortInputService>.Instance);
    }

    private static ScopeContext CreateScope() =>
        new()
        {
            TenantId = TenantId,
            WorkspaceId = WorkspaceId,
            ProjectId = ProjectId,
        };
}
