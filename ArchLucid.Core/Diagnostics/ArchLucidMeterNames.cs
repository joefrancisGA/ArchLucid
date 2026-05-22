namespace ArchLucid.Core.Diagnostics;

/// <summary>
///     Well-known OpenTelemetry meter and activity source names. Lives outside
///     <see cref="ArchLucidInstrumentation" /> so listener callbacks can filter without re-entering
///     instrumentation static initialization.
/// </summary>
public static class ArchLucidMeterNames
{
    public const string Meter = "ArchLucid";

    public const string AdvisoryScanActivitySource = "ArchLucid.AdvisoryScan";

    public const string AuthorityRunActivitySource = "ArchLucid.AuthorityRun";

    public const string RetrievalIndexActivitySource = "ArchLucid.Retrieval.Index";

    public const string AgentHandlerActivitySource = "ArchLucid.Agent.Handler";

    public const string AgentExecutionActivitySource = "ArchLucid.Agent.Execution";

    public const string AgentLlmCompletionActivitySource = "ArchLucid.Agent.LlmCompletion";

    public const string AgentLlmEmbeddingActivitySource = "ArchLucid.Agent.LlmEmbedding";

    public const string RetrievalIndexingOutboxActivitySource = "ArchLucid.RetrievalIndexing.Outbox";

    public const string IntegrationEventOutboxActivitySource = "ArchLucid.IntegrationEvent.Outbox";

    public const string DataArchivalActivitySource = "ArchLucid.DataArchival";

    public const string EvidenceZipExpansionActivitySource = "ArchLucid.Evidence.ZipExpansion";
}
