using System.Text.Json;

using ArchLucid.Api.Models.Tenancy;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;

using Asp.Versioning;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ArchLucid.Api.Controllers.Tenancy;

/// <summary>Lists workspaces and architecture projects for the authenticated tenant scope.</summary>
[ApiController]
[Authorize]
[ApiVersion("1.0")]
[Route("v{version:apiVersion}/tenant/workspaces")]
public sealed class TenantWorkspacesController(
    ITenantRepository tenantRepository,
    IArchitectureProjectRepository architectureProjectRepository,
    IScopeContextProvider scopeProvider,
    IAuditService auditService) : ControllerBase
{
    private readonly ITenantRepository _tenantRepository =
        tenantRepository ?? throw new ArgumentNullException(nameof(tenantRepository));

    private readonly IArchitectureProjectRepository _architectureProjectRepository =
        architectureProjectRepository ?? throw new ArgumentNullException(nameof(architectureProjectRepository));

    private readonly IScopeContextProvider _scopeProvider =
        scopeProvider ?? throw new ArgumentNullException(nameof(scopeProvider));

    private readonly IAuditService _auditService = auditService ?? throw new ArgumentNullException(nameof(auditService));

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

        IReadOnlyList<TenantWorkspaceListItem> workspaces =
            await _tenantRepository.ListWorkspacesAsync(scope.TenantId, cancellationToken);

        IReadOnlyList<ArchitectureProjectRecord> projects =
            await _architectureProjectRepository.ListActiveByTenantAsync(scope.TenantId, cancellationToken);

        ILookup<Guid, ArchitectureProjectRecord> byWorkspace = projects.ToLookup(static p => p.WorkspaceId);

        TenantWorkspacesListResponse body = new()
        {
            Workspaces = workspaces
                .Select(
                    w => new TenantWorkspaceApiDto
                    {
                        WorkspaceId = w.WorkspaceId,
                        Name = w.Name,
                        DisplayName = w.Name,
                        Projects = byWorkspace[w.WorkspaceId]
                            .OrderBy(static p => p.Name, StringComparer.OrdinalIgnoreCase)
                            .Select(
                                p => new TenantWorkspaceProjectApiDto
                                {
                                    ProjectId = p.Id,
                                    Name = p.Name,
                                    DisplayName = p.Name
                                })
                            .ToList()
                    })
                .ToList()
        };

        return Ok(body);
    }

    /// <summary>Soft-deletes an architecture project (<c>IsDeleted = 1</c>); not allowed for the workspace default project.</summary>
    [HttpDelete("{workspaceId:guid}/projects/{projectId:guid}")]
    [Authorize(Policy = ArchLucidPolicies.ExecuteAuthority)]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(Microsoft.AspNetCore.Mvc.ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(Microsoft.AspNetCore.Mvc.ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteProjectAsync(Guid workspaceId, Guid projectId, CancellationToken cancellationToken)
    {
        ScopeContext scope = _scopeProvider.GetCurrentScope();
        TenantRecord? tenant = await _tenantRepository.GetByIdAsync(scope.TenantId, cancellationToken);

        if (tenant is null)
            return this.NotFoundProblem("Tenant not found.", ProblemTypes.ResourceNotFound);

        IReadOnlyList<TenantWorkspaceListItem> workspaces =
            await _tenantRepository.ListWorkspacesAsync(scope.TenantId, cancellationToken);

        TenantWorkspaceListItem? workspace = workspaces.SingleOrDefault(w => w.WorkspaceId == workspaceId);

        if (workspace is null)
            return this.NotFoundProblem("Workspace was not found for this tenant.", ProblemTypes.ResourceNotFound);

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
}
