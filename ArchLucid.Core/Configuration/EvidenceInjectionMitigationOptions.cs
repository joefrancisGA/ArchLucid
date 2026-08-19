using System.Diagnostics.CodeAnalysis;

namespace ArchLucid.Core.Configuration;

/// <summary>
///     Tunables for deterministic prompt-injection mitigation on <see cref="ArchLucid.Contracts.Agents.AgentEvidencePackage" />
///     text fields before agents execute.
/// </summary>
[ExcludeFromCodeCoverage(Justification = "Configuration binding DTO with no logic.")]
public sealed class EvidenceInjectionMitigationOptions
{
    public const string SectionPath = "ArchLucid:EvidenceInjectionMitigation";

    /// <summary>When false, evidence packages are unchanged by this pass.</summary>
    public bool Enabled
    {
        get;
        set;
    } = true;

    /// <summary>Replacement text when a field matches curated injection heuristics.</summary>
    public string RedactedMarker
    {
        get;
        set;
    } = "[redacted-prompt-injection]";
}
