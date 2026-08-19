using System.Collections.Concurrent;

using ArchLucid.Core.Identity;

namespace ArchLucid.Persistence.Identity;

public sealed class InMemoryIdentityMigrationReviewRepository : IIdentityMigrationReviewRepository
{
    private readonly ConcurrentDictionary<(string LegacySourceType, Guid LegacySourceId, IdentityMigrationReviewReason ReasonCode), IdentityMigrationReviewItemRecord> _byLegacy =
        new();

    public Task UpsertAsync(
        string legacySourceType,
        Guid legacySourceId,
        Guid? tenantId,
        IdentityMigrationReviewReason reasonCode,
        string reasonDetail,
        DateTimeOffset detectedUtc,
        CancellationToken cancellationToken)
    {
        _ = cancellationToken;
        ArgumentException.ThrowIfNullOrWhiteSpace(legacySourceType);
        ArgumentException.ThrowIfNullOrWhiteSpace(reasonDetail);

        (string LegacySourceType, Guid LegacySourceId, IdentityMigrationReviewReason ReasonCode) key =
            (legacySourceType, legacySourceId, reasonCode);

        IdentityMigrationReviewItemRecord row = new()
        {
            Id = _byLegacy.TryGetValue(key, out IdentityMigrationReviewItemRecord? existing) ? existing.Id : Guid.NewGuid(),
            LegacySourceType = legacySourceType.Trim(),
            LegacySourceId = legacySourceId,
            TenantId = tenantId,
            ReasonCode = reasonCode,
            ReasonDetail = reasonDetail.Trim(),
            DetectedUtc = detectedUtc,
            ResolvedUtc = null
        };

        _byLegacy[key] = row;

        return Task.CompletedTask;
    }

    public Task<IReadOnlyList<IdentityMigrationReviewItemRecord>> ListUnresolvedAsync(CancellationToken cancellationToken)
    {
        _ = cancellationToken;

        IReadOnlyList<IdentityMigrationReviewItemRecord> rows =
            _byLegacy.Values.Where(row => row.ResolvedUtc is null).OrderByDescending(row => row.DetectedUtc).ToList();

        return Task.FromResult(rows);
    }
}

public sealed class InMemoryLegacyPlatformIdentityMigrationSource : ILegacyPlatformIdentityMigrationSource
{
    private readonly List<LegacyScimUserMigrationRow> _scimUsers = [];
    private readonly List<LegacyTrialIdentityMigrationRow> _trialUsers = [];
    private readonly List<LegacyProjectRoleAssignmentMigrationRow> _projectRoles = [];
    private readonly Dictionary<Guid, string?> _entraTenantIds = [];
    private readonly Dictionary<Guid, Guid?> _defaultWorkspaceIds = [];

    public void SeedScimUser(LegacyScimUserMigrationRow row) => _scimUsers.Add(row);

    public void SeedTrialUser(LegacyTrialIdentityMigrationRow row) => _trialUsers.Add(row);

    public void SeedProjectRole(LegacyProjectRoleAssignmentMigrationRow row) => _projectRoles.Add(row);

    public void SetEntraTenantId(Guid tenantId, string? entraTenantId) => _entraTenantIds[tenantId] = entraTenantId;

    public void SetDefaultWorkspaceId(Guid tenantId, Guid? workspaceId) => _defaultWorkspaceIds[tenantId] = workspaceId;

    public Task<IReadOnlyList<LegacyScimUserMigrationRow>> ListScimUsersAsync(CancellationToken cancellationToken)
    {
        _ = cancellationToken;

        return Task.FromResult<IReadOnlyList<LegacyScimUserMigrationRow>>(_scimUsers.ToList());
    }

    public Task<IReadOnlyList<LegacyTrialIdentityMigrationRow>> ListTrialIdentityUsersAsync(CancellationToken cancellationToken)
    {
        _ = cancellationToken;

        return Task.FromResult<IReadOnlyList<LegacyTrialIdentityMigrationRow>>(_trialUsers.ToList());
    }

    public Task<IReadOnlyList<LegacyProjectRoleAssignmentMigrationRow>> ListProjectRoleAssignmentsAsync(
        CancellationToken cancellationToken)
    {
        _ = cancellationToken;

        return Task.FromResult<IReadOnlyList<LegacyProjectRoleAssignmentMigrationRow>>(_projectRoles.ToList());
    }

    public Task<string?> TryGetEntraTenantIdAsync(Guid tenantId, CancellationToken cancellationToken)
    {
        _ = cancellationToken;

        _entraTenantIds.TryGetValue(tenantId, out string? entraTenantId);

        return Task.FromResult(entraTenantId);
    }

    public Task<Guid?> TryGetDefaultWorkspaceIdAsync(Guid tenantId, CancellationToken cancellationToken)
    {
        _ = cancellationToken;

        if (!_defaultWorkspaceIds.TryGetValue(tenantId, out Guid? workspaceId))
        {
            return Task.FromResult<Guid?>(null);
        }

        return Task.FromResult(workspaceId);
    }

    public Task LinkScimUserAsync(Guid scimUserId, Guid platformUserId, CancellationToken cancellationToken)
    {
        _ = cancellationToken;

        for (int index = 0; index < _scimUsers.Count; index++)
        {
            LegacyScimUserMigrationRow row = _scimUsers[index];

            if (row.ScimUserId != scimUserId)
            {
                continue;
            }

            _scimUsers[index] = new LegacyScimUserMigrationRow
            {
                ScimUserId = row.ScimUserId,
                TenantId = row.TenantId,
                ExternalId = row.ExternalId,
                UserName = row.UserName,
                DisplayName = row.DisplayName,
                Active = row.Active,
                ResolvedRole = row.ResolvedRole,
                PlatformUserId = platformUserId
            };
        }

        return Task.CompletedTask;
    }

    public Task LinkTrialIdentityUserAsync(Guid identityUserId, Guid platformUserId, CancellationToken cancellationToken)
    {
        _ = cancellationToken;

        for (int index = 0; index < _trialUsers.Count; index++)
        {
            LegacyTrialIdentityMigrationRow row = _trialUsers[index];

            if (row.IdentityUserId != identityUserId)
            {
                continue;
            }

            _trialUsers[index] = new LegacyTrialIdentityMigrationRow
            {
                IdentityUserId = row.IdentityUserId,
                Email = row.Email,
                NormalizedEmail = row.NormalizedEmail,
                EmailConfirmed = row.EmailConfirmed,
                EmailVerifiedUtc = row.EmailVerifiedUtc,
                LinkedEntraOid = row.LinkedEntraOid,
                PlatformUserId = platformUserId
            };
        }

        return Task.CompletedTask;
    }
}
