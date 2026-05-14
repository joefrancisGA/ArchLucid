using ArchLucid.Decisioning.Advisory.Scheduling;
using ArchLucid.Host.Core.Configuration;
using ArchLucid.Host.Core.Hosted;
using ArchLucid.Persistence.Advisory;
using ArchLucid.Persistence.Data.Repositories;

using FluentAssertions;

using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;

using Moq;

namespace ArchLucid.Host.Core.Tests;

/// <summary>Validates the advisory scan background loop invokes due processing on a configurable cadence under leader election.</summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class AdvisoryScanHostedServiceTests
{
    /// <summary>
    /// Poll interval is shortened so the test stays sub-second; production default remains five minutes via options binding.
    /// </summary>
    [Fact]
    public async Task PollLoop_invokes_schedule_repository_and_runner_when_due_rows_exist()
    {
        int listDueCalls = 0;
        AdvisoryScanSchedule dueRow = new()
        {
            TenantId = Guid.NewGuid(),
            WorkspaceId = Guid.NewGuid(),
            ProjectId = Guid.NewGuid(),
        };

        Mock<IAdvisoryScanScheduleRepository> scheduleRepo = new();
        scheduleRepo
            .Setup(r => r.ListDueAsync(It.IsAny<DateTime>(), It.IsAny<int>(), It.IsAny<CancellationToken>()))
            .Returns(
                (DateTime _, int _, CancellationToken _) =>
                {
                    listDueCalls++;

                    return Task.FromResult<IReadOnlyList<AdvisoryScanSchedule>>(listDueCalls == 1 ? [dueRow] : []);
                });

        Mock<IAdvisoryScanRunner> runner = new();
        runner
            .Setup(r => r.RunScheduleAsync(It.IsAny<AdvisoryScanSchedule>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        ServiceCollection services = [];
        services.AddScoped(_ => scheduleRepo.Object);
        services.AddScoped(_ => runner.Object);
        services.AddScoped<AdvisoryDueScheduleProcessor>();
        services.AddLogging();
        ServiceProvider provider = services.BuildServiceProvider();

        Mock<IOptionsMonitor<HostLeaderElectionOptions>> electionOpts = new();
        electionOpts.Setup(o => o.CurrentValue).Returns(new HostLeaderElectionOptions { Enabled = false });

        HostLeaderElectionCoordinator coordinator = new(
            electionOpts.Object,
            new NoOpHostLeaderLeaseRepository(),
            HostInstanceIdentifier.ForTests("host-core-tests"),
            NullLogger<HostLeaderElectionCoordinator>.Instance);

        IOptions<AdvisoryScanHostedServiceOptions> pollOptions = Options.Create(
            new AdvisoryScanHostedServiceOptions { PollInterval = TimeSpan.FromMilliseconds(80) });

        AdvisoryScanHostedService sut = new(
            provider,
            coordinator,
            pollOptions,
            NullLogger<AdvisoryScanHostedService>.Instance);

        using CancellationTokenSource cts = new();
        await sut.StartAsync(cts.Token);

        await Task.Delay(250, CancellationToken.None);

        await cts.CancelAsync();
        await sut.StopAsync(CancellationToken.None);

        listDueCalls.Should().BeGreaterThanOrEqualTo(
            2,
            "host should poll at least twice when the inter-poll delay is shorter than the test window");

        runner.Verify(
            r => r.RunScheduleAsync(dueRow, It.IsAny<CancellationToken>()),
            Times.Once);
    }
}
