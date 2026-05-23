namespace ArchLucid.Core.Diagnostics;

/// <summary>
///     Well-known OpenTelemetry meter and activity source names. Lives outside
///     <see cref="ArchLucidInstrumentation" /> so listener callbacks can filter without re-entering
///     instrumentation static initialization.
/// </summary>
/// <remarks>
///     Do not use <c>public const string</c> for these values: NetArchTest scans compile-time string
///     constants on fields for <c>HaveDependencyOnAny</c> and treats values such as
///     <c>ArchLucid.Retrieval.Index</c> as forbidden namespace dependencies (see
///     <see cref="Configuration.ArchLucidPersistenceOptions" />).
/// </remarks>
public static class ArchLucidMeterNames
{
    public static string Meter => string.Concat("ArchLucid");

    public static string AdvisoryScanActivitySource => string.Concat("ArchLucid", ".AdvisoryScan");

    public static string AuthorityRunActivitySource => string.Concat("ArchLucid", ".AuthorityRun");

    public static string RetrievalIndexActivitySource => string.Concat("ArchLucid", ".Retrieval", ".Index");

    public static string AgentHandlerActivitySource => string.Concat("ArchLucid", ".Agent.Handler");

    public static string AgentExecutionActivitySource => string.Concat("ArchLucid", ".Agent.Execution");

    public static string AgentLlmCompletionActivitySource => string.Concat("ArchLucid", ".Agent.LlmCompletion");

    public static string AgentLlmEmbeddingActivitySource => string.Concat("ArchLucid", ".Agent.LlmEmbedding");

    public static string RetrievalIndexingOutboxActivitySource =>
        string.Concat("ArchLucid", ".RetrievalIndexing", ".Outbox");

    public static string IntegrationEventOutboxActivitySource =>
        string.Concat("ArchLucid", ".IntegrationEvent", ".Outbox");

    public static string DataArchivalActivitySource => string.Concat("ArchLucid", ".DataArchival");

    public static string EvidenceZipExpansionActivitySource =>
        string.Concat("ArchLucid", ".Evidence", ".ZipExpansion");

    public static string AzureExtractorUploadActivitySource =>
        string.Concat("ArchLucid", ".AzureExtractor", ".Upload");
}
