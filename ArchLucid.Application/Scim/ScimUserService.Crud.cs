using System.Text.Json;

using ArchLucid.Application.Scim.Filtering;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Scim;
using ArchLucid.Core.Scim.Filtering;
using ArchLucid.Core.Scim.Models;

namespace ArchLucid.Application.Scim;

public sealed partial class ScimUserService
{
    /// <inheritdoc/>
    public async Task<(IReadOnlyList<ScimUserRecord> items, int totalResults)> ListAsync(Guid tenantId, string? filter, int startIndex, int count,
        CancellationToken cancellationToken)
    {
        ScimFilterNode? ast = ScimFilterParser.Parse(filter);
        int normalizedStartIndex = Math.Max(1, startIndex);
        (IReadOnlyList<ScimUserRecord> items, int total) =
            await _users.ListAsync(tenantId, ast, normalizedStartIndex, Math.Clamp(count, 0, 200), cancellationToken);
        return (items, total);
    }

    /// <inheritdoc/>
    public async Task<ScimUserRecord?> GetAsync(Guid tenantId, Guid id, CancellationToken cancellationToken)
    {
        ScimUserRecord? u = await _users.GetByIdAsync(tenantId, id, cancellationToken);
        if (u is null || u.DirectoryRemovedUtc is not null)
            return null;
        return u;
    }

    /// <inheritdoc/>
    public async Task<ScimUserRecord> CreateAsync(Guid tenantId, JsonElement resource, CancellationToken cancellationToken)
    {
        (string userName, string? displayName, bool active, string externalId) = ScimUserResourceParser.ParseUser(resource);
        ScimUserRecord? existingByExternalId = await _users.GetByExternalIdAsync(tenantId, externalId, cancellationToken);

        if (existingByExternalId is not null)
        {
            if (existingByExternalId.DirectoryRemovedUtc is null)
                throw new ScimConflictException($"User with externalId '{externalId}' already exists.");

            return await ReactivateRemovedUserAsync(
                tenantId,
                existingByExternalId.Id,
                externalId,
                userName,
                displayName,
                active,
                cancellationToken);
        }

        bool seatReserved = false;

        try
        {
            if (active)
            {
                bool ok = await _tenants.TryIncrementEnterpriseScimSeatAsync(tenantId, cancellationToken);

                if (!ok)
                    throw new ScimSeatLimitExceededException();

                seatReserved = true;
            }

            ScimUserRecord created = await _users.InsertAsync(tenantId, externalId, userName, displayName, active, null, ScimResolvedRoleOrigin.Unknown,
                cancellationToken);
            string? role = await ResolveRoleAsync(tenantId, created.Id, cancellationToken);
            ScimResolvedRoleOrigin origin = role is null ? ScimResolvedRoleOrigin.Unknown : ScimResolvedRoleOrigin.ScimGroups;

            if (!string.Equals(role, created.ResolvedRole, StringComparison.Ordinal))
                await _users.PatchAsync(tenantId, created.Id, null, null, null, null, role, origin, cancellationToken);

            created = await _users.GetByIdAsync(tenantId, created.Id, cancellationToken) ?? created;
            await LogAsync(tenantId, AuditEventTypes.ScimUserProvisioned, $"{{\"userId\":\"{created.Id:D}\",\"externalId\":\"{JsonEncoded(externalId)}\"}}",
                cancellationToken);

            return created;
        }
        catch
        {
            if (seatReserved)
                await _tenants.DecrementEnterpriseScimSeatAsync(tenantId, cancellationToken);

            throw;
        }
    }

