using ArchLucid.Decisioning.Governance.PolicyPacks;

namespace ArchLucid.Application.Governance.PolicyPacks;

/// <summary>Outcome of assigning a policy pack version to a governance tier.</summary>
public enum PolicyPackAssignOutcome
{
    Assigned,
    PackNotFound,
    VersionNotFound,
}

/// <summary>Result of <see cref="IPolicyPackWorkflowFacade.TryAssignAsync"/>.</summary>
public sealed record PolicyPackAssignWorkflowResult(
    PolicyPackAssignOutcome Outcome,
    PolicyPackAssignment? Assignment);
