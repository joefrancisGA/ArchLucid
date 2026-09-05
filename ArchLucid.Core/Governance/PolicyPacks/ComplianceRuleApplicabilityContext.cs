using ArchLucid.Contracts.Common;

namespace ArchLucid.Core.Governance.PolicyPacks;

/// <summary>Run facts used to evaluate optional compliance-rule applicability conditions.</summary>
public sealed class ComplianceRuleApplicabilityContext
{
    public CloudProvider CloudProvider
    {
        get;
        init;
    }

    public static ComplianceRuleApplicabilityContext FromCloudProvider(CloudProvider cloudProvider) =>
        new() { CloudProvider = cloudProvider };
}
