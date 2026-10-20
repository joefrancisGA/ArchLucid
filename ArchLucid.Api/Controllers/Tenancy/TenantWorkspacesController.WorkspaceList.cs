using ArchLucid.Api.Models.Tenancy;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ArchLucid.Api.Controllers.Tenancy;

public sealed partial class TenantWorkspacesController
{
    /// <summary>Workspaces for the current <see cref="ScopeContext.TenantId" /> with active projects.</summary>
    [HttpGet]
    [Authorize(Policy = ArchLucidPolicies.ReadAuthority)]
    [ProducesResponseType(typeof(TenantWorkspacesListResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ListAsync(CancellationToken cancellationToken = default)
    {
        ScopeContext scope = _scopeProvider.GetCurrentScope();
        TenantRecord? tenant = await _tenantRepository.GetByIdAsync(scope.TenantId, cancellationToken);

        if (tenant is null)
            return this.NotFoundProblem("Tenant not found.", ProblemTypes.ResourceNotFound);

        IReadOnlyList<TenantWorkspaceListItem> workspaces = TenantWorkspaceInventoryCoalesce.CoalesceWorkspaces(
            await _tenantRepository.ListWorkspacesAsync(scope.TenantId, cancellationToken));

        if (FindWorkspace(workspaces, scope.WorkspaceId) is null)
            return this.NotFoundProblem("Workspace was not found for this tenant.", ProblemTypes.ResourceNotFound);

        IReadOnlyList<ArchitectureProjectRecord> projects =
            await _architectureProjectRepository.ListActiveByTenantAsync(scope.TenantId, cancellationToken)
            ?? Array.Empty<ArchitectureProjectRecord>();

        ILookup<Guid, ArchitectureProjectRecord> byWorkspace = projects.ToLookup(static p => p.WorkspaceId);

        int retentionDays =
            ArchitectureProjectRetentionSchedule.ClampRetentionDays(_retentionPurgeOptions.CurrentValue.RetentionDays);

        Guid workspaceId = scope.WorkspaceId;

        List<TenantWorkspaceProjectApiDto> workspaceProjects = byWorkspace[workspaceId]
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
            workspaceId,
            scope.ProjectId,
            workspaceProjects);

        TenantWorkspaceListItem displayWorkspace = ResolveScopedWorkspaceInventoryRow(
            workspaces,
            workspaceId,
            scope.ProjectId,
            workspaceProjects,
            defaultProjectId)!;

        TenantWorkspacesListResponse body = new()
        {
            RetentionDays = retentionDays,
            Workspaces =
            [
                new TenantWorkspaceApiDto
                {
                    WorkspaceId = displayWorkspace.WorkspaceId,
                    Name = displayWorkspace.Name,
                    DisplayName = displayWorkspace.Name,
                    DefaultProjectId = defaultProjectId,
                    Projects = workspaceProjects
                }
            ]
        };

        return Ok(body);
    }
}
