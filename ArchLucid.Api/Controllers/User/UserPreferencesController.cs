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

/// <summary>Per-user account preferences (appearance, future personal settings).</summary>
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
        string? stored = await _userSettingsRepository.TryGetAsync(
            userId,
            UserSettingKeys.AppearancePreference,
            cancellationToken);

        string appearancePreference = AppearancePreferenceValues.NormalizeOrNull(stored)
            ?? AppearancePreferenceValues.Default;

        return Ok(new UserPreferencesResponse
        {
            AppearancePreference = appearancePreference,
            AppearancePreferenceIsExplicit = stored is not null
                && AppearancePreferenceValues.NormalizeOrNull(stored) is not null,
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
