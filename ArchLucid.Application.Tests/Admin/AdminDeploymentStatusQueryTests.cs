using ArchLucid.Application.Admin;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Diagnostics;

using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using Microsoft.Extensions.Options;

using Moq;

namespace ArchLucid.Application.Tests.Admin;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class AdminDeploymentStatusQueryTests
{
    [Theory]
    [InlineData(true)]
    [InlineData(false)]
    public async Task GetAsync_PropagatesCallerCancellation(bool cancelDuringHealthCheck)
    {
        using CancellationTokenSource cancellation = new();
        CancellationToken token = cancellation.Token;
        Mock<IHostBuildInfoAccessor> buildInfo = new();
        buildInfo.Setup(accessor => accessor.GetBuildInfo()).Returns(new BuildInfoResponse());
        Mock<HealthCheckService> health = new();
        health.Setup(service => service.CheckHealthAsync(It.IsAny<Func<HealthCheckRegistration, bool>>(), token))
            .Returns(() =>
            {
                if (!cancelDuringHealthCheck)
                    return Task.FromResult(new HealthReport(new Dictionary<string, HealthReportEntry>(), TimeSpan.Zero));

                cancellation.Cancel();
                return Task.FromCanceled<HealthReport>(token);
            });
        Mock<ISchemaVersionsJournalReader> journal = new();
        journal.Setup(reader => reader.GetSnapshotAsync(token)).Returns(() =>
        {
            cancellation.Cancel();
            return Task.FromCanceled<SchemaVersionsJournalSnapshot>(token);
        });

        AdminDeploymentStatusQuery query = new(
            buildInfo.Object,
            new ConfigurationBuilder().Build(),
            TimeProvider.System,
            health.Object,
            journal.Object,
            Options.Create(new DeploymentStatusOptions()));

        OperationCanceledException exception = await Assert.ThrowsAnyAsync<OperationCanceledException>(
            () => query.GetAsync(null, token));
        Assert.Equal(token, exception.CancellationToken);
        journal.Verify(reader => reader.GetSnapshotAsync(token), cancelDuringHealthCheck ? Times.Never() : Times.Once());
    }
}
