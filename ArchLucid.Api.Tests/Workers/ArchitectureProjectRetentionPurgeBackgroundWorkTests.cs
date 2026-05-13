using ArchLucid.Core.Audit;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Tenancy;
using ArchLucid.Host.Core.Hosted;

using FluentAssertions;

using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;

namespace ArchLucid.Api.Tests.Workers;

[Trait("Category", "Unit")]
public sealed class ArchitectureProjectRetentionPurgeBackgroundWorkTests
{
    [Fact]
    public async Task RunSinglePassAsync_when_disabled_does_not_purge()
    {
        PurgeSpy purge = new();
        AuditSpy audit = new();

        using ServiceProvider provider = BuildProvider(purge, audit);
        IServiceScopeFactory factory = provider.GetRequiredService<IServiceScopeFactory>();
        FixedOptionsMonitor monitor = new(
            new ArchitectureProjectRetentionPurgeOptions
            {
                Enabled = false,
            });

        await ArchitectureProjectRetentionPurgeBackgroundWork.RunSinglePassAsync(
            factory,
            monitor,
            NullLogger.Instance,
            CancellationToken.None);

        purge.PurgeCallCount.Should().Be(0);
        audit.LoggedEvents.Should().BeEmpty();
    }

    [Fact]
    public async Task RunSinglePassAsync_when_enabled_audits_each_deleted_project_id()
    {
        Guid projectId = Guid.NewGuid();
        Guid tenantId = Guid.NewGuid();
        Guid workspaceId = Guid.NewGuid();
        PurgeSpy purge = new();
        purge.DeletionsToReturn.Add(new ArchitectureProjectPurgeDeletion(projectId, tenantId, workspaceId));
        AuditSpy audit = new();

        using ServiceProvider provider = BuildProvider(purge, audit);
        IServiceScopeFactory factory = provider.GetRequiredService<IServiceScopeFactory>();
        FixedOptionsMonitor monitor = new(
            new ArchitectureProjectRetentionPurgeOptions
            {
                Enabled = true,
                RetentionDays = 30,
            });

        await ArchitectureProjectRetentionPurgeBackgroundWork.RunSinglePassAsync(
            factory,
            monitor,
            NullLogger.Instance,
            CancellationToken.None);

        purge.PurgeCallCount.Should().Be(1);
        audit.LoggedEvents.Should().ContainSingle();
        AuditEvent ev = audit.LoggedEvents[0];
        ev.EventType.Should().Be(AuditEventTypes.ArchitectureProjectHardPurgedRetention);
        ev.ProjectId.Should().Be(projectId);
        ev.TenantId.Should().Be(tenantId);
        ev.WorkspaceId.Should().Be(workspaceId);
        ev.DataJson.Should().Contain(projectId.ToString());
    }

    private static ServiceProvider BuildProvider(PurgeSpy purge, AuditSpy audit)
    {
        ServiceCollection services = new();
        services.AddSingleton<IArchitectureProjectRetentionPurgeService>(purge);
        services.AddSingleton<IAuditService>(audit);

        return services.BuildServiceProvider();
    }

    private sealed class PurgeSpy : IArchitectureProjectRetentionPurgeService
    {
        public List<ArchitectureProjectPurgeDeletion> DeletionsToReturn { get; } = [];

        public int PurgeCallCount
        {
            get;
            private set;
        }

        public Task<IReadOnlyList<ArchitectureProjectPurgeDeletion>> PurgeExpiredAsync(
            DateTimeOffset cutoffUtc,
            CancellationToken ct)
        {
            PurgeCallCount++;
            _ = cutoffUtc;
            _ = ct;

            return Task.FromResult<IReadOnlyList<ArchitectureProjectPurgeDeletion>>(DeletionsToReturn.ToList());
        }
    }

    private sealed class AuditSpy : IAuditService
    {
        public List<AuditEvent> LoggedEvents { get; } = [];

        public Task LogAsync(AuditEvent auditEvent, CancellationToken cancellationToken)
        {
            LoggedEvents.Add(auditEvent);
            _ = cancellationToken;

            return Task.CompletedTask;
        }
    }

    private sealed class FixedOptionsMonitor(ArchitectureProjectRetentionPurgeOptions value) : IOptionsMonitor<ArchitectureProjectRetentionPurgeOptions>
    {
        private readonly ArchitectureProjectRetentionPurgeOptions _value =
            value ?? throw new ArgumentNullException(nameof(value));

        public ArchitectureProjectRetentionPurgeOptions CurrentValue => _value;

        public ArchitectureProjectRetentionPurgeOptions Get(string? name) => _value;

        public IDisposable OnChange(Action<ArchitectureProjectRetentionPurgeOptions, string?> listener) => new EmptyDisposable();
    }

    private sealed class EmptyDisposable : IDisposable
    {
        public void Dispose()
        {
        }
    }
}
