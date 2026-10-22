using ArchLucid.Api.Attributes;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Contracts.User;
using ArchLucid.Core.Audit;
using ArchLucid.Core.UserPreferences;

using Microsoft.AspNetCore.Mvc;

namespace ArchLucid.Api.Controllers.User;

public sealed partial class UserPreferencesController
{
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
}
