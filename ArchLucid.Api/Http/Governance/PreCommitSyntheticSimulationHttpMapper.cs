using ArchLucid.Api.Models;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Contracts.Findings;

namespace ArchLucid.Api.Http.Governance;

/// <summary>Body validation for <c>POST /v1/governance/pre-finalize/simulate</c> before tenant preflight.</summary>
public static class PreCommitSyntheticSimulationHttpMapper
{
    public static GovernanceHttpValidation? Validate(PreCommitSyntheticSimulationRequest request)
    {
        ArgumentNullException.ThrowIfNull(request);

        if (!Enum.IsDefined(request.SyntheticSeverity))
        {
            return new GovernanceHttpValidation(
                "syntheticSeverity is not valid.",
                ProblemTypes.ValidationFailed);
        }

        return null;
    }
}
