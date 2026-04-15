namespace ArchLucid.Core.Configuration;

/// <summary>
/// Optional Azure AI Content Safety (or compatible) integration for LLM prompts and completions.
/// When <c>Enabled</c> is true, host composition registers a stub guard that throws until a real implementation is wired.
/// </summary>
public sealed class ContentSafetyOptions
{
    public const string SectionPath = "ArchLucid:ContentSafety";

    /// <summary>When false, a pass-through <c>NullContentSafetyGuard</c> is used.</summary>
    public bool Enabled { get; set; }

    /// <summary>Optional endpoint URI when a concrete guard is added (not read by the null/stub guards).</summary>
    public string? Endpoint { get; set; }

    /// <summary>Optional API key name in Key Vault / user-secrets (not read by the null/stub guards).</summary>
    public string? ApiKey { get; set; }
}
