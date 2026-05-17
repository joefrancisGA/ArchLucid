namespace ArchLucid.Core.Authority;

/// <summary>
///     Configures concurrency bulkheads for <see cref="AuthorityPipelineOptions" /> tenant execution slots.
///     Bind under <c>ArchLucid:AuthorityPipeline:Concurrency</c>.
/// </summary>
public sealed class AuthorityPipelineConcurrencyOptions
{
    /// <summary>
    ///     Maximum number of concurrently executing authority heavy-stage pipelines allowed per tenant. Use
    ///     <c>0</c> or a negative value to disable enforcement.
    /// </summary>
    public int MaxConcurrentExecutionsPerTenant
    {
        get;
        set;
    }

    /// <summary>
    ///     When <see langword="true" /> and <see cref="MaxConcurrentExecutionsPerTenant" /> is positive,
    ///     synchronous creates that run pipeline inline fail fast rather than blocking when slots are saturated.
    ///     Queued completions from the worker always wait for capacity.
    /// </summary>
    public bool RejectInlineCreateWhenConcurrencyUnavailable
    {
        get;
        set;
    }

    /// <summary>
    ///     Lease rows with acquisition timestamps strictly before UTC now minus this horizon are treated as orphaned and
    ///     removed opportunistically; they do not occupy capacity counts.
    /// </summary>
    public TimeSpan LeaseRecognitionHorizon
    {
        get;
        set;
    } = TimeSpan.FromHours(48);

    /// <summary>
    ///     Delay between retries when polling for SQL-backed capacity (worker / inline wait path).
    /// </summary>
    public int WaitPollMilliseconds
    {
        get;
        set;
    } = 75;
}
