using System.Diagnostics;
using System.Diagnostics.Metrics;

namespace ArchLucid.Core.Diagnostics;

/// <summary>
///     Shared <see cref="ActivitySource" /> and <see cref="Meter" /> names for cross-cutting observability (OTel wiring in
///     the API host).
/// </summary>
/// <remarks>
///     This file owns the shared meter and activity-source aliases.
///     Instrument catalogs, recording helpers, and observable-gauge registration live in subsystem partials:
///     <c>ArchLucidInstrumentation.{Subsystem}.cs</c> (Agent, Audit, Caches, GrowthFunnel, Integration, Llm,
///     LlmWallet, ObservableGauges, Operations, Retrieval, Runs).
/// </remarks>
public static partial class ArchLucidInstrumentation
{
    /// <summary>Maximum characters for optional GenAI span payloads gated by <c>LlmTelemetry:CapturePromptResponseOnSpans</c>.</summary>
    public const int SensitiveGenAiTelemetrySnapshotMaxChars = 65536;

    /// <summary>Meter name registered with OpenTelemetry in <c>AddArchLucidOpenTelemetry</c>.</summary>
    public static string MeterName => ArchLucidMeterNames.Meter;

    private static Meter AppMeter => ArchLucidAppMeter.Instance;

    /// <summary>Root span name for <see cref="AuthorityRun" /> (matches <c>authority.*</c> stage naming for trace sampling).</summary>
    public const string AuthorityRunRootActivityName = "authority.run";

    /// <summary>Scheduled advisory scan pipeline (<c>AdvisoryScanRunner</c>).</summary>
    public static ActivitySource AdvisoryScan => ArchLucidActivitySources.AdvisoryScan;

    /// <summary>Authority run orchestration (ingestion → manifest).</summary>
    public static ActivitySource AuthorityRun => ArchLucidActivitySources.AuthorityRun;

    /// <summary>Post-commit retrieval indexing of committed runs.</summary>
    public static ActivitySource RetrievalIndex => ArchLucidActivitySources.RetrievalIndex;

    /// <summary>One span per production agent handler invocation (<c>RealAgentExecutor</c>).</summary>
    public static ActivitySource AgentHandler => ArchLucidActivitySources.AgentHandler;

    /// <summary>Staged batch phases in <c>RealAgentExecutor</c> (e.g. Phase 1 vs Critic).</summary>
    public static ActivitySource AgentExecution => ArchLucidActivitySources.AgentExecution;

    /// <summary>Azure OpenAI chat completion calls (nested under agent handler when a trace is active).</summary>
    public static ActivitySource AgentLlmCompletion => ArchLucidActivitySources.AgentLlmCompletion;

    /// <summary>Azure OpenAI text-embedding RPCs (retrieval indexer / evidence embeddings).</summary>
    public static ActivitySource AgentLlmEmbedding => ArchLucidActivitySources.AgentLlmEmbedding;

    /// <summary>Retrieval indexing outbox batch processor (<c>RetrievalIndexingOutboxProcessor</c>).</summary>
    public static ActivitySource RetrievalIndexingOutbox => ArchLucidActivitySources.RetrievalIndexingOutbox;

    /// <summary>Integration event Service Bus publish outbox (<c>IntegrationEventOutboxProcessor</c>).</summary>
    public static ActivitySource IntegrationEventOutbox => ArchLucidActivitySources.IntegrationEventOutbox;

    /// <summary>Scheduled data retention archival (<c>DataArchivalCoordinator</c>).</summary>
    public static ActivitySource DataArchival => ArchLucidActivitySources.DataArchival;

    /// <summary>Evidence ZIP expansion (<c>ZipEvidenceExpanderService</c>).</summary>
    public static ActivitySource EvidenceZipExpansion => ArchLucidActivitySources.EvidenceZipExpansion;

    /// <summary>Azure extractor package upload ingest (<c>AzureExtractorIngestService</c>).</summary>
    public static ActivitySource AzureExtractorUpload => ArchLucidActivitySources.AzureExtractorUpload;

    /// <summary>AWS/GCP inventory package upload ingest (<c>CloudInventoryExtractorIngestService</c>).</summary>
    public static ActivitySource CloudInventoryExtractorUpload =>
        ArchLucidActivitySources.CloudInventoryExtractorUpload;

}
