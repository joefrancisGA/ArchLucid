using ArchLucid.Api.Attributes;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Application.Common;
using ArchLucid.Contracts.User;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.Tenancy;
using ArchLucid.Core.UserPreferences;
using ArchLucid.Persistence.Data.Repositories;

using Asp.Versioning;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace ArchLucid.Api.Controllers.User;

/// <summary>Per-user account preferences (appearance, cloud-platform visibility, future personal settings).</summary>
[ApiController]
[Authorize(Policy = ArchLucidPolicies.AuthenticatedUserOnly)]
[ApiVersion("1.0")]
[Route("v{version:apiVersion}/user/preferences")]
[EnableRateLimiting("fixed")]
[RequiresCommercialTenantTier(TenantTier.Standard)]
public sealed class UserPreferencesController(
    IActorContext actorContext,
    IUserSettingsRepository userSettingsRepository) : ControllerBase
{
    private readonly IActorContext _actorContext =
        actorContext ?? throw new ArgumentNullException(nameof(actorContext));

    private readonly IUserSettingsRepository _userSettingsRepository =
        userSettingsRepository ?? throw new ArgumentNullException(nameof(userSettingsRepository));

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

        string appearancePreference = AppearancePreferenceValues.NormalizeOrNull(appearanceStored)
            ?? AppearancePreferenceValues.Default;
        CloudPlatformScopeDto cloudPlatformScope = CloudPlatformScopeValues.NormalizeOrDefault(cloudScopeStored);
        bool whereToGoNextEnabled = WhereToGoNextVisibilityValues.ParseOrDefault(whereToGoNextStored);

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

    /// <summary>Persists the authenticated user's cloud-platform visibility preference.</summary>
    [HttpPut("cloud-platforms")]
    [MutatingAuditExcluded("Personal cloud-platform scope stored in dbo.UserSettings; no durable tenant audit row required.")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> SetCloudPlatformScope(
        [FromBody] SetCloudPlatformScopeRequest? body,
        CancellationToken cancellationToken)
    {
        if (body?.Scope is null)
        {
            return this.BadRequestProblem("scope is required.", ProblemTypes.ValidationFailed);
        }

        string userId = _actorContext.GetActorId();
        string serialized = CloudPlatformScopeValues.Serialize(body.Scope);

        await _userSettingsRepository.UpsertAsync(
            userId,
            UserSettingKeys.CloudPlatformScope,
            serialized,
            cancellationToken);

        return NoContent();
    }

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
}
