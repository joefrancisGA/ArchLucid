using ArchLucid.Contracts.Governance;

namespace ArchLucid.Application.Runs;

/// <summary>Thrown when optional pre-commit governance blocks manifest commit.</summary>
public sealed class PreCommitGovernanceBlockedException(PreCommitGateResult result) : Exception(GetMessage(result))
{
    public PreCommitGateResult Result
    {
        get;
    } = result;

    private static string GetMessage(PreCommitGateResult result)
    {
        ArgumentNullException.ThrowIfNull(result);

        return result.Reason ?? "Commit blocked by governance policy.";
    }
}
