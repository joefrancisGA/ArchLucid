using System.Text.Json;

using ArchLucid.Application.Scim.Patching;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Scim;
using ArchLucid.Core.Scim.Models;
using ArchLucid.Core.Scoping;

using Microsoft.Extensions.Logging;

namespace ArchLucid.Application.Scim;

public sealed partial class ScimUserService
{
    /// <inheritdoc/>
    public async Task PatchAsync(Guid tenantId, Guid id, JsonElement patch, CancellationToken cancellationToken)
    {
        ScimUserRecord existing = await _users.GetByIdAsync(tenantId, id, cancellationToken) ?? throw new ScimNotFoundException("User not found.");
        if (existing.DirectoryRemovedUtc is not null)
            throw new ScimNotFoundException("User not found.");
        Dictionary<string, JsonElement> current = BuildFlatMap(existing);
        IReadOnlyDictionary<string, JsonElement> next;
        try
        {
            next = ScimPatchOpEvaluator.ApplyFlat(current, patch);
        }
        catch (ScimPatchException ex)
        {
            throw new ScimUserResourceParseException(ex.ScimType, ex.Message);
        }

        string? manualFromPatch = TryReadOptionalTrimmed(next, ManualResolvedRoleFlatPath, StringComparer.OrdinalIgnoreCase);
        Dictionary<string, JsonElement> core = ToCoreNextMap(next);
        bool nextActive = ReadActive(core, existing.Active);
        string externalId = ReadString(core, "externalId", existing.ExternalId);
        string userName = ReadString(core, "userName", existing.UserName);
        string? displayName = ReadOptionalString(core, "displayName", existing.DisplayName);
        await EnsureExternalIdNotUsedByAnotherUserAsync(tenantId, id, externalId, cancellationToken);

        bool wasActive = existing.Active;

        try
        {
            await TransitionSeatAsync(tenantId, wasActive, nextActive, cancellationToken);
            string? groupRole = await ResolveRoleAsync(tenantId, id, cancellationToken);
            ResolveRoleChoices choices = DecideResolvedRole(existing, manualFromPatch, groupRole);

            if (choices.ShouldEmitManualOverriddenAudit)
                await EmitRoleOverriddenAuditAsync(tenantId, existing, choices.FinalRole, cancellationToken);

            await _users.PatchAsync(tenantId, id, externalId, userName, displayName, nextActive, choices.FinalRole, choices.FinalOrigin, cancellationToken);
            await LogAsync(tenantId, AuditEventTypes.ScimUserUpdated, $"{{\"userId\":\"{id:D}\"}}", cancellationToken);
        }
        catch
        {
            await CompensateSeatTransitionAsync(tenantId, wasActive, nextActive, cancellationToken);

            throw;
        }
    }

    private async Task CompensateSeatTransitionAsync(Guid tenantId, bool wasActive, bool willBeActive, CancellationToken ct)
    {
        if (wasActive == willBeActive)
            return;

        if (willBeActive)
            await _tenants.DecrementEnterpriseScimSeatAsync(tenantId, ct);
        else
            await _tenants.TryIncrementEnterpriseScimSeatAsync(tenantId, ct);
    }

    private static Dictionary<string, JsonElement> ToCoreNextMap(IReadOnlyDictionary<string, JsonElement> next)
    {
        Dictionary<string, JsonElement> core = new(next, StringComparer.OrdinalIgnoreCase);
        foreach (string k in core.Keys.Where(static k => string.Equals(k, ManualResolvedRoleFlatPath, StringComparison.OrdinalIgnoreCase)).ToList())
            core.Remove(k);
        return core;
    }

    private static ResolveRoleChoices DecideResolvedRole(ScimUserRecord existing, string? manualFromRequest, string? groupMapped)
    {
        if (groupMapped is null)
            return manualFromRequest is not null
                ? new ResolveRoleChoices(manualFromRequest, ScimResolvedRoleOrigin.Manual, false)
                : new ResolveRoleChoices(existing.ResolvedRole, existing.ResolvedRoleOrigin, false);
        bool fire = existing.ResolvedRoleOrigin == ScimResolvedRoleOrigin.Manual &&
                    !string.Equals(existing.ResolvedRole, groupMapped, StringComparison.OrdinalIgnoreCase);
        return new ResolveRoleChoices(groupMapped, ScimResolvedRoleOrigin.ScimGroups, fire);
    }

    private Task EmitRoleOverriddenAuditAsync(Guid tenantId, ScimUserRecord existing, string? incomingGroupRole, CancellationToken ct)
    {
        string payload = JsonSerializer.Serialize(new
        {
            userId = existing.Id,
            fromRole = existing.ResolvedRole ?? string.Empty,
            toRole = incomingGroupRole ?? string.Empty
        });
        return LogRequiredAsync(tenantId, AuditEventTypes.RoleOverriddenByScim, payload, ct);
    }

    private async Task TransitionSeatAsync(Guid tenantId, bool wasActive, bool willBeActive, CancellationToken ct)
    {
        if (wasActive == willBeActive)
            return;

        if (willBeActive)
        {
            bool ok = await _tenants.TryIncrementEnterpriseScimSeatAsync(tenantId, ct);
            if (!ok)
                throw new ScimSeatLimitExceededException();
            return;
        }

        await _tenants.DecrementEnterpriseScimSeatAsync(tenantId, ct);
    }

