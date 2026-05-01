using ArchLucid.Application.DataConsistency;
using ArchLucid.Core.Configuration;
using ArchLucid.Persistence.Data.Infrastructure;
using ArchLucid.Persistence.Interfaces;

using FluentAssertions;

using Microsoft.Extensions.Logging.Abstractions;

using Moq;

namespace ArchLucid.Application.Tests.DataConsistency;

public sealed class DataConsistencyReconciliationServiceTests
{
    [SkippableFact]
    public async Task RunReconciliationAsync_when_storage_is_in_memory_skips_sql_and_is_healthy()
    {
        Mock<IDbConnectionFactory> connectionFactory = new(MockBehavior.Strict);
        Mock<IRunRepository> runRepository = new(MockBehavior.Strict);
        Mock<IArchLucidStorageMode> storage = new();
        storage.Setup(s => s.IsInMemory).Returns(true);

        DataConsistencyReconciliationService sut = new(
            connectionFactory.Object,
            runRepository.Object,
            storage.Object,
            NullLogger<DataConsistencyReconciliationService>.Instance);

        DataConsistencyReport report = await sut.RunReconciliationAsync(CancellationToken.None);

        report.IsHealthy.Should().BeTrue();
        report.Findings.Should().ContainSingle(f => f.Severity == DataConsistencyFindingSeverity.Info);
        connectionFactory.Verify(f => f.CreateConnection(), Times.Never);
    }
}
