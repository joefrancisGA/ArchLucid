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

        IReadOnlyList<TenantWorkspaceListItem> workspaces =
            await _tenantRepository.ListWorkspacesAsync(scope.TenantId, cancellationToken);

        TenantWorkspaceListItem? currentWorkspace =
            workspaces.SingleOrDefault(w => w.WorkspaceId == scope.WorkspaceId);

        if (currentWorkspace is null)
            return this.NotFoundProblem("Workspace was not found for this tenant.", ProblemTypes.ResourceNotFound);

        IReadOnlyList<ArchitectureProjectRecord> deleted =
            await _architectureProjectRepository.ListSoftDeletedByTenantAsync(scope.TenantId, cancellationToken);

        int retentionDays =
            ArchitectureProjectRetentionSchedule.ClampRetentionDays(_retentionPurgeOptions.CurrentValue.RetentionDays);

        IEnumerable<ArchitectureProjectRecord> workspaceDeleted =
            deleted.Where(p => p.WorkspaceId == scope.WorkspaceId && p.DeletedUtc.HasValue)
                .OrderBy(static p => p.Name, StringComparer.OrdinalIgnoreCase);

        TenantWorkspaceRecycleBinApiDto dto = new()
        {
            WorkspaceId = currentWorkspace.WorkspaceId,
            Name = currentWorkspace.Name,
            DisplayName = currentWorkspace.Name,
            DeletedProjects = workspaceDeleted
                .Select(
                    p =>
                    {
                        DateTimeOffset deletedUtc = p.DeletedUtc!.Value;

                        return new TenantWorkspaceDeletedProjectApiDto
                        {
                            ProjectId = p.Id,
                            Name = p.Name,
                            DisplayName = p.Name,
                            DeletedUtc = deletedUtc,
                            PurgeAfterUtc =
                                ArchitectureProjectRetentionSchedule.ComputePurgeAfterUtc(deletedUtc, retentionDays)
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
