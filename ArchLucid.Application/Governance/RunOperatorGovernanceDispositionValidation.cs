using ArchLucid.Contracts.Governance;

namespace ArchLucid.Application.Governance;

/// <summary>Validation for run-level governance disposition requests (TB-112).</summary>
public static class RunOperatorGovernanceDispositionValidation
{
    public static void Validate(RecordRunOperatorGovernanceDispositionRequest request)
    {
        ArgumentNullException.ThrowIfNull(request);

        if (!Enum.IsDefined(typeof(RunOperatorGovernanceDecision), request.Decision))
            throw new ArgumentException("Decision is not a supported run governance disposition.", nameof(request));
    }

    public static void ValidateApproveAllowed(
        RunOperatorGovernanceDecision decision,
        bool hasCommitBlockingFailures)
    {
        if (decision != RunOperatorGovernanceDecision.Approved)
            return;

        if (hasCommitBlockingFailures)
        {
            throw new InvalidOperationException(
                "Cannot approve this run while commit-blocking finding coverage failures are open.");
        }
    }
}
