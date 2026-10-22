namespace ArchLucid.Core.InfraEvidence;

public sealed class RemediationPatternExecutionDefinition
{
    public string? AdvisoryTerraformTemplateRef
    {
        get;
        init;
    }

    public string? RunbookRef
    {
        get;
        init;
    }

    public List<string> VerificationQueries
    {
        get;
        init;
    } = [];
}

public sealed class RemediationPatternRollbackDefinition
{
    public string? RunbookRef
    {
        get;
        init;
    }

    public string? AdvisoryTerraformTemplateRef
    {
        get;
        init;
    }
}

public sealed class RemediationPatternRecurrenceControlDefinition
{
    public string? Description
    {
        get;
        init;
    }

    public string? ItsmWorkItemType
    {
        get;
        init;
    }
}

public sealed class RemediationPatternExceptionPolicyDefinition
{
    public bool AllowTemporaryException
    {
        get;
        init;
    }

    public int? MaxExceptionDays
    {
        get;
        init;
    }

    public string? RationaleRequired
    {
        get;
        init;
    }
}

public sealed class RemediationPatternEligibilityDefinition
{
    public List<string> Expressions
    {
        get;
        init;
    } = [];
}

public sealed class RemediationPatternPreflightDefinition
{
    public List<string> Checks
    {
        get;
        init;
    } = [];
}

public sealed class RemediationPatternVersionContent
{
    public string ControlObjective
    {
        get;
        init;
    } = string.Empty;

    public RemediationPatternEligibilityDefinition? Eligibility
    {
        get;
        init;
    }

    public RemediationPatternEligibilityDefinition? Exclusion
    {
        get;
        init;
    }

    public RemediationPatternPreflightDefinition? Preflight
    {
        get;
        init;
    }

    public RemediationPatternExecutionDefinition? Execution
    {
        get;
        init;
    }

    public RemediationPatternRollbackDefinition? Rollback
    {
        get;
        init;
    }

    public RemediationPatternRecurrenceControlDefinition? RecurrenceControl
    {
        get;
        init;
    }

    public RemediationPatternExceptionPolicyDefinition? ExceptionPolicy
    {
        get;
        init;
    }

    public List<string> RequiredApprovals
    {
        get;
        init;
    } = [];

    public List<string> ApplicableProviders
    {
        get;
        init;
    } = [];
}
