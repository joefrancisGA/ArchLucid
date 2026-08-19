namespace ArchLucid.Core.Configuration;

/// <summary>Optional high-cardinality LLM metrics (tenant id label). Use only when tenant count is bounded.</summary>
public sealed class LlmTelemetryOptions
{
    /// <summary>Configuration section name.</summary>
    public const string SectionName = "LlmTelemetry";

    /// <summary>
    ///     When true, prompt/completion counters also emit with <c>tenant_id</c> tag (in addition to aggregate series
    ///     without tenant).
    /// </summary>
    public bool RecordPerTenantTokens
    {
        get;
        set;
    }

    /// <summary>
    ///     When false (default), OpenTelemetry spans never carry raw prompts, user context, completions, or embedding
    ///     inputs — only aggregates (token counters, deployments, durations). Operators may set this to true in a guarded
    ///     environment (scoped App Configuration / Key Vault-backed secret flip) while investigating provider issues:
    ///     payload fields are capped and should still traverse redaction decorators upstream.
    /// </summary>
    public bool CapturePromptResponseOnSpans
    {
        get;
        set;
    }
}