    private static Dictionary<string, JsonElement> BuildFlatMap(ScimUserRecord u)
    {
        Dictionary<string, JsonElement> d = new(StringComparer.OrdinalIgnoreCase);
        using JsonDocument doc = JsonDocument.Parse($$"""
                                                      {"userName":{{JsonSerializer.Serialize(u.UserName)}},"displayName":{{JsonSerializer.Serialize(u.DisplayName ?? string.Empty)}},"active":{{(u.Active ? "true" : "false")}},"externalId":{{JsonSerializer.Serialize(u.ExternalId)}}}
                                                      """);
        foreach (JsonProperty p in doc.RootElement.EnumerateObject())
            d[p.Name] = p.Value.Clone();
        return d;
    }

    private static bool ReadActive(IReadOnlyDictionary<string, JsonElement> next, bool fallback)
    {
        if (!next.TryGetValue("active", out JsonElement el))
            return fallback;
        return el.ValueKind switch
        {
            JsonValueKind.True => true,
            JsonValueKind.False => false,
            JsonValueKind.String => bool.TryParse(el.GetString(), out bool b) && b,
            _ => fallback
        };
    }

    private static string ReadString(IReadOnlyDictionary<string, JsonElement> next, string key, string fallback)
    {
        if (!next.TryGetValue(key, out JsonElement el) || el.ValueKind != JsonValueKind.String)
            return fallback;
        string v = el.GetString() ?? fallback;
        return string.IsNullOrWhiteSpace(v) ? fallback : v.Trim();
    }

    private static string? ReadOptionalString(IReadOnlyDictionary<string, JsonElement> next, string key, string? fallback)
    {
        if (!next.TryGetValue(key, out JsonElement el) || el.ValueKind == JsonValueKind.Null)
            return fallback;
        return el.ValueKind != JsonValueKind.String ? fallback : el.GetString();
    }

    private static string? TryReadOptionalTrimmed(IReadOnlyDictionary<string, JsonElement> next, string key, StringComparer comparer)
    {
        foreach (KeyValuePair<string, JsonElement> p in next)
        {
            if (comparer.Compare(p.Key, key) != 0)
                continue;
            JsonElement el = p.Value;
            if (el.ValueKind is JsonValueKind.Null or not JsonValueKind.String)
                return null;
            string? trimmed = el.GetString()?.Trim();
            return string.IsNullOrWhiteSpace(trimmed) ? null : trimmed;
        }

        return null;
    }

    private async Task<string?> ResolveRoleAsync(Guid tenantId, Guid? userId, CancellationToken ct)
    {
        if (userId is null)
            return null;
        IReadOnlyList<(string DisplayName, string ExternalId)> groups = await _users.ListGroupKeysForUserAsync(tenantId, userId.Value, ct);
        int best = 0;
        string? chosen = null;
        foreach ((string display, string external) in groups)
        {
            string? role = _roleMapper.TryMapGroupToRole(display, external);
            if (role is null)
                continue;
            int rank = RoleRank(role);
            if (rank <= best)
                continue;
            best = rank;
            chosen = role;
        }

        return chosen;
    }

    private static int RoleRank(string role)
    {
        return role.Trim() switch
        {
            "Admin" => 4,
            "Operator" => 3,
            "Auditor" => 2,
            "Reader" => 1,
            _ => 0
        };
    }

    private async Task LogAsync(Guid tenantId, string eventType, string dataJson, CancellationToken ct)
    {
        await _audit.LogAsync(new AuditEvent
        {
            EventType = eventType,
            ActorUserId = "scim",
            ActorUserName = "SCIM provisioning",
            TenantId = tenantId,
            WorkspaceId = ScopeIds.DefaultWorkspace,
            ProjectId = ScopeIds.DefaultProject,
            DataJson = dataJson
        }, ct);
    }

    private Task LogRequiredAsync(Guid tenantId, string eventType, string dataJson, CancellationToken ct)
    {
        AuditEvent auditEvent = new()
        {
            EventType = eventType,
            ActorUserId = "scim",
            ActorUserName = "SCIM provisioning",
            TenantId = tenantId,
            WorkspaceId = ScopeIds.DefaultWorkspace,
            ProjectId = ScopeIds.DefaultProject,
            DataJson = dataJson
        };

        return DurableAuditLogRetry.LogOrThrowAsync(
            token => _audit.LogAsync(auditEvent, token),
            _logger,
            $"{eventType}:{tenantId:N}",
            ct,
            auditEventTypeForMetrics: eventType);
    }

    private static string JsonEncoded(string s)
    {
        return JsonSerializer.Serialize(s).Trim('"');
    }

    private static string? TryReadManualResolvedRoleFromUserResource(JsonElement resource)
    {
        if (!resource.TryGetProperty(ManualResolvedRoleFlatPath, out JsonElement el) || el.ValueKind != JsonValueKind.String)
            return null;
        string? trimmed = el.GetString()?.Trim();
        return string.IsNullOrWhiteSpace(trimmed) ? null : trimmed;
    }

    private sealed record ResolveRoleChoices(string? FinalRole, ScimResolvedRoleOrigin FinalOrigin, bool ShouldEmitManualOverriddenAudit);
}
