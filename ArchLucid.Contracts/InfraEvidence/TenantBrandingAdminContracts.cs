namespace ArchLucid.Contracts.InfraEvidence;

public sealed class TenantBrandingAdminStateResponse
{
    public TenantBrandingDraftResponse Draft
    {
        get;
        init;
    } = new();

    public TenantBrandingActiveSummaryResponse Active
    {
        get;
        init;
    } = new();

    public TenantBrandColorsResponse ProductDefaults
    {
        get;
        init;
    } = new();

    public IReadOnlyList<TenantBrandingValidationIssueResponse> ValidationIssues
    {
        get;
        init;
    } = [];

    public bool CanActivate
    {
        get;
        init;
    }
}

public sealed class TenantBrandingActiveSummaryResponse
{
    public bool IsActive
    {
        get;
        init;
    }

    public int? Version
    {
        get;
        init;
    }

    public DateTime? UpdatedUtc
    {
        get;
        init;
    }
}

public sealed class TenantBrandingDraftResponse
{
    public Guid? BrandingProfileId
    {
        get;
        init;
    }

    public string? CompanyDisplayName
    {
        get;
        init;
    }

    public string? CompanyLegalName
    {
        get;
        init;
    }

    public string? ShortDisplayName
    {
        get;
        init;
    }

    public Guid? LogoPrimaryAssetId
    {
        get;
        init;
    }

    public Guid? LogoSecondaryAssetId
    {
        get;
        init;
    }

    public Guid? LogoSquareAssetId
    {
        get;
        init;
    }

    public Guid? LogoFaviconAssetId
    {
        get;
        init;
    }

    public Guid? LogoDarkAssetId
    {
        get;
        init;
    }

    public Guid? LogoLightAssetId
    {
        get;
        init;
    }

    public Guid? LogoReportCoverAssetId
    {
        get;
        init;
    }

    public Guid? LogoMonoAssetId
    {
        get;
        init;
    }

    public string? PrimaryColor
    {
        get;
        init;
    }

    public string? SecondaryColor
    {
        get;
        init;
    }

    public string? AccentColor
    {
        get;
        init;
    }

    public string? BackgroundColor
    {
        get;
        init;
    }

    public string? ForegroundColor
    {
        get;
        init;
    }

    public string? Tagline
    {
        get;
        init;
    }

    public string? WebsiteUrl
    {
        get;
        init;
    }

    public string? SupportUrl
    {
        get;
        init;
    }

    public bool CoBrandingEnabled
    {
        get;
        init;
    }

    public DateTime? UpdatedUtc
    {
        get;
        init;
    }
}

public sealed class TenantBrandingDraftPutRequest
{
    public string? CompanyDisplayName
    {
        get;
        init;
    }

    public string? CompanyLegalName
    {
        get;
        init;
    }

    public string? ShortDisplayName
    {
        get;
        init;
    }

    public Guid? LogoPrimaryAssetId
    {
        get;
        init;
    }

    public Guid? LogoSecondaryAssetId
    {
        get;
        init;
    }

    public Guid? LogoSquareAssetId
    {
        get;
        init;
    }

    public Guid? LogoFaviconAssetId
    {
        get;
        init;
    }

    public Guid? LogoDarkAssetId
    {
        get;
        init;
    }

    public Guid? LogoLightAssetId
    {
        get;
        init;
    }

    public Guid? LogoReportCoverAssetId
    {
        get;
        init;
    }

    public Guid? LogoMonoAssetId
    {
        get;
        init;
    }

    public string? PrimaryColor
    {
        get;
        init;
    }

    public string? SecondaryColor
    {
        get;
        init;
    }

    public string? AccentColor
    {
        get;
        init;
    }

    public string? BackgroundColor
    {
        get;
        init;
    }

    public string? ForegroundColor
    {
        get;
        init;
    }

    public string? Tagline
    {
        get;
        init;
    }

    public string? WebsiteUrl
    {
        get;
        init;
    }

    public string? SupportUrl
    {
        get;
        init;
    }

    public bool CoBrandingEnabled
    {
        get;
        init;
    }
}

public sealed class TenantBrandingValidationIssueResponse
{
    public string Code
    {
        get;
        init;
    } = string.Empty;

    public string Severity
    {
        get;
        init;
    } = string.Empty;

    public string Message
    {
        get;
        init;
    } = string.Empty;
}

public sealed class TenantBrandingActivateResponse
{
    public bool Succeeded
    {
        get;
        init;
    }

    public TenantBrandingAdminStateResponse? State
    {
        get;
        init;
    }

    public IReadOnlyList<TenantBrandingValidationIssueResponse> ValidationIssues
    {
        get;
        init;
    } = [];
}
