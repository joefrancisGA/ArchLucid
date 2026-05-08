using System.Data;

namespace ArchLucid.Persistence.Data.Infrastructure;

/// <summary>
///     Abstraction for Dapper repositories and health checks that need <see cref="IDbConnection" />.
/// </summary>
/// <remarks>
///     <para>
///         <strong>SQL storage (API / worker hosts):</strong> register exactly
///         <see cref="ArchLucid.Host.Core.DataAccess.SqlScopedResolutionDbConnectionFactory" /> as a singleton
///         (<see cref="ArchLucid.Host.Composition.Configuration.SqlStorageProviderRegistrar" />). Its
///         <see cref="CreateOpenConnectionAsync" /> resolves scoped
///         <see cref="ArchLucid.Persistence.Connections.ISqlConnectionFactory" /> so tenant routing, resilience, and
///         session context stay aligned. Do not add parallel <c>IDbConnectionFactory</c> types that read
///         <c>ConnectionStrings:ArchLucid</c> directly from configuration for product code.
///     </para>
///     <para><strong>In-memory storage:</strong> use <see cref="UnsupportedRelationalDbConnectionFactory" />.</para>
/// </remarks>
public interface IDbConnectionFactory
{
    IDbConnection CreateConnection();

    /// <summary>
    ///     Creates and asynchronously opens a new database connection.
    /// </summary>
    Task<IDbConnection> CreateOpenConnectionAsync(CancellationToken cancellationToken = default);
}
