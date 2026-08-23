using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Requests;
using ArchLucid.Core.Retrieval;

namespace ArchLucid.Retrieval.Compliance;

/// <summary>
///     Back-compat shim for compliance-specific policy-pack retrieval formatting.
/// </summary>
public static class CompliancePolicyPackRetrievalPromptFormatter
{
    public static string FormatPolicyPackBlock(
        IReadOnlyList<RetrievalHit> hits,
        IRetrievalCitationFormatter citationFormatter) =>
        PolicyPackRetrievalPromptFormatter.FormatPolicyPackBlock(
            AgentType.Compliance,
            hits,
            citationFormatter);

    public static string BuildPolicyQueryText(ArchitectureRequest request) =>
        PolicyPackRetrievalPromptFormatter.BuildPolicyQueryText(request, AgentType.Compliance);
}
