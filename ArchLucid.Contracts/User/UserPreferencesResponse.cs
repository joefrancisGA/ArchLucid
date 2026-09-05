namespace ArchLucid.Contracts.User;

/// <summary>Response for <c>GET /v1/user/preferences</c>.</summary>
public sealed class UserPreferencesResponse
{
    public string AppearancePreference
    {
        get;
        set;
    } = AppearancePreferenceValues.Default;

    /// <summary>True when the user has an explicit stored appearance preference row.</summary>
    public bool AppearancePreferenceIsExplicit
    {
        get;
        set;
    }

    public CloudPlatformScopeDto CloudPlatformScope
    {
        get;
        set;
    } = CloudPlatformScopeValues.Default;

    /// <summary>True when the user has an explicit stored cloud-platform scope row.</summary>
    public bool CloudPlatformScopeIsExplicit
    {
        get;
        set;
    }

    /// <summary>When false, operator follow-up strips titled Where to go next are hidden.</summary>
    public bool WhereToGoNextEnabled
    {
        get;
        set;
    } = true;

    /// <summary>True when the user has an explicit stored Where to go next visibility row.</summary>
    public bool WhereToGoNextIsExplicit
    {
        get;
        set;
    }

    /// <summary>When false, Overview sample-review onboarding surfaces are hidden.</summary>
    public bool SampleReviewsOnOverviewEnabled
    {
        get;
        set;
    } = true;

    /// <summary>True when the user has an explicit stored sample-reviews-on-Overview visibility row.</summary>
    public bool SampleReviewsOnOverviewIsExplicit
    {
        get;
        set;
    }

    /// <summary>Personal IANA time zone for date and time display.</summary>
    public string IanaTimeZoneId
    {
        get;
        set;
    } = IanaTimeZonePreferenceValues.Default;

    /// <summary>True when the user has an explicit stored time zone row.</summary>
    public bool IanaTimeZoneIsExplicit
    {
        get;
        set;
    }

    /// <summary>Operator workspace mode: guided (default) or working.</summary>
    public string WorkspaceMode
    {
        get;
        set;
    } = WorkspaceModeValues.Default;

    /// <summary>True when the user has an explicit stored workspace mode row.</summary>
    public bool WorkspaceModeIsExplicit
    {
        get;
        set;
    }

    /// <summary>Graduation offer state after the user's first sealed review.</summary>
    public string WorkspaceModeGraduationOffer
    {
        get;
        set;
    } = WorkspaceModeGraduationOfferValues.Default;

    /// <summary>True when the user has an explicit stored graduation-offer row.</summary>
    public bool WorkspaceModeGraduationOfferIsExplicit
    {
        get;
        set;
    }

    /// <summary>When true, Working-mode review-detail uses the split workbench layout.</summary>
    public bool ProfessionalWorkbenchEnabled
    {
        get;
        set;
    } = true;

    /// <summary>True when the user has an explicit stored professional-workbench row.</summary>
    public bool ProfessionalWorkbenchEnabledIsExplicit
    {
        get;
        set;
    }

    /// <summary>Personal loaded hourly cost (USD) for ROI desk assumptions.</summary>
    public decimal RoiLoadedHourlyCostUsd
    {
        get;
        set;
    } = RoiLoadedHourlyCostUsdValues.Default;

    /// <summary>True when the user has an explicit stored ROI loaded hourly cost row.</summary>
    public bool RoiLoadedHourlyCostUsdIsExplicit
    {
        get;
        set;
    }

    /// <summary>When true, findings lists hide generic low-density rows.</summary>
    public bool FindingsHideGenericEnabled
    {
        get;
        set;
    }

    /// <summary>True when the user has an explicit stored hide-generic findings visibility row.</summary>
    public bool FindingsHideGenericEnabledIsExplicit
    {
        get;
        set;
    }

    /// <summary>When true, findings lists show low-confidence rows.</summary>
    public bool FindingsShowLowConfidenceEnabled
    {
        get;
        set;
    }

    /// <summary>True when the user has an explicit stored show-low-confidence findings visibility row.</summary>
    public bool FindingsShowLowConfidenceEnabledIsExplicit
    {
        get;
        set;
    }

    /// <summary>When true, findings lists show advisory rows.</summary>
    public bool FindingsShowAdvisoryEnabled
    {
        get;
        set;
    }

    /// <summary>True when the user has an explicit stored show-advisory findings visibility row.</summary>
    public bool FindingsShowAdvisoryEnabledIsExplicit
    {
        get;
        set;
    }

    /// <summary>Working desk continuity: last-open review/draft and visit watermark.</summary>
    public DeskContinuityDto DeskContinuity
    {
        get;
        set;
    } = DeskContinuityValues.Default;

    /// <summary>True when the user has an explicit stored desk-continuity row.</summary>
    public bool DeskContinuityIsExplicit
    {
        get;
        set;
    }
}
