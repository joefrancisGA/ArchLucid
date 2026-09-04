using ArchLucid.Api.Attributes;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Contracts.User;
using ArchLucid.Core.Audit;
using ArchLucid.Core.UserPreferences;

using Microsoft.AspNetCore.Mvc;

namespace ArchLucid.Api.Controllers.User;

public sealed partial class UserPreferencesController
{
    /// <summary>Returns preferences for the authenticated user.</summary>
    [HttpGet]
    [ProducesResponseType(typeof(UserPreferencesResponse), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetPreferences(CancellationToken cancellationToken)
    {
        string userId = _actorContext.GetActorId();
        string? appearanceStored = await _userSettingsRepository.TryGetAsync(
            userId,
            UserSettingKeys.AppearancePreference,
            cancellationToken);
        string? cloudScopeStored = await _userSettingsRepository.TryGetAsync(
            userId,
            UserSettingKeys.CloudPlatformScope,
            cancellationToken);
        string? whereToGoNextStored = await _userSettingsRepository.TryGetAsync(
            userId,
            UserSettingKeys.WhereToGoNextEnabled,
            cancellationToken);
        string? sampleReviewsOnOverviewStored = await _userSettingsRepository.TryGetAsync(
            userId,
            UserSettingKeys.SampleReviewsOnOverviewEnabled,
            cancellationToken);
        string? ianaTimeZoneStored = await _userSettingsRepository.TryGetAsync(
            userId,
            UserSettingKeys.IanaTimeZoneId,
            cancellationToken);
        string? workspaceModeStored = await _userSettingsRepository.TryGetAsync(
            userId,
            UserSettingKeys.WorkspaceMode,
            cancellationToken);
        string? workspaceModeGraduationOfferStored = await _userSettingsRepository.TryGetAsync(
            userId,
            UserSettingKeys.WorkspaceModeGraduationOffer,
            cancellationToken);
        string? professionalWorkbenchStored = await _userSettingsRepository.TryGetAsync(
            userId,
            UserSettingKeys.ProfessionalWorkbenchEnabled,
            cancellationToken);
        string? roiLoadedHourlyCostStored = await _userSettingsRepository.TryGetAsync(
            userId,
            UserSettingKeys.RoiLoadedHourlyCostUsd,
            cancellationToken);

        string appearancePreference = AppearancePreferenceValues.NormalizeOrNull(appearanceStored)
            ?? AppearancePreferenceValues.Default;
        CloudPlatformScopeDto cloudPlatformScope = CloudPlatformScopeValues.NormalizeOrDefault(cloudScopeStored);
        bool whereToGoNextEnabled = WhereToGoNextVisibilityValues.ParseOrDefault(whereToGoNextStored);
        bool sampleReviewsOnOverviewEnabled = SampleReviewsOnOverviewVisibilityValues.ParseOrDefault(sampleReviewsOnOverviewStored);
        string ianaTimeZoneId = IanaTimeZonePreferenceValues.NormalizeOrDefault(ianaTimeZoneStored);
        string workspaceMode = WorkspaceModeValues.ParseOrDefault(workspaceModeStored);
        string workspaceModeGraduationOffer = WorkspaceModeGraduationOfferValues.ParseOrDefault(workspaceModeGraduationOfferStored);
        bool professionalWorkbenchEnabled = ProfessionalWorkbenchEnabledValues.ParseOrDefault(professionalWorkbenchStored);
        decimal roiLoadedHourlyCostUsd = RoiLoadedHourlyCostUsdValues.ParseOrDefault(roiLoadedHourlyCostStored);

        return Ok(new UserPreferencesResponse
        {
            AppearancePreference = appearancePreference,
            AppearancePreferenceIsExplicit = appearanceStored is not null
                && AppearancePreferenceValues.NormalizeOrNull(appearanceStored) is not null,
            CloudPlatformScope = cloudPlatformScope,
            CloudPlatformScopeIsExplicit = cloudScopeStored is not null
                && CloudPlatformScopeValues.TryParse(cloudScopeStored) is not null,
            WhereToGoNextEnabled = whereToGoNextEnabled,
            WhereToGoNextIsExplicit = whereToGoNextStored is not null,
            SampleReviewsOnOverviewEnabled = sampleReviewsOnOverviewEnabled,
            SampleReviewsOnOverviewIsExplicit = sampleReviewsOnOverviewStored is not null,
            IanaTimeZoneId = ianaTimeZoneId,
            IanaTimeZoneIsExplicit = ianaTimeZoneStored is not null
                && IanaTimeZonePreferenceValues.NormalizeOrNull(ianaTimeZoneStored) is not null,
            WorkspaceMode = workspaceMode,
            WorkspaceModeIsExplicit = WorkspaceModeValues.IsExplicitValue(workspaceModeStored),
            WorkspaceModeGraduationOffer = workspaceModeGraduationOffer,
            WorkspaceModeGraduationOfferIsExplicit = WorkspaceModeGraduationOfferValues.IsExplicitValue(workspaceModeGraduationOfferStored),
            ProfessionalWorkbenchEnabled = professionalWorkbenchEnabled,
            ProfessionalWorkbenchEnabledIsExplicit = ProfessionalWorkbenchEnabledValues.IsExplicitValue(professionalWorkbenchStored),
            RoiLoadedHourlyCostUsd = roiLoadedHourlyCostUsd,
            RoiLoadedHourlyCostUsdIsExplicit = RoiLoadedHourlyCostUsdValues.IsExplicitValue(roiLoadedHourlyCostStored),
        });
    }

    /// <summary>Persists the authenticated user's appearance preference.</summary>
    [HttpPut("appearance")]
    [MutatingAuditExcluded("Personal appearance preference stored in dbo.UserSettings; no durable tenant audit row required.")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> SetAppearancePreference(
        [FromBody] SetAppearancePreferenceRequest? body,
        CancellationToken cancellationToken)
    {
        if (body is null)
        {
            return this.BadRequestProblem("Request body is required.", ProblemTypes.ValidationFailed);
        }

        string? normalized = AppearancePreferenceValues.NormalizeOrNull(body.Value);

        if (normalized is null)
        {
            return this.BadRequestProblem(
                "value must be 'system', 'light', or 'dark'.",
                ProblemTypes.ValidationFailed);
        }

        string userId = _actorContext.GetActorId();

        await _userSettingsRepository.UpsertAsync(
            userId,
            UserSettingKeys.AppearancePreference,
            normalized,
            cancellationToken);

        return NoContent();
    }
}