    /// <inheritdoc/>
    public async Task ReplaceAsync(Guid tenantId, Guid id, JsonElement resource, CancellationToken cancellationToken)
    {
        ScimUserRecord existing = await _users.GetByIdAsync(tenantId, id, cancellationToken) ?? throw new ScimNotFoundException("User not found.");
        if (existing.DirectoryRemovedUtc is not null)
            throw new ScimNotFoundException("User not found.");
        (string userName, string? displayName, bool active, string externalId) = ScimUserResourceParser.ParseUser(resource);
        await EnsureExternalIdNotUsedByAnotherUserAsync(tenantId, id, externalId, cancellationToken);

        bool wasActive = existing.Active;

        try
        {
            await TransitionSeatAsync(tenantId, wasActive, active, cancellationToken);
            string? manualFromBody = TryReadManualResolvedRoleFromUserResource(resource);
            string? groupRole = await ResolveRoleAsync(tenantId, id, cancellationToken);
            ResolveRoleChoices choices = DecideResolvedRole(existing, manualFromBody, groupRole);

            if (choices.ShouldEmitManualOverriddenAudit)
                await EmitRoleOverriddenAuditAsync(tenantId, existing, choices.FinalRole, cancellationToken);

            await _users.ReplaceAsync(tenantId, id, externalId, userName, displayName, active, choices.FinalRole, choices.FinalOrigin, cancellationToken);
            await LogAsync(tenantId, AuditEventTypes.ScimUserUpdated, $"{{\"userId\":\"{id:D}\",\"externalId\":\"{JsonEncoded(externalId)}\"}}", cancellationToken);
        }
        catch
        {
            await CompensateSeatTransitionAsync(tenantId, wasActive, active, cancellationToken);

            throw;
        }
    }

    /// <inheritdoc/>
    public async Task DeactivateAsync(Guid tenantId, Guid id, CancellationToken cancellationToken)
    {
        ScimUserRecord existing = await _users.GetByIdAsync(tenantId, id, cancellationToken) ?? throw new ScimNotFoundException("User not found.");

        if (existing.DirectoryRemovedUtc is not null)
            throw new ScimNotFoundException("User not found.");

        bool seatDecremented = false;

        try
        {
            if (existing.Active)
            {
                await _tenants.DecrementEnterpriseScimSeatAsync(tenantId, cancellationToken);
                seatDecremented = true;
            }

            await _users.DeactivateAsync(tenantId, id, cancellationToken);
            await LogAsync(tenantId, AuditEventTypes.ScimUserDeactivated, $"{{\"userId\":\"{id:D}\"}}", cancellationToken);
        }
        catch
        {
            if (seatDecremented)
                await _tenants.TryIncrementEnterpriseScimSeatAsync(tenantId, cancellationToken);

            throw;
        }
    }

    private async Task EnsureExternalIdNotUsedByAnotherUserAsync(
        Guid tenantId,
        Guid userId,
        string externalId,
        CancellationToken cancellationToken)
    {
        ScimUserRecord? other = await _users.GetByExternalIdAsync(tenantId, externalId, cancellationToken);

        if (other is not null && other.Id != userId && other.DirectoryRemovedUtc is null)
            throw new ScimConflictException($"User with externalId '{externalId}' already exists.");
    }

    private async Task<ScimUserRecord> ReactivateRemovedUserAsync(
        Guid tenantId,
        Guid id,
        string externalId,
        string userName,
        string? displayName,
        bool active,
        CancellationToken cancellationToken)
    {
        bool seatReserved = false;

        try
        {
            if (active)
            {
                bool ok = await _tenants.TryIncrementEnterpriseScimSeatAsync(tenantId, cancellationToken);

                if (!ok)
                    throw new ScimSeatLimitExceededException();

                seatReserved = true;
            }

            ScimUserRecord reactivated = await _users.ReactivateAsync(
                tenantId,
                id,
                externalId,
                userName,
                displayName,
                active,
                null,
                ScimResolvedRoleOrigin.Unknown,
                cancellationToken);
            string? role = await ResolveRoleAsync(tenantId, id, cancellationToken);
            ScimResolvedRoleOrigin origin = role is null ? ScimResolvedRoleOrigin.Unknown : ScimResolvedRoleOrigin.ScimGroups;

            if (!string.Equals(role, reactivated.ResolvedRole, StringComparison.Ordinal))
                await _users.PatchAsync(tenantId, id, null, null, null, null, role, origin, cancellationToken);

            reactivated = await _users.GetByIdAsync(tenantId, id, cancellationToken) ?? reactivated;
            await LogAsync(tenantId, AuditEventTypes.ScimUserProvisioned, $"{{\"userId\":\"{reactivated.Id:D}\",\"externalId\":\"{JsonEncoded(externalId)}\"}}",
                cancellationToken);

            return reactivated;
        }
        catch
        {
            if (seatReserved)
                await _tenants.DecrementEnterpriseScimSeatAsync(tenantId, cancellationToken);

            throw;
        }
    }
}
