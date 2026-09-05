using ArchLucid.Decisioning.Models;

namespace ArchLucid.Decisioning.Findings.Factories;

public static partial class FindingPayloadConverter
{
    /// <summary>Converts the payload to <see cref="TopologyGapFindingPayload" />.</summary>
    public static TopologyGapFindingPayload? ToTopologyGapPayload(Finding finding)
    {
        return ConvertPayload<TopologyGapFindingPayload>(finding);
    }

    /// <summary>Converts the payload to <see cref="TopologyCoverageFindingPayload" />.</summary>
    public static TopologyCoverageFindingPayload? ToTopologyCoveragePayload(Finding finding)
    {
        return ConvertPayload<TopologyCoverageFindingPayload>(finding);
    }
}
