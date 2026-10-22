namespace ArchLucid.Core.Tenancy;

/// <summary>Persistence for <c>dbo.Tenants</c> / <c>dbo.TenantWorkspaces</c>.</summary>
/// <remarks>
///     Composed from per-aggregate interfaces so callers can depend on the slice they use (for example a background
///     purge worker needs only <see cref="ITenantErasureRepository" />). The composed interface is retained because the
///     Dapper, in-memory, and caching implementations each cover every aggregate, and existing consumers resolve this
///     type from DI.
/// </remarks>
public interface ITenantRepository
    : ITenantDirectoryReader,
        ITenantLifecycleRepository,
        ITenantWorkspaceRepository,
        ITenantTrialRepository,
        ITenantSeatRepository,
        ITenantErasureRepository
{
}
