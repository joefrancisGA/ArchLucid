using ArchLucid.Core.Retrieval;

namespace ArchLucid.Retrieval.Compliance;

/// <summary>
///     Formats policy-pack retrieval hits for compliance agent prompts.
/// </summary>
public static class CompliancePolicyPackRetrievalPromptFormatter
{
    public static string FormatPolicyPackBlock(IReadOnlyList<RetrievalHit> hits)
    {
        if (hits is null || hits.Count == 0)
            return "Policy Pack Controls (retrieved — cite ruleId when referencing):\n(none retrieved — grounding unavailable)";

        System.Text.StringBuilder sb = new();
        sb.AppendLine("Policy Pack Controls (retrieved — cite ruleId when referencing):");

        for (int i = 0; i < hits.Count; i++)
        {
            RetrievalHit hit = hits[i];
            sb.Append('[');
            sb.Append(i + 1);
            sb.Append("] ");
            sb.Append(hit.SourceType);
            sb.Append(" / ");
            sb.Append(hit.SourceId);
            sb.Append(" — ");
            sb.AppendLine(hit.Text);
        }

        return sb.ToString().TrimEnd();
    }

    public static string BuildPolicyQueryText(ArchLucid.Contracts.Requests.ArchitectureRequest request)
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

        return sb.ToString();
    }
}
