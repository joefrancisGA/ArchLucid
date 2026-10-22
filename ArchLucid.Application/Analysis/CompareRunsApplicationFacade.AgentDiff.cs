using ArchLucid.Application.Diffs;
using ArchLucid.Application.Runs;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Core.Comparison;

namespace ArchLucid.Application.Analysis;

public sealed partial class CompareRunsApplicationFacade
{
    /// <inheritdoc />
    public AgentResultDiffResult CompareAgentResults(
        string leftRunId,
        ArchitectureRunDetail leftDetail,
        string rightRunId,
        ArchitectureRunDetail rightDetail,
        CompareInputFingerprints? inputFingerprints = null)
    {
        AgentResultDiffResult diff = _agentResultDiffService.Compare(
            leftRunId,
            leftDetail.Results,
            rightRunId,
            rightDetail.Results);
        diff.InputFingerprints = inputFingerprints;
        return diff;
    }
}
