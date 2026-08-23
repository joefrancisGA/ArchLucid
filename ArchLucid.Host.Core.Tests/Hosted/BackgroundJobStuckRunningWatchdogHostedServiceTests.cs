using ArchLucid.Host.Core.Configuration;
using ArchLucid.Host.Core.Hosted;
using ArchLucid.Host.Core.Jobs;
using ArchLucid.Persistence.Data.Repositories;

using FluentAssertions;

using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;

using Moq;

namespace ArchLucid.Host.Core.Tests.Hosted;

[Trait("Category", "Unit")]
public sealed class BackgroundJobStuckRunningWatchdogHostedServiceTests
{
    [Fact]
    public void ResolveStaleRunningThreshold_exceeds_processor_visibility_minutes()
    {
        BackgroundJobsOptions options = new() { ProcessorVisibilityMinutes = 15 };

        TimeSpan stale = BackgroundJobStuckRunningWatchdogHostedService.ResolveStaleRunningThreshold(options);
        TimeSpan visibility = TimeSpan.FromMinutes(options.ProcessorVisibilityMinutes);

        stale.Should().BeGreaterThan(visibility);
    }

    [Fact]
    public void ResolveStaleRunningThreshold_clamps_visibility_to_supported_range()
    {
        BackgroundJobsOptions options = new() { ProcessorVisibilityMinutes = 0 };

        TimeSpan stale = BackgroundJobStuckRunningWatchdogHostedService.ResolveStaleRunningThreshold(options);

        stale.Should().BeGreaterThan(TimeSpan.FromMinutes(1));
    }

    [Fact]
    public async Task RunSinglePassAsync_renotifies_queue_for_each_job_moved_back_to_pending()
    {
        Mock<IBackgroundJobRepository> repository = new();
        Mock<IBackgroundJobQueueNotifySender> notifySender = new();

        repository
            .Setup(r => r.ResetStaleRunningJobsOlderThanAsync(It.IsAny<TimeSpan>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new[] { "job-a", "job-b" });

        notifySender
            .Setup(n => n.SendJobIdAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        ServiceCollection services = new();
        services.AddSingleton(repository.Object);
        services.AddSingleton(notifySender.Object);
        await using ServiceProvider provider = services.BuildServiceProvider();

        await BackgroundJobStuckRunningWatchdogBackgroundWork.RunSinglePassAsync(
            provider.GetRequiredService<IServiceScopeFactory>(),
            Options.Create(new BackgroundJobsOptions { ProcessorVisibilityMinutes = 15 }),
            NullLogger.Instance,
            CancellationToken.None);

        notifySender.Verify(n => n.SendJobIdAsync("job-a", It.IsAny<CancellationToken>()), Times.Once);
        notifySender.Verify(n => n.SendJobIdAsync("job-b", It.IsAny<CancellationToken>()), Times.Once);
    }
}
