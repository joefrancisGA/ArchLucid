using ArchLucid.Application.ExecDigest;
using ArchLucid.Application.Notifications.Email;
using ArchLucid.Application.SponsorDigest;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Tenancy;
using ArchLucid.Host.Core.Jobs;
using ArchLucid.Persistence.Data.Repositories;

using FluentAssertions;

using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;

using Moq;

namespace ArchLucid.Host.Composition.Tests.Jobs;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class SponsorDigestWeeklyArchLucidJobTests
{
    [Fact]
    public void Name_is_canonical_sponsor_digest_weekly_slug()
    {
        SponsorDigestWeeklyArchLucidJob job = new(Mock.Of<IServiceProvider>(),
            NullLogger<SponsorDigestWeeklyArchLucidJob>.Instance);

        job.Name.Should().Be(ArchLucidJobNames.SponsorDigestWeekly);
    }

    [Fact]
    public async Task RunOnceAsync_returns_success_when_no_enabled_tenants()
    {
        await using ServiceProvider provider = BuildProviderWithNoEnabledTenants();
        SponsorDigestWeeklyArchLucidJob job = new(provider, NullLogger<SponsorDigestWeeklyArchLucidJob>.Instance);

        int code = await job.RunOnceAsync(CancellationToken.None);

        code.Should().Be(ArchLucidJobExitCodes.Success);
    }

    private static ServiceProvider BuildProviderWithNoEnabledTenants()
    {
        Mock<ITenantSponsorDigestPreferencesRepository> digestPrefs = new();
        digestPrefs
            .Setup(r => r.ListEmailEnabledTenantIdsAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync([]);

        ServiceCollection services = [];
        services.AddSingleton(digestPrefs.Object);
        services.AddSingleton(Mock.Of<ITenantRepository>());
        services.AddSingleton(Mock.Of<IExecDigestComposer>());
        services.AddSingleton(Mock.Of<IExecDigestEmailDispatcher>());
        services.AddSingleton(Mock.Of<ITenantTrialEmailContactLookup>());
        services.AddSingleton(Mock.Of<ISponsorDigestUnsubscribeTokenFactory>());
        services.AddSingleton(Mock.Of<IExecDigestSponsorDeepLinkTokenFactory>());
        services.AddSingleton(Mock.Of<IOptionsMonitor<EmailNotificationOptions>>());
        services.AddScoped<SponsorDigestWeeklyDeliveryScanner>();
        services.AddSingleton<ILogger<SponsorDigestWeeklyDeliveryScanner>>(
            NullLogger<SponsorDigestWeeklyDeliveryScanner>.Instance);

        return services.BuildServiceProvider();
    }
}
