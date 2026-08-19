namespace ArchLucid.Contracts.Governance;

/// <summary>Counts parsed from a valid <see cref="PolicyPackContentDocument" /> for authoring feedback.</summary>
public sealed class PolicyPackContentValidationSummary
{
    public int ComplianceRuleIdCount
    {
        get;
        set;
    }

    public int ComplianceRuleKeyCount
    {
        get;
        set;
    }

    public int AlertRuleIdCount
    {
        get;
        set;
    }

    public int CompositeAlertRuleIdCount
    {
        get;
        set;
    }

    public int AdvisoryDefaultCount
    {
        get;
        set;
    }

    public int MetadataEntryCount
    {
        get;
        set;
    }

    public int ElicitationQuestionCount
    {
        get;
        set;
    }
}
