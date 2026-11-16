using ArchLucid.Core.AdminNotifications;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Scim;
using ArchLucid.Host.Core.Configuration;
using ArchLucid.Host.Core.Hosted;
using ArchLucid.Persistence.Data.Repositories;

using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;

using Moq;

namespace ArchLucid.Host.Core.Tests.Hosted;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class ScimTokenRotationReminderHostedServiceTests
{
    [Fact]
    public async Task Failed_token_query_preserves_worker_cadence_when_error_logging_is_disabled()
    {
        using CancellationTokenSource timeout = new(TimeSpan.FromSeconds(5));
        Mock<IScimTenantTokenRepository> tokens = new();
        tokens.Setup(r => r.ListActiveCreatedOnOrBeforeAsync(It.IsAny<DateTimeOffset>(), It.IsAny<CancellationToken>()))
            .ThrowsAsync(new InvalidOperationException("Temporary storage failure"));

        using ServiceProvider provider = new ServiceCollection()
            .AddSingleton(tokens.Object)
            .AddSingleton(Mock.Of<IAdminNotificationsRepository>())
            .BuildServiceProvider();
        Mock<IOptionsMonitor<ScimOptions>> options = new();
        options.SetupGet(o => o.CurrentValue).Returns(new ScimOptions());
        Mock<IOptionsMonitor<HostLeaderElectionOptions>> electionOptions = new();
        electionOptions.SetupGet(o => o.CurrentValue).Returns(new HostLeaderElectionOptions { Enabled = false });
        HostLeaderElectionCoordinator coordinator = new(
            electionOptions.Object,
            Mock.Of<IHostLeaderLeaseRepository>(),
            HostInstanceIdentifier.ForTests("test-instance"),
            NullLogger<HostLeaderElectionCoordinator>.Instance);
        TestClock clock = new();
        using ScimTokenRotationReminderHostedService service = new(
            provider.GetRequiredService<IServiceScopeFactory>(),
            options.Object,
            NullLogger<ScimTokenRotationReminderHostedService>.Instance,
            coordinator,
            clock);

        await service.StartAsync(timeout.Token);
        try
        {
            Task next = await Task.WhenAny(clock.CadenceScheduled.Task, service.ExecuteTask!).WaitAsync(timeout.Token);
            Assert.Same(clock.CadenceScheduled.Task, next);
            Assert.Equal(TimeSpan.FromHours(24), await clock.CadenceScheduled.Task);
        }
        finally
        {
            await service.StopAsync(timeout.Token);
        }

        await service.ExecuteTask!;
    }

    private sealed class TestClock : TimeProvider
    {
        public TaskCompletionSource<TimeSpan> CadenceScheduled { get; } =
            new(TaskCreationOptions.RunContinuationsAsynchronously);

        public override ITimer CreateTimer(TimerCallback callback, object? state, TimeSpan dueTime, TimeSpan period)
        {
            if (dueTime == TimeSpan.FromMinutes(2))
                return System.CreateTimer(callback, state, TimeSpan.Zero, period);

            CadenceScheduled.TrySetResult(dueTime);
            return System.CreateTimer(callback, state, Timeout.InfiniteTimeSpan, period);
        }
    }
}
