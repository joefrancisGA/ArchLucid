using System.Data;
using System.Diagnostics.CodeAnalysis;

using ArchLucid.Contracts.Metadata;
using ArchLucid.Persistence.Connections;
using ArchLucid.Persistence.Data.Infrastructure;

namespace ArchLucid.Persistence.Data.Repositories;

/// <summary>
///     Dapper persistence for comparison records. Read/search paths use
///     <see cref="IReadOnlyDbConnectionFactory" /> (read replica when configured).
/// </summary>
[ExcludeFromCodeCoverage(Justification = "SQL-dependent repository; requires live SQL Server for integration testing.")]
public sealed partial class ComparisonRecordRepository : IComparisonRecordRepository
{
    private readonly IDbConnectionFactory _connectionFactory;
    private readonly IReadOnlyDbConnectionFactory _readConnectionFactory;

    public ComparisonRecordRepository(
        IDbConnectionFactory connectionFactory,
        IReadOnlyDbConnectionFactory readConnectionFactory)
    {
        _connectionFactory = connectionFactory ?? throw new ArgumentNullException(nameof(connectionFactory));
        _readConnectionFactory = readConnectionFactory ?? throw new ArgumentNullException(nameof(readConnectionFactory));
        ListStringTypeHandler.Register();
    }
}
