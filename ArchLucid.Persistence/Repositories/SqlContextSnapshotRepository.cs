using System.Diagnostics.CodeAnalysis;

using ArchLucid.Contracts.Persistence.Ports;
using ArchLucid.Contracts.Scoping;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Connections;

namespace ArchLucid.Persistence.Repositories;

/// <summary>
///     SQL Server-backed <see cref="IContextSnapshotRepository" /> with dual-write to legacy JSON columns
///     and relational child tables; reads use child tables only (empty collections when no rows).
/// </summary>
[ExcludeFromCodeCoverage(Justification = "SQL-dependent repository; requires live SQL Server for integration testing.")]
public sealed partial class SqlContextSnapshotRepository(
    ISqlConnectionFactory connectionFactory,
    IScopeContextProvider scopeContextProvider) : IContextSnapshotRepository
{
    private readonly IScopeContextProvider _scopeContextProvider =
        scopeContextProvider ?? throw new ArgumentNullException(nameof(scopeContextProvider));

    private static ScopeContext ToScopeContext(ReadScopeTriple scope) =>
        new()
        {
            TenantId = scope.TenantId,
            WorkspaceId = scope.WorkspaceId,
            ProjectId = scope.ProjectId
        };
}
