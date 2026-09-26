using ArchLucid.Application.Exports;
using ArchLucid.Application.Notifications.Email;
using ArchLucid.Application.WeeklySponsorSummary;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Tenancy;
using ArchLucid.Host.Core.Jobs;
using ArchLucid.Persistence.Queries;

using FluentAssertions;

using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;

using Moq;

namespace ArchLucid.Host.Composition.Tests.Jobs;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class WeeklySponsorSummaryArchLucidJobTests
{
    [Fact]
    public void Name_is_canonical_weekly_sponsor_summary_slug()
    {
        WeeklySponsorSummaryArchLucidJob job = new(
            Mock.Of<IServiceProvider>(),
            NullLogger<WeeklySponsorSummaryArchLucidJob>.Instance);

        job.Name.Should().Be(ArchLucidJobNames.WeeklySponsorSummary);
    }

    [Fact]
    public async Task RunOnceAsync_returns_success_when_feature_disabled()
    {
        await using ServiceProvider provider = BuildProviderWithFeatureDisabled();
        WeeklySponsorSummaryArchLucidJob job = new(provider, NullLogger<WeeklySponsorSummaryArchLucidJob>.Instance);

        int code = await job.RunOnceAsync(CancellationToken.None);

        code.Should().Be(ArchLucidJobExitCodes.Success);
    }

    private static ServiceProvider BuildProviderWithFeatureDisabled()
    {
        Mock<ITenantRepository> tenants = new();
        tenants.Setup(r => r.ListAsync(It.IsAny<CancellationToken>())).ReturnsAsync([]);

        ServiceCollection services = [];
        services.Configure<WeeklySponsorSummaryOptions>(static o => o.Enabled = false);
        services.AddSingleton(tenants.Object);
        services.AddSingleton(Mock.Of<IAuthorityQueryService>());
        services.AddSingleton(Mock.Of<IRunSummaryOnePagerExportService>());
        services.AddSingleton(Mock.Of<ISponsorReportRecipientLookup>());
        services.AddSingleton(Mock.Of<IWeeklySponsorSummaryEmailDispatcher>());
        services.AddSingleton(Mock.Of<IOptionsMonitor<EmailNotificationOptions>>());
        services.AddScoped<WeeklySponsorSummaryDeliveryScanner>();
        services.AddSingleton<ILogger<WeeklySponsorSummaryDeliveryScanner>>(
            NullLogger<WeeklySponsorSummaryDeliveryScanner>.Instance);

        return services.BuildServiceProvider();
    }
}
