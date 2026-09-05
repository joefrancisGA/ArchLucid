namespace ArchLucid.Core.UserPreferences;

/// <summary>Well-known <c>dbo.UserSettings.PreferenceKey</c> values.</summary>
public static class UserSettingKeys
{
    /// <summary>User appearance preference: <c>system</c>, <c>light</c>, or <c>dark</c>.</summary>
    public const string AppearancePreference = "AppearancePreference";

    /// <summary>JSON blob of personal cloud-platform visibility toggles.</summary>
    public const string CloudPlatformScope = "CloudPlatformScope";

    /// <summary>Whether Where to go next follow-up strips are shown: <c>true</c> or <c>false</c>.</summary>
    public const string WhereToGoNextEnabled = "WhereToGoNextEnabled";

    /// <summary>Whether sample reviews are shown on Overview: <c>true</c> or <c>false</c>.</summary>
    public const string SampleReviewsOnOverviewEnabled = "SampleReviewsOnOverviewEnabled";

    /// <summary>Personal IANA time zone id for date and time display (for example <c>UTC</c> or <c>America/New_York</c>).</summary>
    public const string IanaTimeZoneId = "IanaTimeZoneId";

    /// <summary>Operator workspace mode: <c>guided</c> (default) or <c>working</c>.</summary>
    public const string WorkspaceMode = "WorkspaceMode";

    /// <summary>Post-seal Working-mode graduation offer: <c>pending</c>, <c>dismissed</c>, or <c>remind-next</c>.</summary>
    public const string WorkspaceModeGraduationOffer = "WorkspaceModeGraduationOffer";

    /// <summary>Whether Working-mode review-detail uses the split workbench layout: <c>true</c> or <c>false</c>.</summary>
    public const string ProfessionalWorkbenchEnabled = "ProfessionalWorkbenchEnabled";

    /// <summary>Personal loaded hourly cost (USD) for ROI desk assumptions.</summary>
    public const string RoiLoadedHourlyCostUsd = "RoiLoadedHourlyCostUsd";

    /// <summary>Whether findings lists hide generic low-density rows: <c>true</c> or <c>false</c>.</summary>
    public const string FindingsHideGenericEnabled = "FindingsHideGenericEnabled";

    /// <summary>Whether findings lists show low-confidence rows: <c>true</c> or <c>false</c>.</summary>
    public const string FindingsShowLowConfidenceEnabled = "FindingsShowLowConfidenceEnabled";

    /// <summary>Whether findings lists show advisory rows: <c>true</c> or <c>false</c>.</summary>
    public const string FindingsShowAdvisoryEnabled = "FindingsShowAdvisoryEnabled";

    /// <summary>JSON blob of Working desk continuity (last-open review/draft and visit watermark).</summary>
    public const string DeskContinuity = "DeskContinuity";
}
