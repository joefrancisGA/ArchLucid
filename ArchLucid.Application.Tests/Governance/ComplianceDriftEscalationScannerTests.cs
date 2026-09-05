using ArchLucid.Application.Governance;
using ArchLucid.Contracts.Governance;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Integration;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Persistence.IntegrationOutbox;
using ArchLucid.Persistence.Queries;

using FluentAssertions;

using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

using Moq;

namespace ArchLucid.Application.Tests.Governance;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class ComplianceDriftEscalationScannerTests
{
    private static readonly Guid TenantId = Guid.Parse("aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee");
    private static readonly Guid WorkspaceId = Guid.Parse("bbbbbbbb-cccc-dddd-eeee-ffffffffffff");
    private static readonly Guid ProjectId = Guid.Parse("cccccccc-dddd-eeee-ffff-000011112222");

    [Fact]
    public async Task ScanDueAsync_when_disabled_skips_without_querying_tenants()
    {
        Mock<ITenantRepository> tenants = new();
        ComplianceDriftEscalationScanner sut = CreateSut(
            tenants,
            escalationOptions: new ComplianceDriftEscalationOptions { Enabled = false });

        await sut.ScanDueAsync(TimeProvider.System.GetUtcNow(), CancellationToken.None);

        tenants.Verify(repository => repository.ListAsync(It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task ScanDueAsync_publishes_policy_pack_stale_hours_when_threshold_breached()
    {
        DateTimeOffset utcNow = new(2026, 9, 5, 12, 0, 0, TimeSpan.Zero);
        TenantRecord tenant = new() { Id = TenantId, Name = "Acme" };
        TenantWorkspaceLink workspaceLink = new() { WorkspaceId = WorkspaceId, DefaultProjectId = ProjectId };

        Mock<ITenantRepository> tenants = new();
        tenants.Setup(repository => repository.ListAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync([tenant]);
        tenants.Setup(repository => repository.GetFirstWorkspaceAsync(TenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(workspaceLink);

        Mock<IPolicyPackChangeLogRepository> changeLog = new();
        changeLog.Setup(repository => repository.GetByScopeAsync(
                TenantId,
                WorkspaceId,
                ProjectId,
                1,
                It.IsAny<CancellationToken>()))
            .ReturnsAsync([
                new PolicyPackChangeLogEntry
                {
                    ChangedUtc = utcNow.UtcDateTime.AddHours(-96),
                    ChangeType = "Activated",
                    ChangedBy = "operator",
                },
            ]);

        Mock<IComplianceDriftFindingsTrendReader> findings = new();
        Mock<IAuthorityQueryService> authority = new();
        authority.Setup(service => service.GetLatestCommittedRunIdByManifestCreatedUtcAsync(
                It.IsAny<ScopeContext>(),
                "default",
                It.IsAny<CancellationToken>()))
            .ReturnsAsync((Guid?)null);

        Mock<IIntegrationEventPublisher> publisher = new();
        publisher.Setup(p => p.PublishAsync(
                It.IsAny<string>(),
                It.IsAny<ReadOnlyMemory<byte>>(),
                It.IsAny<string?>(),
                It.IsAny<IReadOnlyDictionary<string, object>?>(),
                It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        ComplianceDriftEscalationScanner sut = CreateSut(
            tenants,
            changeLog,
            findings,
            authority,
            publisher,
            escalationOptions: new ComplianceDriftEscalationOptions
            {
                Enabled = true,
                OpenFindingsCountThreshold = null,
                PolicyPackStaleHoursThreshold = 72d,
            });

        await sut.ScanDueAsync(utcNow, CancellationToken.None);

        publisher.Verify(
            p => p.PublishAsync(
                IntegrationEventTypes.ComplianceDriftEscalatedV1,
                It.IsAny<ReadOnlyMemory<byte>>(),
                It.Is<string?>(messageId => messageId != null && messageId.Contains("20260905", StringComparison.Ordinal)),
                It.IsAny<IReadOnlyDictionary<string, object>?>(),
                It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task ScanDueAsync_publishes_open_findings_count_when_threshold_breached()
    {
        DateTimeOffset utcNow = new(2026, 9, 5, 12, 0, 0, TimeSpan.Zero);
        DateTime fromUtc = utcNow.UtcDateTime.AddHours(-24);
        TenantRecord tenant = new() { Id = TenantId, Name = "Acme" };
        TenantWorkspaceLink workspaceLink = new() { WorkspaceId = WorkspaceId, DefaultProjectId = ProjectId };

        Mock<ITenantRepository> tenants = new();
        tenants.Setup(repository => repository.ListAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync([tenant]);
        tenants.Setup(repository => repository.GetFirstWorkspaceAsync(TenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(workspaceLink);

        Mock<IPolicyPackChangeLogRepository> changeLog = new();
        changeLog.Setup(repository => repository.GetByScopeAsync(
                TenantId,
                WorkspaceId,
                ProjectId,
                1,
                It.IsAny<CancellationToken>()))
            .ReturnsAsync([]);

        Mock<IComplianceDriftFindingsTrendReader> findings = new();
        findings.Setup(reader => reader.GetBucketCountsAsync(
                TenantId,
                WorkspaceId,
                ProjectId,
                fromUtc,
                utcNow.UtcDateTime,
                TimeSpan.FromHours(24),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new Dictionary<DateTime, ComplianceDriftFindingsBucketCounts>
            {
                [fromUtc] = new() { OpenFindingsCount = 12, ResolvedFindingsCount = 1 },
            });

        Mock<IAuthorityQueryService> authority = new();
        authority.Setup(service => service.GetLatestCommittedRunIdByManifestCreatedUtcAsync(
                It.IsAny<ScopeContext>(),
                "default",
                It.IsAny<CancellationToken>()))
            .ReturnsAsync((Guid?)null);

        Mock<IIntegrationEventPublisher> publisher = new();
        publisher.Setup(p => p.PublishAsync(
                It.IsAny<string>(),
                It.IsAny<ReadOnlyMemory<byte>>(),
                It.IsAny<string?>(),
                It.IsAny<IReadOnlyDictionary<string, object>?>(),
                It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        ComplianceDriftEscalationScanner sut = CreateSut(
            tenants,
            changeLog,
            findings,
            authority,
            publisher,
            escalationOptions: new ComplianceDriftEscalationOptions
            {
                Enabled = true,
                OpenFindingsCountThreshold = 10,
                PolicyPackStaleHoursThreshold = null,
            });

        await sut.ScanDueAsync(utcNow, CancellationToken.None);

        publisher.Verify(
            p => p.PublishAsync(
                IntegrationEventTypes.ComplianceDriftEscalatedV1,
                It.IsAny<ReadOnlyMemory<byte>>(),
                It.IsAny<string?>(),
                It.IsAny<IReadOnlyDictionary<string, object>?>(),
                It.IsAny<CancellationToken>()),
            Times.Once);
    }

    private static ComplianceDriftEscalationScanner CreateSut(
        Mock<ITenantRepository> tenants,
        Mock<IPolicyPackChangeLogRepository>? changeLog = null,
        Mock<IComplianceDriftFindingsTrendReader>? findings = null,
        Mock<IAuthorityQueryService>? authority = null,
        Mock<IIntegrationEventPublisher>? publisher = null,
        ComplianceDriftEscalationOptions? escalationOptions = null)
    {
        changeLog ??= new Mock<IPolicyPackChangeLogRepository>();
        findings ??= new Mock<IComplianceDriftFindingsTrendReader>();
        authority ??= new Mock<IAuthorityQueryService>();
        publisher ??= new Mock<IIntegrationEventPublisher>();

        Mock<IIntegrationEventOutboxRepository> outbox = new();
        Mock<IOptionsMonitor<IntegrationEventsOptions>> integrationOpts = new();
        integrationOpts.Setup(m => m.CurrentValue).Returns(new IntegrationEventsOptions { TransactionalOutboxEnabled = false });

        Mock<IOptionsMonitor<ComplianceDriftEscalationOptions>> escalationOpts = new();
        escalationOpts.Setup(m => m.CurrentValue).Returns(escalationOptions ?? new ComplianceDriftEscalationOptions());

        return new ComplianceDriftEscalationScanner(
            tenants.Object,
            changeLog.Object,
            findings.Object,
            authority.Object,
            outbox.Object,
            publisher.Object,
            integrationOpts.Object,
            escalationOpts.Object,
            Mock.Of<IManifestHashService>(),
            Mock.Of<ILogger<ComplianceDriftEscalationScanner>>());
    }
}
