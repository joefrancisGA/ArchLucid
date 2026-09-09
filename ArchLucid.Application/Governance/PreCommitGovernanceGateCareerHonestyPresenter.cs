namespace ArchLucid.Application.Governance;

/// <summary>Shared copy when the optional pre-finalize governance gate is disabled on Working hosts (DR-04).</summary>
public static class PreCommitGovernanceGateCareerHonestyPresenter
{
    public const string WorkingBannerTitle = "Finalize will not be blocked by policy";

    public const string WorkingBannerMessage =
        "Serious findings can still be sealed here. This is not a fully governed review record.";

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
