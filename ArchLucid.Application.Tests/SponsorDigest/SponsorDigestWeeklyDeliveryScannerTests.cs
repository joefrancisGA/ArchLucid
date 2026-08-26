using ArchLucid.Application.ExecDigest;
using ArchLucid.Application.Notifications.Email;
using ArchLucid.Application.SponsorDigest;
using ArchLucid.Contracts.Notifications;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Tenancy;
using ArchLucid.Persistence.Data.Repositories;

using FluentAssertions;

using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;

using Moq;

namespace ArchLucid.Application.Tests.SponsorDigest;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class SponsorDigestWeeklyDeliveryScannerTests
{
    private static readonly Guid TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");

    [Fact]
    public async Task PublishDueAsync_queries_sponsor_digest_preferences_repository()
    {
        Mock<ITenantSponsorDigestPreferencesRepository> sponsorPrefs = new();
        sponsorPrefs
            .Setup(r => r.ListEmailEnabledTenantIdsAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync([]);

        SponsorDigestWeeklyDeliveryScanner scanner = CreateScanner(sponsorPrefs.Object);

        await scanner.PublishDueAsync(DateTimeOffset.UtcNow, CancellationToken.None);

        sponsorPrefs.Verify(
            r => r.ListEmailEnabledTenantIdsAsync(It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task PublishDueAsync_dispatches_with_sponsor_unsubscribe_url_when_schedule_matches()
    {
        DateTimeOffset utcNow = new(2026, 8, 26, 8, 0, 0, TimeSpan.Zero);

        Mock<ITenantSponsorDigestPreferencesRepository> sponsorPrefs = new();
        sponsorPrefs
            .Setup(r => r.ListEmailEnabledTenantIdsAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync([TenantId]);
        sponsorPrefs
            .Setup(r => r.GetByTenantAsync(TenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new SponsorDigestPreferencesResponse
            {
                TenantId = TenantId,
                IsConfigured = true,
                EmailEnabled = true,
                RecipientEmails = ["sponsor@example.com"],
                IanaTimeZoneId = "UTC",
                DayOfWeek = (int)DayOfWeek.Wednesday,
                HourOfDay = 8,
            });

        Mock<ITenantRepository> tenants = new();
        tenants
            .Setup(r => r.GetFirstWorkspaceAsync(TenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new TenantWorkspaceLink
            {
                WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
                DefaultProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
            });

        Mock<IExecDigestComposer> composer = new();
        composer
            .Setup(c => c.ComposeAsync(
                TenantId,
                It.IsAny<DateTime>(),
                It.IsAny<DateTime>(),
                It.IsAny<Core.Scoping.ScopeContext>(),
                It.IsAny<string>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ExecDigestComposition(
                "week",
                null,
                null,
                [],
                null,
                "https://app.example",
                "https://app.example/report",
                null));

        string? capturedUnsubscribeUrl = null;
        Mock<IExecDigestEmailDispatcher> dispatcher = new();
        dispatcher
            .Setup(d => d.TryDispatchAsync(
                TenantId,
                It.IsAny<string>(),
                It.IsAny<ExecDigestComposition>(),
                It.IsAny<IReadOnlyList<string>>(),
                It.IsAny<string>(),
                It.IsAny<CancellationToken>()))
            .Callback<Guid, string, ExecDigestComposition, IReadOnlyList<string>, string, CancellationToken>(
                (_, _, _, _, unsubscribeUrl, _) => capturedUnsubscribeUrl = unsubscribeUrl)
            .ReturnsAsync(true);

        Mock<ISponsorDigestUnsubscribeTokenFactory> unsubscribe = new();
        unsubscribe.Setup(f => f.CreateToken(TenantId)).Returns("signed-token");

        Mock<IExecDigestSponsorDeepLinkTokenFactory> deepLinks = new();
        deepLinks.Setup(f => f.CreateDashboardToken(TenantId, It.IsAny<string>())).Returns("dashboard-token");
        deepLinks.Setup(f => f.CreateRunCollateralToken(TenantId, It.IsAny<string>(), It.IsAny<string>()))
            .Returns("run-token");

        SponsorDigestWeeklyDeliveryScanner scanner = CreateScanner(
            sponsorPrefs.Object,
            tenants.Object,
            composer.Object,
            dispatcher.Object,
            unsubscribe.Object,
            deepLinks.Object);

        await scanner.PublishDueAsync(utcNow, CancellationToken.None);

        capturedUnsubscribeUrl.Should().Contain("/notifications/sponsor-digest/unsubscribe");
        capturedUnsubscribeUrl.Should().Contain("token=signed-token");
        dispatcher.Verify(
            d => d.TryDispatchAsync(
                TenantId,
                It.IsAny<string>(),
                It.IsAny<ExecDigestComposition>(),
                It.Is<IReadOnlyList<string>>(r => r.Contains("sponsor@example.com")),
                It.IsAny<string>(),
                It.IsAny<CancellationToken>()),
            Times.Once);
    }

    private static SponsorDigestWeeklyDeliveryScanner CreateScanner(
        ITenantSponsorDigestPreferencesRepository sponsorDigestPreferencesRepository,
        ITenantRepository? tenantRepository = null,
        IExecDigestComposer? execDigestComposer = null,
        IExecDigestEmailDispatcher? execDigestEmailDispatcher = null,
        ISponsorDigestUnsubscribeTokenFactory? unsubscribeTokenFactory = null,
        IExecDigestSponsorDeepLinkTokenFactory? sponsorDeepLinkTokenFactory = null)
    {
        Mock<IOptionsMonitor<EmailNotificationOptions>> emailOptions = new();
        emailOptions.Setup(o => o.CurrentValue).Returns(new EmailNotificationOptions { OperatorBaseUrl = "https://app.example" });

        return new SponsorDigestWeeklyDeliveryScanner(
            sponsorDigestPreferencesRepository,
            tenantRepository ?? Mock.Of<ITenantRepository>(),
            execDigestComposer ?? Mock.Of<IExecDigestComposer>(),
            execDigestEmailDispatcher ?? Mock.Of<IExecDigestEmailDispatcher>(),
            Mock.Of<ITenantTrialEmailContactLookup>(),
            unsubscribeTokenFactory ?? Mock.Of<ISponsorDigestUnsubscribeTokenFactory>(),
            sponsorDeepLinkTokenFactory ?? Mock.Of<IExecDigestSponsorDeepLinkTokenFactory>(),
            emailOptions.Object,
            NullLogger<SponsorDigestWeeklyDeliveryScanner>.Instance);
    }
}
