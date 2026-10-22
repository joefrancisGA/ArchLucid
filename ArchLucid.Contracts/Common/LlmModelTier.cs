namespace ArchLucid.Contracts.Common;

/// <summary>
///     Commercial model tier for Azure OpenAI chat deployments (maps to configuration; not a vendor SKU name).
///     Recommended GPT-5.6 binding: Economy → Luna, Standard → Terra (default), Premium → Sol.
/// </summary>
public enum LlmModelTier
{
    /// <summary>Default pilot / production tier (e.g. gpt-5.6-terra deployment).</summary>
    Standard = 0,

    /// <summary>Higher-capability tier for selected agents or runs (e.g. gpt-5.6-sol deployment).</summary>
    Premium = 1,

    /// <summary>Lower-cost tier for bulk or low-stakes workloads (e.g. gpt-5.6-luna deployment).</summary>
    Economy = 2
}
