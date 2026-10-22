namespace ArchLucid.Core.Diagnostics;

/// <summary>
///     Retrieval / RAG telemetry recording (vector search, rerank, Graph-RAG, index outbox signals).
/// </summary>
/// <remarks>
///     Instrument field declarations live in <c>ArchLucidInstrumentation.Retrieval.Instruments.cs</c>;
///     recording helpers live in <c>ArchLucidInstrumentation.Retrieval.Recorders.cs</c>.
/// </remarks>
public static partial class ArchLucidInstrumentation
{
    private static Func<bool>? _retrievalTelemetryPerTenantTagCircuitBreaker;

    /// <summary>
    ///     Supplies the RAG per-tenant tag circuit breaker (drops <c>tenant_id</c> when tenant estimates exceed safe
    ///     thresholds).
    /// </summary>
    public static void SetRetrievalTelemetryPerTenantTagCircuitBreaker(Func<bool>? shouldSuppressTenantIdTags) =>
        Volatile.Write(ref _retrievalTelemetryPerTenantTagCircuitBreaker, shouldSuppressTenantIdTags);
}
