using ArchLucid.Decisioning.Models;

namespace ArchLucid.Decisioning.Findings.Factories;

public static partial class FindingPayloadConverter
{
    /// <summary>Converts the payload to <see cref="SecurityControlFindingPayload" />.</summary>
    public static SecurityControlFindingPayload? ToSecurityControlPayload(Finding finding)
    {
        return ConvertPayload<SecurityControlFindingPayload>(finding);
    }

    /// <summary>Converts the payload to <see cref="SecurityCoverageFindingPayload" />.</summary>
    public static SecurityCoverageFindingPayload? ToSecurityCoveragePayload(Finding finding)
    {
        return ConvertPayload<SecurityCoverageFindingPayload>(finding);
    }

    public static SecurityBaselineExpectationFindingPayload? ToSecurityBaselineExpectationPayload(Finding finding)
    {
        return ConvertPayload<SecurityBaselineExpectationFindingPayload>(finding);
    }

    public static SecurityBaselineCompletenessFindingPayload? ToSecurityBaselineCompletenessPayload(Finding finding)
    {
        return ConvertPayload<SecurityBaselineCompletenessFindingPayload>(finding);
    }
}
