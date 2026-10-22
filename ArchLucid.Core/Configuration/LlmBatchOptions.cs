using System.Diagnostics.CodeAnalysis;

namespace ArchLucid.Core.Configuration;

/// <summary>
///     Azure OpenAI Batch API routing for non-interactive LLM paths (nightly eval refresh, offline judges, manifest
///     summarization when explicitly enabled).
/// </summary>
[ExcludeFromCodeCoverage(Justification = "Configuration binding DTO with no logic.")]
public sealed class LlmBatchOptions
{
    public const string SectionPath = "ArchLucid:LlmBatch";

    /// <summary>When true, offline batch routing may use the Azure OpenAI Batch API instead of synchronous chat completions.</summary>
    public bool Enabled
    {
        get;
        set;
    }

    /// <summary>Poll interval while waiting for a submitted batch job to finish.</summary>
    public int PollIntervalSeconds
    {
        get;
        set;
    } = 30;

    /// <summary>Maximum wall-clock wait for a batch job before failing over to synchronous completions.</summary>
    public int MaxWaitMinutes
    {
        get;
        set;
    } = 120;

    /// <summary>When false, synchronous chat completions are always used (default).</summary>
    public bool RouteManifestSummarization
    {
        get;
        set;
    }

    /// <summary>When false, synchronous chat completions are always used for judge paths (default).</summary>
    public bool RouteOfflineFaithfulnessJudge
    {
        get;
        set;
    }

    /// <summary>Documented Batch API discount ratio used for estimated-savings telemetry (default ~50%).</summary>
    public double EstimatedDiscountRatio
    {
        get;
        set;
    } = 0.5;
}
