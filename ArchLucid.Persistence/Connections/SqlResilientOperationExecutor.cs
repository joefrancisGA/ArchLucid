using Polly;

namespace ArchLucid.Persistence.Connections;

/// <summary>
///     Runs a SQL unit of work (open + commands) under the standard transient retry pipeline from
///     <see cref="SqlOpenResilienceDefaults" />.
/// </summary>
public sealed class SqlResilientOperationExecutor(ResiliencePipeline sqlTransientRetryPipeline)
{
    private readonly ResiliencePipeline _sqlTransientRetryPipeline =
        sqlTransientRetryPipeline ?? throw new ArgumentNullException(nameof(sqlTransientRetryPipeline));

    public async Task ExecuteAsync(Func<CancellationToken, Task> action, CancellationToken cancellationToken)
    {
        await _sqlTransientRetryPipeline.ExecuteAsync(
            async ct =>
            {
                await action(ct).ConfigureAwait(false);
            },
            cancellationToken).ConfigureAwait(false);
    }

    public async Task<T> ExecuteAsync<T>(Func<CancellationToken, Task<T>> action, CancellationToken cancellationToken)
    {
        return await _sqlTransientRetryPipeline.ExecuteAsync(
            async ct => await action(ct).ConfigureAwait(false),
            cancellationToken).ConfigureAwait(false);
    }
}
