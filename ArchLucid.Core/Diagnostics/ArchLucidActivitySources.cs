using System.Diagnostics;

namespace ArchLucid.Core.Diagnostics;

/// <summary>
///     OpenTelemetry <see cref="ActivitySource" /> instances for ArchLucid. Kept separate from
///     <see cref="ArchLucidInstrumentation" /> so their constructors (which notify global
///     <see cref="ActivityListener" /> subscribers) run only after instrumentation meters are initialized.
/// </summary>
internal static class ArchLucidActivitySources
{
    public static readonly ActivitySource AdvisoryScan = new(ArchLucidMeterNames.AdvisoryScanActivitySource, "1.0.0");

    public static readonly ActivitySource AuthorityRun = new(ArchLucidMeterNames.AuthorityRunActivitySource, "1.0.0");

    public static readonly ActivitySource RetrievalIndex = new(ArchLucidMeterNames.RetrievalIndexActivitySource, "1.0.0");

    public static readonly ActivitySource AgentHandler = new(ArchLucidMeterNames.AgentHandlerActivitySource, "1.0.0");

    public static readonly ActivitySource AgentExecution = new(ArchLucidMeterNames.AgentExecutionActivitySource, "1.0.0");

    public static readonly ActivitySource AgentLlmCompletion = new(ArchLucidMeterNames.AgentLlmCompletionActivitySource, "1.0.0");

    public static readonly ActivitySource AgentLlmEmbedding = new(ArchLucidMeterNames.AgentLlmEmbeddingActivitySource, "1.0.0");

    public static readonly ActivitySource RetrievalIndexingOutbox =
        new(ArchLucidMeterNames.RetrievalIndexingOutboxActivitySource, "1.0.0");

    public static readonly ActivitySource IntegrationEventOutbox =
        new(ArchLucidMeterNames.IntegrationEventOutboxActivitySource, "1.0.0");

    public static readonly ActivitySource DataArchival = new(ArchLucidMeterNames.DataArchivalActivitySource, "1.0.0");

    public static readonly ActivitySource EvidenceZipExpansion =
        new(ArchLucidMeterNames.EvidenceZipExpansionActivitySource, "1.0.0");

    public static readonly ActivitySource AzureExtractorUpload =
        new(ArchLucidMeterNames.AzureExtractorUploadActivitySource, "1.0.0");
}
