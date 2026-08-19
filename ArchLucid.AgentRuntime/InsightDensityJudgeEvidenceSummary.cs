using System.Text;

using ArchLucid.AgentRuntime.Prompts;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Requests;

namespace ArchLucid.AgentRuntime;

/// <summary>Bounded evidence excerpt for insight-density judge prompts.</summary>
internal static class InsightDensityJudgeEvidenceSummary
{
    private const int MaxCharacters = 12_000;

    public static string Build(AgentEvidencePackage evidence, ArchitectureRequest request)
    {
        ArgumentNullException.ThrowIfNull(evidence);
        ArgumentNullException.ThrowIfNull(request);

        StringBuilder builder = new();
        AgentUserPromptBuilder.AppendArchitectureRequestAndEvidence(builder, request, evidence);

        if (builder.Length == 0)
        {
            return "(empty evidence package)";
        }

        if (builder.Length <= MaxCharacters)
        {
            return builder.ToString();
        }

        return builder.ToString(0, MaxCharacters);
    }
}
