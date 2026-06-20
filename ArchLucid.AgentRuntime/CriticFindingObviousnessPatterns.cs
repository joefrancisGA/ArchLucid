using ArchLucid.Contracts.Findings;
using ArchLucid.Core.Findings;

namespace ArchLucid.AgentRuntime;

/// <summary>
///     Detects generic cloud-security checklist phrasing that principal architects dismiss as obvious.
/// </summary>
public static class CriticFindingObviousnessPatterns
{
    /// <summary>
    ///     True when the message reads like generic checklist advice without architecture-specific grounding.
    /// </summary>
    public static bool IsObviousGenericAdvice(string? message) =>
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(message);

    /// <summary>
    ///     True when the finding message anchors to a specific uploaded element, not generic posture.
    /// </summary>
    public static bool HasArchitectureSpecificAnchor(string? message, IReadOnlyList<string> evidenceRefs) =>
        GenericArchitectureAdvicePatterns.HasArchitectureSpecificAnchor(message, evidenceRefs);
}
