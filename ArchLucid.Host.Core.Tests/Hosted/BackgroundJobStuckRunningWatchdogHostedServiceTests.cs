using ArchLucid.Host.Core.Configuration;
using ArchLucid.Host.Core.Hosted;

using FluentAssertions;

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
}
