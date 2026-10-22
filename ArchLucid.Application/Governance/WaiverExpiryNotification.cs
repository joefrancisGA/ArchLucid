using ArchLucid.Contracts.Governance;

namespace ArchLucid.Application.Governance;

/// <summary>One reminder the TB-2193 scanner intends to send for a single waiver at a single boundary.</summary>
public sealed class WaiverExpiryNotification
{
    public required RiskExceptionRecord Waiver
    {
        get;
        init;
    }

    /// <summary>The boundary from <see cref="GovernanceWaiverExpiryWindow.AlertDayBoundaries" /> that was entered.</summary>
    public required int BoundaryDays
    {
        get;
        init;
    }

    /// <summary>Actual whole days remaining, which can be lower than <see cref="BoundaryDays" /> after a missed pass.</summary>
    public required int DaysRemaining
    {
        get;
        init;
    }
}
