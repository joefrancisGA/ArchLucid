using ArchLucid.Application.Configuration;
using ArchLucid.Application.Exports;
using ArchLucid.Application.Notifications.Email;
using ArchLucid.Application.Tenancy;
using ArchLucid.Application.WeeklySponsorReport;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;
using ArchLucid.Persistence.Queries;
using ArchLucid.Persistence.Tenancy;

using FluentAssertions;

using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;

using Moq;

namespace ArchLucid.Application.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class ApplicationPackageCoverageBatch8Tests
{
    [Fact]
    public void TenantProvisioningDataRegionPolicy_normalizes_and_validates_supported_regions()
    {
        TenantProvisioningDataRegionPolicy.NormalizeRequest(null).Should().Be(TenantDataRegions.Default);
        TenantProvisioningDataRegionPolicy.NormalizeRequest(" EastUS ").Should().Be("eastus");

        TenantProvisioningOptions defaults = new();
        TenantProvisioningDataRegionPolicy.Validate(TenantDataRegions.Default, defaults);

        TenantProvisioningOptions blankConfigured = new() { SupportedDataRegions = [" ", ""] };
        TenantProvisioningDataRegionPolicy.Validate("eastus", blankConfigured);

        TenantProvisioningOptions configured = new() { SupportedDataRegions = [" WestUS2 ", "eastus"] };
        TenantProvisioningDataRegionPolicy.Validate("westus2", configured);

        Action invalid = () => TenantProvisioningDataRegionPolicy.Validate("not-a-region", configured);
        invalid.Should().Throw<ArgumentException>();
    }

