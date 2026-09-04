namespace ArchLucid.Contracts.Compliance;

/// <summary>Optional run-context gates for a compliance rule. Empty or null means always applicable.</summary>
public sealed class ComplianceRuleApplicabilityConditions
{
    /// <summary>
    ///     When set, the rule applies only when the run cloud target matches one of these values
    ///     (e.g. Azure, Aws, Gcp).
    /// </summary>
    public IReadOnlyList<string>? CloudProviders
    {
        get;
        set;
    }
}
