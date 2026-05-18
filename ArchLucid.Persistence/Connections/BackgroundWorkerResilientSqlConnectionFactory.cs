using Microsoft.Data.SqlClient;

using Polly;

namespace ArchLucid.Persistence.Connections;

/// <summary>
///     Polly-backed primary-catalog connection factory for hosted workers (delegates to
///     <see cref="ResilientSqlConnectionFactory" />).
/// </summary>
public sealed class BackgroundWorkerResilientSqlConnectionFactory : IBackgroundWorkerSqlConnectionFactory
{
    private readonly ResilientSqlConnectionFactory _inner;

    public BackgroundWorkerResilientSqlConnectionFactory(
        SqlConnectionFactory inner,
        ResiliencePipeline sqlOpenRetryPipeline)
    {
        _inner = new ResilientSqlConnectionFactory(
            inner ?? throw new ArgumentNullException(nameof(inner)),
            sqlOpenRetryPipeline ?? throw new ArgumentNullException(nameof(sqlOpenRetryPipeline)));
    }

    /// <inheritdoc />
    public Task<SqlConnection> CreateOpenConnectionAsync(CancellationToken cancellationToken) =>
        _inner.CreateOpenConnectionAsync(cancellationToken);
}
