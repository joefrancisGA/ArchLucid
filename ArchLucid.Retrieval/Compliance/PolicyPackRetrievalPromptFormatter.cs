using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Requests;
using ArchLucid.Core.Retrieval;
using ArchLucid.Retrieval.PolicyPacks;

namespace ArchLucid.Retrieval.Compliance;

/// <summary>
///     Formats dimension-aware policy-pack retrieval hits for agent prompts.
/// </summary>
public static class PolicyPackRetrievalPromptFormatter
{
    public static string FormatPolicyPackBlock(
        AgentType agentType,
        IReadOnlyList<RetrievalHit> hits,
        IRetrievalCitationFormatter citationFormatter)
    {
        ArgumentNullException.ThrowIfNull(citationFormatter);

        bool groundingMissing = hits is null || hits.Count == 0;
        string blockTitle = AgentPolicyPackRetrievalProfiles.ResolveBlockTitle(agentType);
        string objective = AgentPolicyPackRetrievalProfiles.ResolveGroundingObjective(agentType);

        if (groundingMissing)
        {
            return $"""
                {blockTitle}
                - groundingMissing: true — no policy-pack rule hit; do not invent control IDs or quote pack text.
                (none retrieved — grounding unavailable for {objective})
                """.Trim();
        }

        System.Text.StringBuilder sb = new();
        sb.AppendLine(blockTitle);
        sb.Append("- groundingMissing: false — cite these rules when stating ");
        sb.Append(objective);
        sb.AppendLine(":");

        for (int i = 0; i < hits!.Count; i++)
        {
            RetrievalHit hit = hits[i];
            sb.Append('[');
            sb.Append(i + 1);
            sb.Append("] ");
            sb.Append(citationFormatter.Format(hit));
            sb.Append(" — ");
            sb.AppendLine(hit.Text);
        }

        return sb.ToString().TrimEnd();
    }

    public static string BuildPolicyQueryText(ArchitectureRequest request, AgentType agentType)
    {
        ArgumentNullException.ThrowIfNull(request);

        System.Text.StringBuilder sb = new();
        sb.Append(request.SystemName);

        if (!string.IsNullOrWhiteSpace(request.Environment))
        {
            sb.Append(' ');
            sb.Append(request.Environment);
        }

        if (request.RequiredCapabilities is { Count: > 0 })
        {
            sb.Append(" capabilities: ");
            sb.Append(string.Join(", ", request.RequiredCapabilities));
        }

        if (request.Constraints is { Count: > 0 })
        {
            sb.Append(" constraints: ");
            sb.Append(string.Join("; ", request.Constraints));
        }

        string dimensionSuffix = AgentPolicyPackRetrievalProfiles.BuildDimensionQuerySuffix(agentType);

        if (!string.IsNullOrWhiteSpace(dimensionSuffix))
            sb.Append(dimensionSuffix);

        return sb.ToString();
    }
}
