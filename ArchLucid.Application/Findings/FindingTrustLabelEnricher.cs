using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Metadata;

namespace ArchLucid.Application.Findings;

/// <summary>
///     Applies authoritative <see cref="FindingTrustLabel" /> values to architecture findings on run detail.
/// </summary>
public static class FindingTrustLabelEnricher
{
    public static void Apply(ArchitectureRun run, IReadOnlyList<AgentResult> results, IFindingTrustLabelMapper mapper)
    {
        ArgumentNullException.ThrowIfNull(run);
        ArgumentNullException.ThrowIfNull(results);
        ArgumentNullException.ThrowIfNull(mapper);

        bool isSimulator = run.StructuralExecutionMode == StructuralExecutionMode.Simulator;
        bool isRealRun = run.StructuralExecutionMode == StructuralExecutionMode.Real;

        foreach (AgentResult result in results)
        {
            bool isDegraded = !string.IsNullOrWhiteSpace(result.DegradationReasonCode);
            bool isRealModel = isRealRun && !isDegraded && !isSimulator;
            AgentTrustContext context = new(IsSimulatorDerived: isSimulator, IsDegraded: isDegraded, IsRealModel: isRealModel);

            foreach (ArchitectureFinding finding in result.Findings)
            {
                FindingTrustSummary summary = mapper.Map(finding, context);
                finding.TrustLabel = summary.Label.ToString();
                finding.TrustLabelReason = summary.ShortReason;
            }
        }
    }
}
