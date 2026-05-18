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

        IReadOnlyList<ArchitectureProjectRecord> deleted =
            await _architectureProjectRepository.ListSoftDeletedByTenantAsync(scope.TenantId, cancellationToken);

        HashSet<Guid> candidateIds = [];

        foreach (ArchitectureProjectRecord row in deleted)
            candidateIds.Add(row.WorkspaceId);

        Dictionary<Guid, TenantWorkspaceListItem> byId =
            workspaces.ToDictionary(static w => w.WorkspaceId);

        List<TenantWorkspaceRecycleBinApiDto> items = [];

        foreach (Guid workspaceIdKey in candidateIds.OrderBy(static id => id))
        {
            if (!byId.TryGetValue(workspaceIdKey, out TenantWorkspaceListItem? w))
                continue;

            IEnumerable<ArchitectureProjectRecord> wsDeleted =
                deleted.Where(p => p.WorkspaceId == workspaceIdKey)
                    .OrderBy(static p => p.Name, StringComparer.OrdinalIgnoreCase);

            TenantWorkspaceRecycleBinApiDto dto = new()
            {
                WorkspaceId = w.WorkspaceId,
                Name = w.Name,
                DisplayName = w.Name,
                DeletedProjects = wsDeleted
                    .Select(
                        static p =>
                        {
                            DateTimeOffset deletedUtc = p.DeletedUtc ?? p.CreatedUtc;

                            return new TenantWorkspaceDeletedProjectApiDto
                            {
                                ProjectId = p.Id,
                                Name = p.Name,
                                DisplayName = p.Name,
                                DeletedUtc = deletedUtc
                            };
                        })
                    .ToList()
            };

            items.Add(dto);
        }

        TenantWorkspacesRecycleBinResponse body = new() { Workspaces = items };

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

    /// <summary>
    /// Restores a soft-deleted architecture project when no active project in the workspace already uses the same
    /// name.
    /// </summary>
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
        ScopeContext scope = _scopeProvider.GetCurrentScope();
        TenantRecord? tenant = await _tenantRepository.GetByIdAsync(scope.TenantId, cancellationToken);

        if (tenant is null)
            return this.NotFoundProblem("Tenant not found.", ProblemTypes.ResourceNotFound);

        IReadOnlyList<TenantWorkspaceListItem> workspaces =
            await _tenantRepository.ListWorkspacesAsync(scope.TenantId, cancellationToken);

        TenantWorkspaceListItem? workspace = workspaces.SingleOrDefault(w => w.WorkspaceId == workspaceId);

        if (workspace is null)
            return this.NotFoundProblem("Workspace was not found for this tenant.", ProblemTypes.ResourceNotFound);

        ArchitectureProjectRestoreResult outcome =
            await _architectureProjectRepository.TryRestoreAsync(
                scope.TenantId,
                workspaceId,
                projectId,
                cancellationToken);

        if (outcome == ArchitectureProjectRestoreResult.NotFoundOrNotDeleted)
            return this.NotFoundProblem("Architecture project was not found or is not soft-deleted.", ProblemTypes.ResourceNotFound);

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
