using System.Collections.Concurrent;

using ArchLucid.Core.Persistence;
using ArchLucid.Core.Tenancy;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Models;
using ArchLucid.Persistence.Tenancy;

namespace ArchLucid.Persistence.Repositories;

/// <summary>
///     In-memory implementation of <see cref="IRunRepository" /> for testing and local development.
///     Capped at <see cref="MaxEntries" /> entries; when full, the oldest run (by <c>CreatedUtc</c>) is
///     evicted on each new insert to prevent unbounded growth.
///     All reads are filtered to the caller's tenant, workspace, and project scope.
/// </summary>
/// <remarks>
///     Aggregate methods live in <c>InMemoryRunRepository.{Write|Query|List}.cs</c> partials.
///     The type remains one <see cref="IRunRepository" /> implementation and DI registration.
/// </remarks>
public sealed partial class InMemoryRunRepository(ITenantRepository? tenantRepository = null) : IRunRepository
{
    private const int MaxEntries = 2_000;

    private readonly ConcurrentDictionary<Guid, RunRecord> _store = new();

    private readonly ITenantRepository _tenantRepository = tenantRepository ?? new InMemoryTenantRepository();

    private long _fakeRowVersion;
}
