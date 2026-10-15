using ArchLucid.Contracts.Serialization;

namespace ArchLucid.Contracts.InfraEvidence;

public sealed class TenantBrandingAdminStateResponse
{
    private TenantBrandingDraftResponse draft = new();

    public TenantBrandingDraftResponse Draft
    {
        get => draft;
        init => draft = value ?? new TenantBrandingDraftResponse();
    }

    private TenantBrandingActiveSummaryResponse active = new();

    public TenantBrandingActiveSummaryResponse Active
    {
        get => active;
        init => active = value ?? new TenantBrandingActiveSummaryResponse();
    }

    private TenantBrandColorsResponse productDefaults = new();

    public TenantBrandColorsResponse ProductDefaults
    {
        get => productDefaults;
        init => productDefaults = value ?? new TenantBrandColorsResponse();
    }

    private IReadOnlyList<TenantBrandingValidationIssueResponse> validationIssues = [];

    public IReadOnlyList<TenantBrandingValidationIssueResponse> ValidationIssues
    {
        get => validationIssues;
        init => validationIssues = ContractCollectionDefaults.CoalesceReadOnly(value);
    }

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

    private IReadOnlyList<TenantBrandingValidationIssueResponse> validationIssues = [];

    public IReadOnlyList<TenantBrandingValidationIssueResponse> ValidationIssues
    {
        get => validationIssues;
        init => validationIssues = ContractCollectionDefaults.CoalesceReadOnly(value);
    }
}
