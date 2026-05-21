using ArchLucid.Application;
using ArchLucid.Application.Exports;
using ArchLucid.Application.Notifications.Email;
using ArchLucid.Application.WeeklyExecutiveSummary;
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
public sealed class WeeklyExecutiveSummaryJobTests
{
    [Fact]
    public void Name_is_canonical_weekly_executive_summary_slug()
    {
        WeeklyExecutiveSummaryJob job = new(Mock.Of<IServiceProvider>(), NullLogger<WeeklyExecutiveSummaryJob>.Instance);

        job.Name.Should().Be(ArchLucidJobNames.WeeklyExecutiveSummary);
    }

    [Fact]
    public async Task RunOnceAsync_returns_success_when_feature_disabled()
    {
        await using ServiceProvider provider = BuildProviderWithFeatureDisabled();
        WeeklyExecutiveSummaryJob job = new(provider, NullLogger<WeeklyExecutiveSummaryJob>.Instance);

        int code = await job.RunOnceAsync(CancellationToken.None);

        code.Should().Be(ArchLucidJobExitCodes.Success);
    }

    private static ServiceProvider BuildProviderWithFeatureDisabled()
    {
        Mock<ITenantRepository> tenants = new();
        tenants.Setup(r => r.ListAsync(It.IsAny<CancellationToken>())).ReturnsAsync([]);

        ServiceCollection services = [];
        services.Configure<WeeklyExecutiveSummaryOptions>(static o => o.Enabled = false);
        services.AddSingleton(tenants.Object);
        services.AddSingleton(Mock.Of<IAuthorityQueryService>());
        services.AddSingleton(Mock.Of<IRunDetailQueryService>());
        services.AddSingleton(Mock.Of<IRunSummaryOnePagerExportService>());
        services.AddSingleton(Mock.Of<IExecutiveSummaryRecipientLookup>());
        services.AddSingleton(Mock.Of<IWeeklyExecutiveSummaryEmailDispatcher>());
        services.AddSingleton(Mock.Of<IOptionsMonitor<EmailNotificationOptions>>());
        services.AddScoped<WeeklyExecutiveSummaryDeliveryScanner>();
        services.AddSingleton<ILogger<WeeklyExecutiveSummaryDeliveryScanner>>(
            NullLogger<WeeklyExecutiveSummaryDeliveryScanner>.Instance);

        return services.BuildServiceProvider();
    }
}
