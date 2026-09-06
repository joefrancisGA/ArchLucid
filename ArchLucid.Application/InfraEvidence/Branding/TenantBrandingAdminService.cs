using ArchLucid.Application.Pilots;
using ArchLucid.Contracts.InfraEvidence;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.InfraEvidence;

namespace ArchLucid.Application.InfraEvidence.Branding;

public sealed class TenantBrandingAdminService(
    ITenantBrandingProfileRepository brandingProfileRepository,
    IBrandAssetService brandAssetService) : ITenantBrandingAdminService
{
    public async Task<TenantBrandingAdminStateResponse> GetAdminStateAsync(
        ScopeContext scope,
        CancellationToken cancellationToken = default)
    {
        TenantBrandingProfileRecord? draft =
            await brandingProfileRepository.TryGetDraftAsync(scope.TenantId, cancellationToken);

        TenantBrandingProfileRecord? active =
            await brandingProfileRepository.TryGetActiveAsync(scope.TenantId, cancellationToken);

        TenantBrandingProfileRecord source = draft ?? active ?? BuildProductSeed(scope.TenantId);
        TenantBrandingValidationResult validation = await ValidateDraftAsync(scope, source, cancellationToken);

        return BuildStateResponse(source, active, validation);
    }

    public async Task<TenantBrandingAdminStateResponse> SaveDraftAsync(
        ScopeContext scope,
        TenantBrandingDraftPutRequest request,
        string actor,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(request);

        TenantBrandingProfileRecord? existingDraft =
            await brandingProfileRepository.TryGetDraftAsync(scope.TenantId, cancellationToken);

        DateTime utcNow = TimeProvider.System.UtcNowDateTime();
        Guid profileId = existingDraft?.BrandingProfileId ?? Guid.NewGuid();
        int version = existingDraft?.Version ?? 1;

        TenantBrandingProfileRecord draft = MapDraftPutRequest(scope.TenantId, profileId, version, request, actor, utcNow);

        await brandingProfileRepository.ReplaceDraftAsync(draft, cancellationToken);

        TenantBrandingProfileRecord? active =
            await brandingProfileRepository.TryGetActiveAsync(scope.TenantId, cancellationToken);

        TenantBrandingValidationResult validation = await ValidateDraftAsync(scope, draft, cancellationToken);

        return BuildStateResponse(draft, active, validation);
    }

    public async Task<TenantBrandingActivateResponse> ActivateDraftAsync(
        ScopeContext scope,
        string actor,
        CancellationToken cancellationToken = default)
    {
        TenantBrandingProfileRecord? draft =
            await brandingProfileRepository.TryGetDraftAsync(scope.TenantId, cancellationToken);

        if (draft is null)
        {
            return new TenantBrandingActivateResponse
            {
                Succeeded = false,
                ValidationIssues =
                [
                    new TenantBrandingValidationIssueResponse
                    {
                        Code = "draftMissing",
                        Severity = "Error",
                        Message = "Save a branding draft before activation.",
                    },
                ],
            };
        }

        TenantBrandingValidationResult validation = await ValidateDraftAsync(scope, draft, cancellationToken);

        if (!validation.CanActivate)
        {
            return new TenantBrandingActivateResponse
            {
                Succeeded = false,
                ValidationIssues = MapValidationIssues(validation.Issues),
            };
        }

        TenantBrandingProfileRecord? active =
            await brandingProfileRepository.TryGetActiveAsync(scope.TenantId, cancellationToken);

        int nextVersion = (active?.Version ?? 0) + 1;
        DateTime utcNow = TimeProvider.System.UtcNowDateTime();

        await brandingProfileRepository.UpdateStatusForTenantAsync(
            scope.TenantId,
            BrandingProfileStatus.Active,
            BrandingProfileStatus.Disabled,
            actor,
            cancellationToken);

        TenantBrandingProfileRecord activated = CloneProfile(
            draft,
            Guid.NewGuid(),
            BrandingProfileStatus.Active,
            nextVersion,
            utcNow,
            actor);

        await brandingProfileRepository.InsertAsync(activated, cancellationToken);

        await brandingProfileRepository.UpdateStatusForTenantAsync(
            scope.TenantId,
            BrandingProfileStatus.Draft,
            BrandingProfileStatus.Disabled,
            actor,
            cancellationToken);

        TenantBrandingValidationResult postValidation = await ValidateDraftAsync(scope, activated, cancellationToken);

        return new TenantBrandingActivateResponse
        {
            Succeeded = true,
            State = BuildStateResponse(activated, activated, postValidation),
            ValidationIssues = MapValidationIssues(postValidation.Issues),
        };
    }

    public async Task<TenantBrandingAdminStateResponse> RevertToProductDefaultsAsync(
        ScopeContext scope,
        string actor,
        CancellationToken cancellationToken = default)
    {
        await brandingProfileRepository.UpdateStatusForTenantAsync(
            scope.TenantId,
            BrandingProfileStatus.Active,
            BrandingProfileStatus.Disabled,
            actor,
            cancellationToken);

        await brandingProfileRepository.UpdateStatusForTenantAsync(
            scope.TenantId,
            BrandingProfileStatus.Draft,
            BrandingProfileStatus.Disabled,
            actor,
            cancellationToken);

        TenantBrandingProfileRecord seed = BuildProductSeed(scope.TenantId);
        TenantBrandingValidationResult validation = await ValidateDraftAsync(scope, seed, cancellationToken);

        return BuildStateResponse(seed, active: null, validation);
    }

    private async Task<TenantBrandingValidationResult> ValidateDraftAsync(
        ScopeContext scope,
        TenantBrandingProfileRecord draft,
        CancellationToken cancellationToken)
    {
        Dictionary<Guid, BrandAssetRecord> assetsById = new();

        foreach (Guid? assetId in CollectAssetIds(draft))
        {
            if (assetId is not Guid id || id == Guid.Empty || assetsById.ContainsKey(id))
                continue;

            BrandAssetReadResult result = await brandAssetService.TryGetAssetAsync(scope, id, cancellationToken);

            if (result.Succeeded && result.Asset is not null)
                assetsById[id] = result.Asset;
        }

        return TenantBrandingActivationValidator.Validate(draft, assetsById);
    }

    private static IEnumerable<Guid?> CollectAssetIds(TenantBrandingProfileRecord draft) =>
    [
        draft.LogoPrimaryAssetId,
        draft.LogoSecondaryAssetId,
        draft.LogoSquareAssetId,
        draft.LogoFaviconAssetId,
        draft.LogoDarkAssetId,
        draft.LogoLightAssetId,
        draft.LogoReportCoverAssetId,
        draft.LogoMonoAssetId,
    ];

    private static TenantBrandingAdminStateResponse BuildStateResponse(
        TenantBrandingProfileRecord draftSource,
        TenantBrandingProfileRecord? active,
        TenantBrandingValidationResult validation) =>
        new()
        {
            Draft = MapDraftResponse(draftSource),
            Active = new TenantBrandingActiveSummaryResponse
            {
                IsActive = active is not null,
                Version = active?.Version,
                UpdatedUtc = active?.UpdatedUtc,
            },
            ProductDefaults = new TenantBrandColorsResponse
            {
                Primary = ProductBrandingDefaults.PrimaryColor,
                Secondary = ProductBrandingDefaults.SecondaryColor,
                Accent = ProductBrandingDefaults.AccentColor,
                Background = ProductBrandingDefaults.BackgroundColor,
                Foreground = ProductBrandingDefaults.ForegroundColor,
            },
            ValidationIssues = MapValidationIssues(validation.Issues),
            CanActivate = validation.CanActivate,
        };

    private static TenantBrandingDraftResponse MapDraftResponse(TenantBrandingProfileRecord record) =>
        new()
        {
            BrandingProfileId = record.BrandingProfileId,
            CompanyDisplayName = record.CompanyDisplayName,
            CompanyLegalName = record.CompanyLegalName,
            ShortDisplayName = record.ShortDisplayName,
            LogoPrimaryAssetId = record.LogoPrimaryAssetId,
            LogoSecondaryAssetId = record.LogoSecondaryAssetId,
            LogoSquareAssetId = record.LogoSquareAssetId,
            LogoFaviconAssetId = record.LogoFaviconAssetId,
            LogoDarkAssetId = record.LogoDarkAssetId,
            LogoLightAssetId = record.LogoLightAssetId,
            LogoReportCoverAssetId = record.LogoReportCoverAssetId,
            LogoMonoAssetId = record.LogoMonoAssetId,
            PrimaryColor = record.PrimaryColor,
            SecondaryColor = record.SecondaryColor,
            AccentColor = record.AccentColor,
            BackgroundColor = record.BackgroundColor,
            ForegroundColor = record.ForegroundColor,
            Tagline = record.Tagline,
            WebsiteUrl = record.WebsiteUrl,
            SupportUrl = record.SupportUrl,
            CoBrandingEnabled = record.CoBrandingEnabled,
            UpdatedUtc = record.UpdatedUtc,
        };

    private static TenantBrandingProfileRecord MapDraftPutRequest(
        Guid tenantId,
        Guid profileId,
        int version,
        TenantBrandingDraftPutRequest request,
        string actor,
        DateTime utcNow) =>
        new()
        {
            BrandingProfileId = profileId,
            TenantId = tenantId,
            CompanyDisplayName = SanitizeCompanyName(request.CompanyDisplayName),
            CompanyLegalName = SanitizeCompanyName(request.CompanyLegalName),
            ShortDisplayName = SanitizeCompanyName(request.ShortDisplayName),
            LogoPrimaryAssetId = request.LogoPrimaryAssetId,
            LogoSecondaryAssetId = request.LogoSecondaryAssetId,
            LogoSquareAssetId = request.LogoSquareAssetId,
            LogoFaviconAssetId = request.LogoFaviconAssetId,
            LogoDarkAssetId = request.LogoDarkAssetId,
            LogoLightAssetId = request.LogoLightAssetId,
            LogoReportCoverAssetId = request.LogoReportCoverAssetId,
            LogoMonoAssetId = request.LogoMonoAssetId,
            PrimaryColor = NormalizeHexColor(request.PrimaryColor),
            SecondaryColor = NormalizeHexColor(request.SecondaryColor),
            AccentColor = NormalizeHexColor(request.AccentColor),
            BackgroundColor = NormalizeHexColor(request.BackgroundColor),
            ForegroundColor = NormalizeHexColor(request.ForegroundColor),
            Tagline = SanitizeTagline(request.Tagline),
            WebsiteUrl = SanitizeHttpsUrl(request.WebsiteUrl),
            SupportUrl = SanitizeHttpsUrl(request.SupportUrl),
            BrandingStatus = BrandingProfileStatus.Draft,
            Version = version,
            CreatedUtc = utcNow,
            UpdatedUtc = utcNow,
            CreatedBy = actor,
            UpdatedBy = actor,
            CoBrandingEnabled = request.CoBrandingEnabled,
        };

    private static TenantBrandingProfileRecord BuildProductSeed(Guid tenantId) =>
        new()
        {
            BrandingProfileId = Guid.Empty,
            TenantId = tenantId,
            CompanyDisplayName = ProductBrandingDefaults.CompanyDisplayName,
            PrimaryColor = ProductBrandingDefaults.PrimaryColor,
            SecondaryColor = ProductBrandingDefaults.SecondaryColor,
            AccentColor = ProductBrandingDefaults.AccentColor,
            BackgroundColor = ProductBrandingDefaults.BackgroundColor,
            ForegroundColor = ProductBrandingDefaults.ForegroundColor,
            BrandingStatus = BrandingProfileStatus.Draft,
            Version = 0,
            CreatedUtc = TimeProvider.System.UtcNowDateTime(),
            UpdatedUtc = TimeProvider.System.UtcNowDateTime(),
        };

    private static TenantBrandingProfileRecord CloneProfile(
        TenantBrandingProfileRecord source,
        Guid profileId,
        BrandingProfileStatus status,
        int version,
        DateTime utcNow,
        string actor) =>
        new()
        {
            BrandingProfileId = profileId,
            TenantId = source.TenantId,
            CompanyDisplayName = source.CompanyDisplayName,
            CompanyLegalName = source.CompanyLegalName,
            ShortDisplayName = source.ShortDisplayName,
            LogoPrimaryAssetId = source.LogoPrimaryAssetId,
            LogoSecondaryAssetId = source.LogoSecondaryAssetId,
            LogoSquareAssetId = source.LogoSquareAssetId,
            LogoFaviconAssetId = source.LogoFaviconAssetId,
            LogoDarkAssetId = source.LogoDarkAssetId,
            LogoLightAssetId = source.LogoLightAssetId,
            LogoReportCoverAssetId = source.LogoReportCoverAssetId,
            LogoMonoAssetId = source.LogoMonoAssetId,
            PrimaryColor = source.PrimaryColor,
            SecondaryColor = source.SecondaryColor,
            AccentColor = source.AccentColor,
            BackgroundColor = source.BackgroundColor,
            ForegroundColor = source.ForegroundColor,
            TypographyJson = source.TypographyJson,
            Tagline = source.Tagline,
            WebsiteUrl = source.WebsiteUrl,
            SupportUrl = source.SupportUrl,
            BrandingStatus = status,
            Version = version,
            CreatedUtc = utcNow,
            UpdatedUtc = utcNow,
            CreatedBy = actor,
            UpdatedBy = actor,
            CoBrandingEnabled = source.CoBrandingEnabled,
        };

    private static IReadOnlyList<TenantBrandingValidationIssueResponse> MapValidationIssues(
        IReadOnlyList<TenantBrandingValidationIssue> issues) =>
        issues
            .Select(issue => new TenantBrandingValidationIssueResponse
            {
                Code = issue.Code,
                Severity = issue.Severity == TenantBrandingValidationSeverity.Error ? "Error" : "Warning",
                Message = issue.Message,
            })
            .ToArray();

    private static string? SanitizeCompanyName(string? raw) =>
        FirstValueReportBrandingSanitizer.TryBuildExportModel(null, raw)?.CompanyDisplayName;

    private static string? SanitizeTagline(string? raw)
    {
        if (string.IsNullOrWhiteSpace(raw))
            return null;

        string trimmed = raw.Trim();

        return trimmed.Length > 240 ? trimmed[..240] : trimmed;
    }

    private static string? SanitizeHttpsUrl(string? raw) =>
        FirstValueReportBrandingSanitizer.TryBuildExportModel(raw, null)?.LogoHttpsUrl;

    private static string? NormalizeHexColor(string? raw)
    {
        if (string.IsNullOrWhiteSpace(raw))
            return null;

        string trimmed = raw.Trim();

        if (!trimmed.StartsWith('#'))
            trimmed = $"#{trimmed}";

        return trimmed.Length is 7 or 9 ? trimmed : null;
    }
}
