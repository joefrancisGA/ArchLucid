namespace ArchLucid.Contracts.Common;

/// <summary>
///     Commercial model tier for Azure OpenAI chat deployments (maps to configuration; not a vendor SKU name).
/// </summary>
public enum LlmModelTier
{
    /// <summary>Default pilot / production tier (e.g. gpt-4o deployment).</summary>
    Standard = 0,

    /// <summary>Higher-capability tier for selected agents or runs (e.g. reasoning-class deployment).</summary>
    Premium = 1,

    /// <summary>Lower-cost tier for bulk or low-stakes workloads when configured.</summary>
    Economy = 2
}
