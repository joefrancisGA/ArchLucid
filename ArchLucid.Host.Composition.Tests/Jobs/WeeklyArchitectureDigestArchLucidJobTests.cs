using ArchLucid.Application.WeeklyArchitectureDigest;
using ArchLucid.Host.Core.Jobs;
using ArchLucid.Persistence.WeeklyDigest;

using FluentAssertions;

using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Logging.Abstractions;

using Moq;

namespace ArchLucid.Host.Composition.Tests.Jobs;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class WeeklyArchitectureDigestArchLucidJobTests
{
    [Fact]
    public void Name_is_canonical_weekly_architecture_digest_slug()
    {
        WeeklyArchitectureDigestArchLucidJob job =
            new(Mock.Of<IServiceProvider>(), NullLogger<WeeklyArchitectureDigestArchLucidJob>.Instance);

        job.Name.Should().Be(ArchLucidJobNames.WeeklyArchitectureDigest);
    }

    [Fact]
    public async Task RunOnceAsync_returns_success_with_in_memory_repository()
    {
        await using ServiceProvider provider = BuildScopedProvider();

        WeeklyArchitectureDigestArchLucidJob job =
            new(provider, NullLogger<WeeklyArchitectureDigestArchLucidJob>.Instance);

        int code = await job.RunOnceAsync(CancellationToken.None);

        code.Should().Be(ArchLucidJobExitCodes.Success);
    }

    private static ServiceProvider BuildScopedProvider()
    {
        ServiceCollection services = [];
        services.AddSingleton<IWeeklyArchitectureCriticalFindingSummaryRepository,
            InMemoryWeeklyArchitectureCriticalFindingSummaryRepository>();
        services.AddOptions();
        services.Configure<WeeklyArchitectureDigestOptions>(static _ => { });
        services.AddSingleton(TimeProvider.System);
        services.AddSingleton<ILogger<WeeklyArchitectureDigestJobRunner>>(
            NullLogger<WeeklyArchitectureDigestJobRunner>.Instance);
        services.AddScoped<WeeklyArchitectureDigestJobRunner>();

        return services.BuildServiceProvider();
    }
}
