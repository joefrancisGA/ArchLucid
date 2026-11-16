using ArchLucid.Core.Analytics;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Tenancy;
using ArchLucid.Persistence.Analytics;
using ArchLucid.Persistence.Connections;

using Microsoft.Extensions.Options;

using Moq;

namespace ArchLucid.Persistence.Tests.Analytics;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class SqlInternalCrossTenantRetryTests
{
    [Theory]
    [InlineData(false)]
    [InlineData(true)]
    public async Task Tenant_timeout_retries_only_the_failing_catalog(bool useSummary)
    {
        CancellationToken ct = CancellationToken.None;
        Guid tenantId = Guid.NewGuid();
        Mock<IOptionsMonitor<SqlTopologyOptions>> topology = new();
        topology.Setup(monitor => monitor.CurrentValue)
            .Returns(new SqlTopologyOptions { Mode = SqlTopologyMode.SystemWithPerTenantCatalogs });

        Mock<ITenantDatabaseBindingRepository> bindings = new();
        bindings.Setup(repository => repository.ListBindingsWithStateAsync(TenantDatabaseProvisioningState.Active, ct))
            .ReturnsAsync(new[] { new TenantDatabaseBindingRecord { TenantId = tenantId } });

        Mock<ITenantDatabaseResolver> resolver = new();
        resolver.Setup(service => service.ResolveTenantConnectionStringAsync(tenantId, ct))
            .ThrowsAsync(new TimeoutException());

        SqlResilientOperationExecutor operations = new(SqlOpenResilienceDefaults.BuildSqlOperationRetryPipeline(
            maxRetryAttempts: 1,
            baseDelay: TimeSpan.FromMilliseconds(1)));
        IBackgroundWorkerSqlConnectionFactory factory = Mock.Of<IBackgroundWorkerSqlConnectionFactory>();

        Func<Task> query;
        if (useSummary)
        {
            IInternalCrossTenantRollupRepository rollups = Mock.Of<IInternalCrossTenantRollupRepository>();
            InternalCrossTenantRollupProcessor processor = new(
                Mock.Of<IInternalCrossTenantMetricsCollector>(), rollups,
                Mock.Of<IOptionsMonitor<InternalCrossTenantAnalyticsOptions>>());
            SqlInternalCrossTenantAnalyticsService service = new(
                factory, operations, topology.Object, bindings.Object, resolver.Object, rollups, processor);
            query = () => service.GetSummaryAsync(ct);
        }
        else
        {
            SqlInternalCrossTenantMetricsCollector collector = new(
                factory, operations, topology.Object, bindings.Object, resolver.Object);
            query = () => collector.CollectTenantMetricsAsync(new DateOnly(2026, 1, 1), ct);
        }

        await query.Should().ThrowAsync<TimeoutException>();
        resolver.Verify(service => service.ResolveTenantConnectionStringAsync(tenantId, ct), Times.Exactly(2));
        bindings.Verify(repository => repository.ListBindingsWithStateAsync(TenantDatabaseProvisioningState.Active, ct),
            Times.Once);
    }
}
