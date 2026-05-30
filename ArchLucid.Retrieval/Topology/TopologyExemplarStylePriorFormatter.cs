using ArchLucid.Contracts.Requests;
using ArchLucid.Core.Retrieval;

namespace ArchLucid.Retrieval.Topology;

/// <summary>
///     Formats reference-architecture exemplar hits as a style prior for the Topology agent prompt.
///     Exemplars are informational only — they must never influence manifest hash or compliance citations.
/// </summary>
public static class TopologyExemplarStylePriorFormatter
{
    /// <summary>
    ///     Builds the natural-language query used to retrieve relevant exemplars from the
    ///     <c>ReferenceArchitecture</c> corpus for the given request.
    /// </summary>
    public static string BuildExemplarQueryText(ArchitectureRequest request)
    {
        ArgumentNullException.ThrowIfNull(request);

        System.Text.StringBuilder sb = new();
        sb.Append(request.CloudProvider.ToString());
        sb.Append(' ');
        sb.Append(request.SystemName);

        if (!string.IsNullOrWhiteSpace(request.Description))
        {
            sb.Append(": ");
            sb.Append(request.Description);
        }

        if (request.Constraints is { Count: > 0 })
        {
            sb.Append(" constraints: ");
            sb.Append(string.Join("; ", request.Constraints));
        }

        return sb.ToString();
    }

    /// <summary>
    ///     Formats a list of exemplar hits as a style-prior block appended to the topology user prompt.
    ///     When <paramref name="hits" /> is empty the block explicitly signals that no prior is available,
    ///     preventing the model from inferring one.
    /// </summary>
    public static string FormatStylePriorBlock(IReadOnlyList<RetrievalHit> hits)
    {
        if (hits is null || hits.Count == 0)
        {
            return """
                Reference Architecture Style Prior (informational only — do not cite IDs, not in manifest hash):
                - exemplarMissing: true — no reference architecture exemplar retrieved; derive topology from request context only.
                """.Trim();
        }

        System.Text.StringBuilder sb = new();
        sb.AppendLine("Reference Architecture Style Prior (informational only — do not cite IDs, not in manifest hash):");
        sb.AppendLine("- exemplarMissing: false — use the patterns below as a structural style guide only:");

        for (int i = 0; i < hits.Count; i++)
        {
            RetrievalHit hit = hits[i];
            sb.Append('[');
            sb.Append(i + 1);
            sb.Append("] ");
            sb.AppendLine(hit.Text);
        }

        return sb.ToString().TrimEnd();
    }
}
