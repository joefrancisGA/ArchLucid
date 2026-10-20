using System.Text.Json;

using ArchLucid.Api.Models.Tenancy;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ArchLucid.Api.Controllers.Tenancy;

public sealed partial class TenantWorkspacesController
{
    /// <summary>Lists soft-deleted architecture projects grouped by workspace for the recycle-bin UI.</summary>
    [HttpGet("recycle-bin")]
    [Authorize(Policy = ArchLucidPolicies.ReadAuthority)]
    [ProducesResponseType(typeof(TenantWorkspacesRecycleBinResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ListRecycleBinAsync(CancellationToken cancellationToken)
    {
        ScopeContext scope = _scopeProvider.GetCurrentScope();
        TenantRecord? tenant = await _tenantRepository.GetByIdAsync(scope.TenantId, cancellationToken);

        if (tenant is null)
            return this.NotFoundProblem("Tenant not found.", ProblemTypes.ResourceNotFound);

        IReadOnlyList<TenantWorkspaceListItem> workspaces = TenantWorkspaceInventoryCoalesce.CoalesceWorkspaces(
            await _tenantRepository.ListWorkspacesAsync(scope.TenantId, cancellationToken));

        if (FindWorkspace(workspaces, scope.WorkspaceId) is null)
            return this.NotFoundProblem("Workspace was not found for this tenant.", ProblemTypes.ResourceNotFound);

        IReadOnlyList<ArchitectureProjectRecord> activeProjects =
            await _architectureProjectRepository.ListActiveByTenantAsync(scope.TenantId, cancellationToken)
            ?? Array.Empty<ArchitectureProjectRecord>();

        List<TenantWorkspaceProjectApiDto> workspaceActiveProjects = activeProjects
            .Where(p => p.WorkspaceId == scope.WorkspaceId)
            .OrderBy(static p => p.Name, StringComparer.OrdinalIgnoreCase)
            .Select(
                p => new TenantWorkspaceProjectApiDto
                {
                    ProjectId = p.Id,
                    Name = p.Name,
                    DisplayName = p.Name
                })
            .ToList();

        Guid defaultProjectId = ResolveScopedWorkspaceDefaultProjectId(
            workspaces,
            scope.WorkspaceId,
            scope.ProjectId,
            workspaceActiveProjects);

        TenantWorkspaceListItem displayWorkspace = ResolveScopedWorkspaceInventoryRow(
            workspaces,
            scope.WorkspaceId,
            scope.ProjectId,
            workspaceActiveProjects,
            defaultProjectId,
            preferInactiveScopedInventoryRow: true)!;

        IReadOnlyList<ArchitectureProjectRecord> deleted =
            await _architectureProjectRepository.ListSoftDeletedByTenantAsync(scope.TenantId, cancellationToken)
            ?? Array.Empty<ArchitectureProjectRecord>();

        int retentionDays =
            ArchitectureProjectRetentionSchedule.ClampRetentionDays(_retentionPurgeOptions.CurrentValue.RetentionDays);

        ILookup<Guid, ArchitectureProjectRecord> activeProjectsByWorkspace = activeProjects.ToLookup(
            static project => project.WorkspaceId);

        HashSet<Guid> currentWorkspaceDefaultPinProjectIds = workspaces
            .Where(workspace => workspace.WorkspaceId == scope.WorkspaceId)
            .Select(workspace => workspace.DefaultProjectId)
            .Where(projectId => projectId != Guid.Empty)
            .ToHashSet();

        IEnumerable<ArchitectureProjectRecord> workspaceDeleted =
            deleted.Where(p => p.WorkspaceId == scope.WorkspaceId && p.DeletedUtc.HasValue)
                .OrderBy(static p => p.Name, StringComparer.OrdinalIgnoreCase);

        TenantWorkspaceRecycleBinApiDto dto = new()
        {
            WorkspaceId = displayWorkspace.WorkspaceId,
            Name = displayWorkspace.Name,
            DisplayName = displayWorkspace.Name,
            DeletedProjects = workspaceDeleted
                .Select(
                    p =>
                    {
                        DateTimeOffset deletedUtc = p.DeletedUtc!.Value;

                        bool protectsDeletedProjectFromPurge =
                            ForeignWorkspaceMetadataProtectsFromRetentionPurge(
                                workspaces,
                                scope.WorkspaceId,
                                p.Id,
                                activeProjectsByWorkspace)
                            || (currentWorkspaceDefaultPinProjectIds.Contains(p.Id)
                                && (p.Id == defaultProjectId
                                    || (defaultProjectId == Guid.Empty && workspaceActiveProjects.Count == 0)));

                        bool retentionPurgeScheduled = !protectsDeletedProjectFromPurge;

                        return new TenantWorkspaceDeletedProjectApiDto
                        {
                            ProjectId = p.Id,
                            Name = p.Name,
                            DisplayName = p.Name,
                            DeletedUtc = deletedUtc,
                            PurgeAfterUtc = retentionPurgeScheduled
                                ? ArchitectureProjectRetentionSchedule.ComputePurgeAfterUtc(deletedUtc, retentionDays)
                                : null
                        };
                    })
                .ToList()
        };

        TenantWorkspacesRecycleBinResponse body = new()
        {
            RetentionDays = retentionDays,
            Workspaces = [dto]
        };

        return Ok(body);
    }
}
