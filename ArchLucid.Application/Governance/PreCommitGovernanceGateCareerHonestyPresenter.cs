namespace ArchLucid.Application.Governance;

/// <summary>Shared copy when the optional pre-finalize governance gate is disabled on Working hosts (DR-04).</summary>
public static class PreCommitGovernanceGateCareerHonestyPresenter
{
    public const string WorkingBannerMessage =
        "Pre-finalize governance gate is off — this seal is not career-complete";

    public const string CareerExportBlockedReason = WorkingBannerMessage;

    public static string? FormatCareerExportBlockedReason(bool preCommitGateEnabled)
    {
        if (preCommitGateEnabled)
        {
            return null;
        }

        return CareerExportBlockedReason;
    }
}
