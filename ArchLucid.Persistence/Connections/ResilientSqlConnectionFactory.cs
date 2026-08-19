using Microsoft.Data.SqlClient;

using Polly;

namespace ArchLucid.Persistence.Connections;

/// <summary>
///     Decorator over <see cref="ISqlConnectionFactory" /> that retries transient failures
///     using <see cref="ResiliencePipeline" /> (Microsoft.Extensions.Resilience / Polly).
/// </summary>
public sealed class ResilientSqlConnectionFactory(
    ISqlConnectionFactory inner,
    ResiliencePipeline sqlOpenRetryPipeline,
    SqlConnectionOpenAttemptTiming? openAttemptTiming = null) : ISqlConnectionFactory
{
    private readonly ISqlConnectionFactory _inner =
        inner ?? throw new ArgumentNullException(nameof(inner));

    private readonly ResiliencePipeline _sqlOpenRetryPipeline =
        sqlOpenRetryPipeline ?? throw new ArgumentNullException(nameof(sqlOpenRetryPipeline));

    private readonly SqlConnectionOpenAttemptTiming? _openAttemptTiming = openAttemptTiming;

    /// <inheritdoc />
    public async Task<SqlConnection> CreateOpenConnectionAsync(CancellationToken cancellationToken)
    {
        if (_openAttemptTiming is null)
            return await _sqlOpenRetryPipeline.ExecuteAsync(
                async ct => await _inner.CreateOpenConnectionAsync(ct),
                cancellationToken);

        _openAttemptTiming.BeginAttempt();

        try
        {
            return await _sqlOpenRetryPipeline.ExecuteAsync(
                async ct => await _inner.CreateOpenConnectionAsync(ct),
                cancellationToken);
        }
        finally
        {
            _openAttemptTiming.EndAttempt();
        }
    }
}
