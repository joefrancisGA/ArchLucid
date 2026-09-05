using System.Text.Json;

using ArchLucid.Api.ProblemDetails;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ArchLucid.Api.Controllers.Tenancy;

public sealed partial class TenantWorkspacesController
{
    /// <summary>Soft-deletes an architecture project (<c>IsDeleted = 1</c>); not allowed for the workspace default project.</summary>
    [HttpDelete("{workspaceId:guid}/projects/{projectId:guid}")]
    [Authorize(Policy = ArchLucidPolicies.ExecuteAuthority)]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(Microsoft.AspNetCore.Mvc.ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(Microsoft.AspNetCore.Mvc.ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteProjectAsync(Guid workspaceId, Guid projectId, CancellationToken cancellationToken)
    {
        if (workspaceId == Guid.Empty)
            return this.BadRequestProblem("workspaceId is required.", ProblemTypes.ValidationFailed);

        if (projectId == Guid.Empty)
            return this.BadRequestProblem("projectId is required.", ProblemTypes.ValidationFailed);

        ScopeContext scope = _scopeProvider.GetCurrentScope();
        TenantRecord? tenant = await _tenantRepository.GetByIdAsync(scope.TenantId, cancellationToken);

        if (tenant is null)
            return this.NotFoundProblem("Tenant not found.", ProblemTypes.ResourceNotFound);

        IReadOnlyList<TenantWorkspaceListItem> workspaces =
            await _tenantRepository.ListWorkspacesAsync(scope.TenantId, cancellationToken);

        TenantWorkspaceListItem? workspace = workspaces.SingleOrDefault(w => w.WorkspaceId == workspaceId);

        if (workspace is null)
            return this.NotFoundProblem("Workspace was not found for this tenant.", ProblemTypes.ResourceNotFound);

        if (workspaceId != scope.WorkspaceId)
            return this.NotFoundProblem("Workspace was not found for this tenant.", ProblemTypes.ResourceNotFound);

        if (projectId != scope.ProjectId)
            return this.NotFoundProblem("Architecture project was not found for this tenant.", ProblemTypes.ResourceNotFound);

        if (workspace.DefaultProjectId == projectId)
        {
            return this.BadRequestProblem(
                "The workspace default architecture project cannot be deleted. Create another project and re-point the workspace default first.",
                ProblemTypes.BusinessRuleViolation);
        }

        bool deleted = await _architectureProjectRepository.TrySoftDeleteAsync(
            scope.TenantId,
            workspaceId,
            projectId,
            cancellationToken);

        if (!deleted)
            return this.NotFoundProblem("Architecture project was not found or is already deleted.", ProblemTypes.ResourceNotFound);

        await _auditService.LogAsync(
            new AuditEvent
            {
                EventType = AuditEventTypes.ArchitectureProjectSoftDeleted,
                TenantId = scope.TenantId,
                WorkspaceId = workspaceId,
                ProjectId = projectId,
                DataJson = JsonSerializer.Serialize(
                    new
                    {
                        workspaceId,
                        projectId
                    })
            },
            cancellationToken);

        return NoContent();
    }

    /// <summary>
    /// Restores a soft-deleted architecture project when no active project in the workspace already uses the same
    /// name.
    /// </summary>
    // idempotency-posture: operator-documented-safe-retry
    [HttpPost("{workspaceId:guid}/projects/{projectId:guid}/restore")]
    [Authorize(Policy = ArchLucidPolicies.ExecuteAuthority)]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(Microsoft.AspNetCore.Mvc.ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(Microsoft.AspNetCore.Mvc.ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(Microsoft.AspNetCore.Mvc.ProblemDetails), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> RestoreProjectAsync(
        Guid workspaceId,
        Guid projectId,
        CancellationToken cancellationToken)
    {
        if (workspaceId == Guid.Empty)
            return this.BadRequestProblem("workspaceId is required.", ProblemTypes.ValidationFailed);

        if (projectId == Guid.Empty)
            return this.BadRequestProblem("projectId is required.", ProblemTypes.ValidationFailed);

        ScopeContext scope = _scopeProvider.GetCurrentScope();
        TenantRecord? tenant = await _tenantRepository.GetByIdAsync(scope.TenantId, cancellationToken);

        if (tenant is null)
            return this.NotFoundProblem("Tenant not found.", ProblemTypes.ResourceNotFound);

        IReadOnlyList<TenantWorkspaceListItem> workspaces =
            await _tenantRepository.ListWorkspacesAsync(scope.TenantId, cancellationToken);

        TenantWorkspaceListItem? workspace = workspaces.SingleOrDefault(w => w.WorkspaceId == workspaceId);

        if (workspace is null)
            return this.NotFoundProblem("Workspace was not found for this tenant.", ProblemTypes.ResourceNotFound);

        if (workspaceId != scope.WorkspaceId)
            return this.NotFoundProblem("Workspace was not found for this tenant.", ProblemTypes.ResourceNotFound);

        if (projectId != scope.ProjectId)
            return this.NotFoundProblem("Architecture project was not found for this tenant.", ProblemTypes.ResourceNotFound);

        ArchitectureProjectRestoreResult outcome =
            await _architectureProjectRepository.TryRestoreAsync(
                scope.TenantId,
                workspaceId,
                projectId,
                cancellationToken);

        if (outcome == ArchitectureProjectRestoreResult.NotFoundOrNotDeleted)
            return this.NotFoundProblem("Architecture project was not found or is not soft-deleted.", ProblemTypes.ResourceNotFound);

        if (outcome == ArchitectureProjectRestoreResult.AlreadyActive)
            return NoContent();

        if (outcome == ArchitectureProjectRestoreResult.ActiveProjectNameCollision)
        {
            return this.ConflictProblem(
                "Another active architecture project in this workspace already uses this name; rename or remove it before restoring.",
                ProblemTypes.Conflict);
        }

        await _auditService.LogAsync(
            new AuditEvent
            {
                EventType = AuditEventTypes.ArchitectureProjectRestored,
                TenantId = scope.TenantId,
                WorkspaceId = workspaceId,
                ProjectId = projectId,
                DataJson = JsonSerializer.Serialize(new { workspaceId, projectId })
            },
            cancellationToken);

        return NoContent();
    }
}
