using System.Diagnostics.CodeAnalysis;

using ArchLucid.Persistence.Connections;

namespace ArchLucid.Persistence.Coordination.ProductLearning;

/// <summary>Dapper access to <c>dbo.ProductLearningPilotSignals</c>.</summary>
[ExcludeFromCodeCoverage(Justification = "SQL-dependent repository; requires live SQL Server for integration testing.")]
public sealed partial class DapperProductLearningPilotSignalRepository(ISqlConnectionFactory connectionFactory)
    : IProductLearningPilotSignalRepository
{
    private readonly ISqlConnectionFactory _connectionFactory =
        connectionFactory ?? throw new ArgumentNullException(nameof(connectionFactory));
}