    [Fact]
    public async Task TenantAgentOutputQualityGateModeService_get_set_clear_and_missing_scope()
    {
        Guid tenantId = Guid.NewGuid();
        Mock<IScopeContextProvider> scope = new();
        scope.Setup(s => s.GetCurrentScope()).Returns(new ScopeContext { TenantId = tenantId });

        Mock<ITenantSettingsRepository> settings = new();
        settings.Setup(s => s.TryGetAsync(tenantId, TenantSettingKeys.AgentOutputQualityGateMode, It.IsAny<CancellationToken>()))
            .ReturnsAsync((string?)null);
        settings.Setup(s => s.UpsertAsync(
                tenantId,
                TenantSettingKeys.AgentOutputQualityGateMode,
                It.IsAny<string>(),
                It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);
        settings.Setup(s => s.DeleteAsync(tenantId, TenantSettingKeys.AgentOutputQualityGateMode, It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        IOptions<AgentOutputQualityGateOptions> host = Options.Create(
            new AgentOutputQualityGateOptions { Mode = AgentOutputQualityGateMode.WarnOnly });

        TenantAgentOutputQualityGateModeService sut = new(host, scope.Object, settings.Object);

        TenantAgentOutputQualityGateModeSnapshot hostDefault = await sut.GetAsync(CancellationToken.None);
        hostDefault.Source.Should().Be(TenantAgentOutputQualityGateModeSource.HostDefault);
        hostDefault.EffectiveMode.Should().Be(AgentOutputQualityGateMode.WarnOnly);

        settings.Setup(s => s.TryGetAsync(tenantId, TenantSettingKeys.AgentOutputQualityGateMode, It.IsAny<CancellationToken>()))
            .ReturnsAsync("PilotStrict");

        TenantAgentOutputQualityGateModeSnapshot set = await sut.SetAsync(
            AgentOutputQualityGateMode.PilotStrict,
            CancellationToken.None);
        set.Source.Should().Be(TenantAgentOutputQualityGateModeSource.TenantOverride);

        settings.Setup(s => s.TryGetAsync(tenantId, TenantSettingKeys.AgentOutputQualityGateMode, It.IsAny<CancellationToken>()))
            .ReturnsAsync((string?)null);

        TenantAgentOutputQualityGateModeSnapshot cleared = await sut.ClearOverrideAsync(CancellationToken.None);
        cleared.Source.Should().Be(TenantAgentOutputQualityGateModeSource.HostDefault);

        scope.Setup(s => s.GetCurrentScope()).Returns(new ScopeContext { TenantId = Guid.Empty });
        Func<Task> missingScope = () => sut.GetAsync(CancellationToken.None);
        await missingScope.Should().ThrowAsync<InvalidOperationException>();
    }

    [Fact]
    public async Task WeeklySponsorReportDeliveryScanner_skips_disabled_and_dispatches_when_due()
    {
        Mock<IOptionsMonitor<WeeklySponsorReportOptions>> weekly = new();
        weekly.Setup(o => o.CurrentValue).Returns(new WeeklySponsorReportOptions { Enabled = false });

        WeeklySponsorReportDeliveryScanner disabled = CreateScanner(
            weekly.Object,
            Mock.Of<ITenantRepository>(),
            Mock.Of<IAuthorityQueryService>(),
            Mock.Of<IRunSummaryOnePagerExportService>(),
            Mock.Of<ISponsorReportRecipientLookup>(),
            Mock.Of<IWeeklySponsorReportEmailDispatcher>());

        await disabled.PublishDueAsync(DateTimeOffset.UtcNow, CancellationToken.None);

        Guid tenantId = Guid.NewGuid();
        Guid workspaceId = Guid.NewGuid();
        Guid projectId = Guid.NewGuid();
        Guid runId = Guid.NewGuid();
        DateTimeOffset dueUtc = new(2026, 7, 20, 14, 0, 0, TimeSpan.Zero);

        weekly.Setup(o => o.CurrentValue).Returns(
            new WeeklySponsorReportOptions
            {
                Enabled = true,
                IanaTimeZoneId = "UTC",
                DayOfWeek = (int)dueUtc.DayOfWeek,
                HourOfDay = dueUtc.Hour,
            });

        Mock<ITenantRepository> tenants = new();
        tenants.Setup(t => t.ListAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(
            [
                new TenantRecord { Id = tenantId, Tier = TenantTier.Standard },
                new TenantRecord { Id = Guid.NewGuid(), Tier = TenantTier.Free },
            ]);
        tenants.Setup(t => t.GetFirstWorkspaceAsync(tenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new TenantWorkspaceLink
            {
                WorkspaceId = workspaceId,
                DefaultProjectId = projectId,
            });

        Mock<IAuthorityQueryService> authority = new();
        authority.Setup(a => a.GetLatestCommittedRunIdByManifestCreatedUtcAsync(
                It.IsAny<ScopeContext>(),
                "default",
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(runId);

        Mock<IRunSummaryOnePagerExportService> export = new();
        export.Setup(e => e.GenerateMarkdownAsync(runId.ToString("N"), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new RunSummaryOnePagerExportResult
            {
                Content = System.Text.Encoding.UTF8.GetBytes("# summary"),
            });

        Mock<ISponsorReportRecipientLookup> recipients = new();
        recipients.Setup(r => r.ListRecipientMailboxesAsync(tenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(["sponsor@example.com"]);

        Mock<IWeeklySponsorReportEmailDispatcher> dispatcher = new();
        dispatcher.Setup(d => d.TryDispatchAsync(
                tenantId,
                It.IsAny<string>(),
                runId.ToString("N"),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<IReadOnlyList<string>>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        WeeklySponsorReportDeliveryScanner sut = CreateScanner(
            weekly.Object,
            tenants.Object,
            authority.Object,
            export.Object,
            recipients.Object,
            dispatcher.Object);

        await sut.PublishDueAsync(dueUtc, CancellationToken.None);

        dispatcher.Verify(
            d => d.TryDispatchAsync(
                tenantId,
                It.IsAny<string>(),
                runId.ToString("N"),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<IReadOnlyList<string>>(),
                It.IsAny<CancellationToken>()),
            Times.Once);
    }

    private static WeeklySponsorReportDeliveryScanner CreateScanner(
        IOptionsMonitor<WeeklySponsorReportOptions> weekly,
        ITenantRepository tenants,
        IAuthorityQueryService authority,
        IRunSummaryOnePagerExportService export,
        ISponsorReportRecipientLookup recipients,
        IWeeklySponsorReportEmailDispatcher dispatcher)
    {
        Mock<IOptionsMonitor<EmailNotificationOptions>> email = new();
        email.Setup(o => o.CurrentValue).Returns(new EmailNotificationOptions { OperatorBaseUrl = "https://ui.example" });

        return new WeeklySponsorReportDeliveryScanner(
            tenants,
            authority,
            export,
            recipients,
            dispatcher,
            weekly,
            email.Object,
            NullLogger<WeeklySponsorReportDeliveryScanner>.Instance);
    }
}
