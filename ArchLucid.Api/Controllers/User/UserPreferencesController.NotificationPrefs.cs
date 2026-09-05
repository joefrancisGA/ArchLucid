using ArchLucid.Api.Attributes;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Contracts.User;
using ArchLucid.Core.Audit;
using ArchLucid.Core.UserPreferences;

using Microsoft.AspNetCore.Mvc;

namespace ArchLucid.Api.Controllers.User;

public sealed partial class UserPreferencesController
{
    /// <summary>Persists whether Where to go next follow-up strips are shown.</summary>
    [HttpPut("where-to-go-next")]
    [MutatingAuditExcluded("Personal Where to go next visibility stored in dbo.UserSettings; no durable tenant audit row required.")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> SetWhereToGoNextVisibility(
        [FromBody] SetWhereToGoNextVisibilityRequest? body,
        CancellationToken cancellationToken)
    {
        if (body is null)
        {
            return this.BadRequestProblem("Request body is required.", ProblemTypes.ValidationFailed);
        }

        string userId = _actorContext.GetActorId();
        string serialized = WhereToGoNextVisibilityValues.Serialize(body.Enabled);

        await _userSettingsRepository.UpsertAsync(
            userId,
            UserSettingKeys.WhereToGoNextEnabled,
            serialized,
            cancellationToken);

        return NoContent();
    }

    /// <summary>Persists whether sample reviews are shown on Overview.</summary>
    [HttpPut("sample-reviews-on-overview")]
    [MutatingAuditExcluded("Personal sample-reviews-on-Overview visibility stored in dbo.UserSettings; no durable tenant audit row required.")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> SetSampleReviewsOnOverviewVisibility(
        [FromBody] SetSampleReviewsOnOverviewVisibilityRequest? body,
        CancellationToken cancellationToken)
    {
        if (body is null)
        {
            return this.BadRequestProblem("Request body is required.", ProblemTypes.ValidationFailed);
        }

        string userId = _actorContext.GetActorId();
        string serialized = SampleReviewsOnOverviewVisibilityValues.Serialize(body.Enabled);

        await _userSettingsRepository.UpsertAsync(
            userId,
            UserSettingKeys.SampleReviewsOnOverviewEnabled,
            serialized,
            cancellationToken);

        return NoContent();
    }

    /// <summary>Persists the authenticated user's personal IANA time zone preference.</summary>
    [HttpPut("time-zone")]
    [MutatingAuditExcluded("Personal time zone stored in dbo.UserSettings; no durable tenant audit row required.")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> SetIanaTimeZonePreference(
        [FromBody] SetIanaTimeZonePreferenceRequest? body,
        CancellationToken cancellationToken)
    {
        if (body is null)
        {
            return this.BadRequestProblem("Request body is required.", ProblemTypes.ValidationFailed);
        }

        string? normalized = IanaTimeZonePreferenceValues.NormalizeOrNull(body.IanaTimeZoneId);

        if (normalized is null)
        {
            return this.BadRequestProblem(
                "ianaTimeZoneId must be a recognized IANA time zone id.",
                ProblemTypes.ValidationFailed);
        }

        string userId = _actorContext.GetActorId();

        await _userSettingsRepository.UpsertAsync(
            userId,
            UserSettingKeys.IanaTimeZoneId,
            normalized,
            cancellationToken);

        return NoContent();
    }

    /// <summary>Persists the authenticated user's workspace mode preference.</summary>
    [HttpPut("workspace-mode")]
    [MutatingAuditExcluded("Personal workspace mode stored in dbo.UserSettings; no durable tenant audit row required.")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> SetWorkspaceMode(
        [FromBody] SetWorkspaceModeRequest? body,
        CancellationToken cancellationToken)
    {
        if (body is null)
        {
            return this.BadRequestProblem("Request body is required.", ProblemTypes.ValidationFailed);
        }

        string serialized = WorkspaceModeValues.Serialize(body.Mode);

        if (!WorkspaceModeValues.IsExplicitValue(serialized))
        {
            return this.BadRequestProblem("mode must be 'guided' or 'working'.", ProblemTypes.ValidationFailed);
        }

        string userId = _actorContext.GetActorId();

        await _userSettingsRepository.UpsertAsync(
            userId,
            UserSettingKeys.WorkspaceMode,
            serialized,
            cancellationToken);

        return NoContent();
    }

    /// <summary>Persists the authenticated user's workspace-mode graduation-offer preference.</summary>
    [HttpPut("workspace-mode-graduation-offer")]
    [MutatingAuditExcluded("Personal workspace-mode graduation offer stored in dbo.UserSettings; no durable tenant audit row required.")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> SetWorkspaceModeGraduationOffer(
        [FromBody] SetWorkspaceModeGraduationOfferRequest? body,
        CancellationToken cancellationToken)
    {
        if (body is null)
        {
            return this.BadRequestProblem("Request body is required.", ProblemTypes.ValidationFailed);
        }

        string serialized = WorkspaceModeGraduationOfferValues.Serialize(body.State);

        if (!WorkspaceModeGraduationOfferValues.IsExplicitValue(serialized))
        {
            return this.BadRequestProblem(
                "state must be 'pending', 'dismissed', or 'remind-next'.",
                ProblemTypes.ValidationFailed);
        }

        string userId = _actorContext.GetActorId();

        await _userSettingsRepository.UpsertAsync(
            userId,
            UserSettingKeys.WorkspaceModeGraduationOffer,
            serialized,
            cancellationToken);

        return NoContent();
    }

    /// <summary>Persists the authenticated user's professional workbench layout preference.</summary>
    [HttpPut("professional-workbench")]
    [MutatingAuditExcluded("Personal professional workbench preference stored in dbo.UserSettings; no durable tenant audit row required.")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> SetProfessionalWorkbenchEnabled(
        [FromBody] SetProfessionalWorkbenchEnabledRequest? body,
        CancellationToken cancellationToken)
    {
        if (body is null)
        {
            return this.BadRequestProblem("Request body is required.", ProblemTypes.ValidationFailed);
        }

        string userId = _actorContext.GetActorId();

        await _userSettingsRepository.UpsertAsync(
            userId,
            UserSettingKeys.ProfessionalWorkbenchEnabled,
            ProfessionalWorkbenchEnabledValues.Serialize(body.Enabled),
            cancellationToken);

        return NoContent();
    }

    /// <summary>Persists the authenticated user's personal ROI loaded hourly cost (USD).</summary>
    [HttpPut("roi-loaded-hourly-cost")]
    [MutatingAuditExcluded("Personal ROI loaded hourly cost stored in dbo.UserSettings; no durable tenant audit row required.")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> SetRoiLoadedHourlyCostUsd(
        [FromBody] SetRoiLoadedHourlyCostUsdRequest? body,
        CancellationToken cancellationToken)
    {
        if (body is null)
        {
            return this.BadRequestProblem("Request body is required.", ProblemTypes.ValidationFailed);
        }

        if (body.HourlyCostUsd < RoiLoadedHourlyCostUsdValues.Min || body.HourlyCostUsd > RoiLoadedHourlyCostUsdValues.Max)
        {
            return this.BadRequestProblem(
                $"hourlyCostUsd must be between {RoiLoadedHourlyCostUsdValues.Min} and {RoiLoadedHourlyCostUsdValues.Max}.",
                ProblemTypes.ValidationFailed);
        }

        string userId = _actorContext.GetActorId();

        await _userSettingsRepository.UpsertAsync(
            userId,
            UserSettingKeys.RoiLoadedHourlyCostUsd,
            RoiLoadedHourlyCostUsdValues.Serialize(body.HourlyCostUsd),
            cancellationToken);

        return NoContent();
    }

    /// <summary>Persists the authenticated user's personal findings visibility preferences.</summary>
    [HttpPut("findings-visibility")]
    [MutatingAuditExcluded("Personal findings visibility preferences stored in dbo.UserSettings; no durable tenant audit row required.")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> SetFindingsVisibilityPreferences(
        [FromBody] SetFindingsVisibilityPreferencesRequest? body,
        CancellationToken cancellationToken)
    {
        if (body is null)
        {
            return this.BadRequestProblem("Request body is required.", ProblemTypes.ValidationFailed);
        }

        string userId = _actorContext.GetActorId();

        await _userSettingsRepository.UpsertAsync(
            userId,
            UserSettingKeys.FindingsHideGenericEnabled,
            FindingsVisibilityToggleValues.Serialize(body.HideGenericEnabled),
            cancellationToken);
        await _userSettingsRepository.UpsertAsync(
            userId,
            UserSettingKeys.FindingsShowLowConfidenceEnabled,
            FindingsVisibilityToggleValues.Serialize(body.ShowLowConfidenceEnabled),
            cancellationToken);
        await _userSettingsRepository.UpsertAsync(
            userId,
            UserSettingKeys.FindingsShowAdvisoryEnabled,
            FindingsVisibilityToggleValues.Serialize(body.ShowAdvisoryEnabled),
            cancellationToken);

        return NoContent();
    }

    /// <summary>Persists the authenticated user's Working desk continuity preferences.</summary>
    [HttpPut("desk-continuity")]
    [MutatingAuditExcluded("Personal desk continuity stored in dbo.UserSettings; no durable tenant audit row required.")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> SetDeskContinuity(
        [FromBody] SetDeskContinuityRequest? body,
        CancellationToken cancellationToken)
    {
        if (body is null)
        {
            return this.BadRequestProblem("Request body is required.", ProblemTypes.ValidationFailed);
        }

        if (body.Continuity is null)
        {
            return this.BadRequestProblem("continuity is required.", ProblemTypes.ValidationFailed);
        }

        string userId = _actorContext.GetActorId();
        string serialized = DeskContinuityValues.Serialize(body.Continuity);

        await _userSettingsRepository.UpsertAsync(
            userId,
            UserSettingKeys.DeskContinuity,
            serialized,
            cancellationToken);

        return NoContent();
    }
}
