using ArchLucid.Decisioning.Models;

namespace ArchLucid.Decisioning.Findings.Factories;

public static partial class FindingPayloadConverter
{
    /// <summary>Converts the payload to <see cref="RequirementFindingPayload" />.</summary>
    public static RequirementFindingPayload? ToRequirementPayload(Finding finding)
    {
        return ConvertPayload<RequirementFindingPayload>(finding);
    }

    /// <summary>Converts the payload to <see cref="RequirementCoverageFindingPayload" />.</summary>
    public static RequirementCoverageFindingPayload? ToRequirementCoveragePayload(Finding finding)
    {
        return ConvertPayload<RequirementCoverageFindingPayload>(finding);
    }

    public static RequirementExpectationFindingPayload? ToRequirementExpectationPayload(Finding finding)
    {
        return ConvertPayload<RequirementExpectationFindingPayload>(finding);
    }
}
