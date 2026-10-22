using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Findings;

namespace ArchLucid.Application.Findings;

/// <summary>Merges agent-emission withheld rows onto a findings snapshot before persistence (DR-02).</summary>
public static class FindingsSnapshotWithheldMerger
{
    public static void MergeAgentWithheld(FindingsSnapshot snapshot, IReadOnlyList<AgentResult> agentResults)
    {
        ArgumentNullException.ThrowIfNull(snapshot);
        ArgumentNullException.ThrowIfNull(agentResults);

        if (agentResults.Count == 0)
        {
            return;
        }

        foreach (AgentResult result in agentResults)
        {
            if (result.WithheldFindings is not { Count: > 0 } withheld)
            {
                continue;
            }

            snapshot.WithheldFindings.AddRange(withheld);
        }
    }
}
