using System.Diagnostics.CodeAnalysis;

using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Connections;
using ArchLucid.Persistence.Findings;

namespace ArchLucid.Persistence.Repositories;

/// <summary>
///     SQL Server-backed <see cref="IFindingsSnapshotRepository" /> with dual-write to <c>FindingsJson</c> and relational
///     finding tables; reads prefer <c>dbo.FindingRecords</c> and fall back to <c>FindingsJson</c> when no rows exist.
///     Typed <see cref="Finding.Payload" /> is stored only in <c>FindingRecords.PayloadJson</c> (sidecar). All other
///     finding
///     fields and trace lists are relational with stable <c>SortOrder</c>. <see cref="FindingsSnapshotMigrator" /> runs on
///     save and after load so schema versioning stays consistent.
/// </summary>
[ExcludeFromCodeCoverage(Justification = "SQL-dependent repository; requires live SQL Server for integration testing.")]
public sealed partial class SqlFindingsSnapshotRepository(
    ISqlConnectionFactory writeConnectionFactory,
    IReadOnlyDbConnectionFactory readConnectionFactory,
    IScopeContextProvider scopeContextProvider) : IFindingsSnapshotRepository
{
    private readonly ISqlConnectionFactory _writeConnectionFactory =
        writeConnectionFactory ?? throw new ArgumentNullException(nameof(writeConnectionFactory));

    private readonly IReadOnlyDbConnectionFactory _readConnectionFactory =
        readConnectionFactory ?? throw new ArgumentNullException(nameof(readConnectionFactory));

    private readonly IScopeContextProvider _scopeContextProvider =
        scopeContextProvider ?? throw new ArgumentNullException(nameof(scopeContextProvider));
}
