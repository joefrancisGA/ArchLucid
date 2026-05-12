using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Findings;

namespace ArchLucid.Application.Findings;

/// <summary>Copies relational mute flags onto live <see cref="ArchitectureFinding" /> wire models for run detail.</summary>
public static class FindingMuteFlagApplier
{
    public static void Apply(IReadOnlyList<AgentResult> results, IReadOnlyDictionary<string, FindingMuteFlag> flags)
    {
        ArgumentNullException.ThrowIfNull(results);
        ArgumentNullException.ThrowIfNull(flags);

        if (flags.Count == 0)
            return;

        foreach (AgentResult result in results)
        {
            foreach (ArchitectureFinding finding in result.Findings)
            {
                if (!flags.TryGetValue(finding.FindingId, out FindingMuteFlag flag))
                    continue;
                finding.IsMuted = flag.IsMuted;
                finding.MuteReason = flag.MuteReason;
            }
        }
    }
}
