using System.Diagnostics.CodeAnalysis;

using ArchLucid.Core.Persistence;
using ArchLucid.Core.Tenancy;
using ArchLucid.Persistence.Connections;
using ArchLucid.Persistence.Interfaces;

namespace ArchLucid.Persistence.Repositories;

/// <summary>
///     SQL Server-backed implementation of <see cref="IRunRepository" />.
///     Persists and retrieves <see cref="RunRecord" /> rows from the <c>dbo.Runs</c> table.
///     All read operations are scoped to the caller's tenant, workspace, and project.
/// </summary>
/// <remarks>
///     Aggregate methods live in <c>SqlRunRepository.{Write|Query|List}.cs</c> partials.
///     The type remains one <see cref="IRunRepository" /> implementation and DI registration.
/// </remarks>
[ExcludeFromCodeCoverage(Justification = "SQL-dependent repository; requires live SQL Server for integration testing.")]
public sealed partial class SqlRunRepository(
    ISqlConnectionFactory connectionFactory,
    IAuthorityRunListConnectionFactory authorityRunListConnectionFactory,
    ITenantRepository tenantRepository) : IRunRepository
{
    private readonly ITenantRepository _tenantRepository =
        tenantRepository ?? throw new ArgumentNullException(nameof(tenantRepository));
}
