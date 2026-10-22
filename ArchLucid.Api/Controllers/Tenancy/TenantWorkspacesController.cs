using ArchLucid.Api.Models.Tenancy;
using ArchLucid.Application.Common;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;

using Asp.Versioning;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;

namespace ArchLucid.Api.Controllers.Tenancy;

/// <summary>Lists workspaces and architecture projects for the authenticated tenant scope.</summary>
[ApiController]
[Authorize]
[ApiVersion("1.0")]
[Route("v{version:apiVersion}/tenant/workspaces")]
public sealed partial class TenantWorkspacesController(
    ITenantRepository tenantRepository,
    IArchitectureProjectRepository architectureProjectRepository,
    IScopeContextProvider scopeProvider,
    IAuditService auditService,
    IActorContext actorContext,
    IOptionsMonitor<ArchitectureProjectRetentionPurgeOptions> retentionPurgeOptions) : ControllerBase
{
    private readonly ITenantRepository _tenantRepository =
        tenantRepository ?? throw new ArgumentNullException(nameof(tenantRepository));

    private readonly IArchitectureProjectRepository _architectureProjectRepository =
        architectureProjectRepository ?? throw new ArgumentNullException(nameof(architectureProjectRepository));

    private readonly IScopeContextProvider _scopeProvider =
        scopeProvider ?? throw new ArgumentNullException(nameof(scopeProvider));

    private readonly IAuditService _auditService = auditService ?? throw new ArgumentNullException(nameof(auditService));

    private readonly IActorContext _actorContext =
        actorContext ?? throw new ArgumentNullException(nameof(actorContext));

    private readonly IOptionsMonitor<ArchitectureProjectRetentionPurgeOptions> _retentionPurgeOptions =
        retentionPurgeOptions ?? throw new ArgumentNullException(nameof(retentionPurgeOptions));

    private static TenantWorkspaceListItem? FindWorkspace(
        IReadOnlyList<TenantWorkspaceListItem> workspaces,
        Guid workspaceId) =>
        workspaces.FirstOrDefault(w => w.WorkspaceId == workspaceId);

    private static bool CallerWorkspacePinsProjectAsDefault(
        IReadOnlyList<TenantWorkspaceListItem> workspaces,
        Guid workspaceId,
        Guid projectId) =>
        workspaces.Any(w => w.WorkspaceId == workspaceId && w.DefaultProjectId == projectId && w.DefaultProjectId != Guid.Empty);

    private static bool ForeignWorkspacePinsProjectAsDefault(
        IReadOnlyList<TenantWorkspaceListItem> workspaces,
        Guid workspaceId,
        Guid projectId) =>
        workspaces.Any(w => w.WorkspaceId != workspaceId && w.DefaultProjectId == projectId && w.DefaultProjectId != Guid.Empty);

    private static Guid ResolveScopedWorkspaceDefaultProjectId(
        IReadOnlyList<TenantWorkspaceListItem> workspaces,
        Guid workspaceId,
        Guid scopedProjectId,
        IReadOnlyList<TenantWorkspaceProjectApiDto> activeProjectsInWorkspace)
    {
        HashSet<Guid> activeProjectIds = activeProjectsInWorkspace
            .Select(static project => project.ProjectId)
            .ToHashSet();

        Guid fallbackDefaultProjectId = Guid.Empty;

        foreach (TenantWorkspaceListItem row in workspaces)
        {
            if (row.WorkspaceId != workspaceId)
                continue;

            if (row.DefaultProjectId == Guid.Empty || !activeProjectIds.Contains(row.DefaultProjectId))
                continue;

            if (row.DefaultProjectId == scopedProjectId)
                return scopedProjectId;

            if (fallbackDefaultProjectId == Guid.Empty)
                fallbackDefaultProjectId = row.DefaultProjectId;
        }

        return fallbackDefaultProjectId;
    }

    private static TenantWorkspaceListItem? ResolveScopedWorkspaceInventoryRow(
        IReadOnlyList<TenantWorkspaceListItem> workspaces,
        Guid workspaceId,
        Guid scopedProjectId,
        IReadOnlyList<TenantWorkspaceProjectApiDto> activeProjectsInWorkspace,
        Guid resolvedDefaultProjectId,
        bool preferInactiveScopedInventoryRow = false)
    {
        HashSet<Guid> activeProjectIds = activeProjectsInWorkspace
            .Select(static project => project.ProjectId)
            .ToHashSet();

        if (preferInactiveScopedInventoryRow
            && scopedProjectId != Guid.Empty
            && !activeProjectIds.Contains(scopedProjectId))
        {
            foreach (TenantWorkspaceListItem row in workspaces)
            {
                if (row.WorkspaceId == workspaceId && row.DefaultProjectId == scopedProjectId)
                    return row;
            }
        }

        if (resolvedDefaultProjectId != Guid.Empty)
        {
            TenantWorkspaceListItem? firstDefaultRow = null;
            TenantWorkspaceListItem? scopedDefaultRow = null;

            foreach (TenantWorkspaceListItem row in workspaces)
            {
                if (row.WorkspaceId != workspaceId || row.DefaultProjectId != resolvedDefaultProjectId)
                    continue;

                firstDefaultRow ??= row;

                if (row.DefaultProjectId == scopedProjectId)
                    scopedDefaultRow ??= row;
            }

            if (scopedDefaultRow is not null)
                return scopedDefaultRow;

            if (firstDefaultRow is not null)
                return firstDefaultRow;
        }

        if (!preferInactiveScopedInventoryRow
            && scopedProjectId != Guid.Empty
            && !activeProjectIds.Contains(scopedProjectId))
        {
            foreach (TenantWorkspaceListItem row in workspaces)
            {
                if (row.WorkspaceId == workspaceId && row.DefaultProjectId == scopedProjectId)
                    return row;
            }
        }

        TenantWorkspaceListItem? fallbackRow = null;

        foreach (TenantWorkspaceListItem row in workspaces)
        {
            if (row.WorkspaceId != workspaceId)
                continue;

            if (row.DefaultProjectId == Guid.Empty || !activeProjectIds.Contains(row.DefaultProjectId))
                continue;

            if (row.DefaultProjectId == scopedProjectId)
                return row;

            if (fallbackRow is null)
                fallbackRow = row;
        }

        if (fallbackRow is not null)
            return fallbackRow;

        return FindWorkspace(workspaces, workspaceId);
    }

    private static bool ForeignWorkspaceMetadataProtectsFromRetentionPurge(
        IReadOnlyList<TenantWorkspaceListItem> workspaces,
        Guid callerWorkspaceId,
        Guid deletedProjectId,
        ILookup<Guid, ArchitectureProjectRecord> activeProjectsByWorkspace)
    {
        IEnumerable<Guid> foreignWorkspaceIds = workspaces
            .Select(workspace => workspace.WorkspaceId)
            .Where(workspaceId => workspaceId != callerWorkspaceId)
            .Distinct();

        foreach (Guid foreignWorkspaceId in foreignWorkspaceIds)
        {
            List<TenantWorkspaceProjectApiDto> foreignActiveProjects = activeProjectsByWorkspace[foreignWorkspaceId]
                .OrderBy(static project => project.Name, StringComparer.OrdinalIgnoreCase)
                .Select(
                    project => new TenantWorkspaceProjectApiDto
                    {
                        ProjectId = project.Id,
                        Name = project.Name,
                        DisplayName = project.Name
                    })
                .ToList();

            Guid foreignResolvedDefaultProjectId = ResolveScopedWorkspaceDefaultProjectId(
                workspaces,
                foreignWorkspaceId,
                Guid.Empty,
                foreignActiveProjects);

            HashSet<Guid> foreignWorkspaceDefaultPinProjectIds = workspaces
                .Where(workspace => workspace.WorkspaceId == foreignWorkspaceId)
                .Select(workspace => workspace.DefaultProjectId)
                .Where(projectId => projectId != Guid.Empty)
                .ToHashSet();

            if (!foreignWorkspaceDefaultPinProjectIds.Contains(deletedProjectId))
                continue;

            if (deletedProjectId == foreignResolvedDefaultProjectId
                || (foreignResolvedDefaultProjectId == Guid.Empty && foreignActiveProjects.Count == 0))
            {
                return true;
            }
        }

        return false;
    }

}
