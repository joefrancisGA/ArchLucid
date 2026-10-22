namespace ArchLucid.Persistence.Connections;

/// <summary>
///     Primary-catalog <see cref="ISqlConnectionFactory" /> for hosted workers and other paths that must not depend on
///     HTTP <see cref="ArchLucid.Core.Scoping.ScopeContext" /> (singleton; Polly retries on connection open).
/// </summary>
public interface IBackgroundWorkerSqlConnectionFactory : ISqlConnectionFactory;
