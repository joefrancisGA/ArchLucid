using ArchLucid.Api.Models.Tenancy;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;
using ArchLucid.Persistence.Data.Repositories;

using Asp.Versioning;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ArchLucid.Api.Controllers.Tenancy;

/// <summary>Read-only workspace baseline artifact presence for executive dashboard nudges.</summary>
[ApiController]
[Authorize]
[ApiVersion("1.0")]
[Route("v{version:apiVersion}/tenant/workspace-baseline-artifacts")]
public sealed class TenantWorkspaceBaselineArtifactsController(
    ITenantRepository tenantRepository,
    IAzureExtractorPackageRepository azureExtractorPackageRepository,
    IScopeContextProvider scopeProvider) : ControllerBase
{
    private readonly IAzureExtractorPackageRepository _azureExtractorPackageRepository =
        azureExtractorPackageRepository ?? throw new ArgumentNullException(nameof(azureExtractorPackageRepository));

    private readonly IScopeContextProvider _scopeProvider =
        scopeProvider ?? throw new ArgumentNullException(nameof(scopeProvider));

    private readonly ITenantRepository _tenantRepository =
        tenantRepository ?? throw new ArgumentNullException(nameof(tenantRepository));

    /// <summary>True when at least one Azure extractor package row exists for the current tenant and workspace.</summary>
    [HttpGet]
    [Authorize(Policy = ArchLucidPolicies.ReadAuthority)]
    [ProducesResponseType(typeof(TenantWorkspaceBaselineArtifactsResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(Microsoft.AspNetCore.Mvc.ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetAsync(CancellationToken cancellationToken)
    {
        ScopeContext scope = _scopeProvider.GetCurrentScope();
        TenantRecord? tenant = await _tenantRepository.GetByIdAsync(scope.TenantId, cancellationToken);

        if (tenant is null)
            return this.NotFoundProblem("Tenant not found.", ProblemTypes.ResourceNotFound);

        bool hasBaselineArtifacts =
            await _azureExtractorPackageRepository.HasAnyInWorkspaceAsync(scope, cancellationToken);

        return Ok(new TenantWorkspaceBaselineArtifactsResponse { HasBaselineArtifacts = hasBaselineArtifacts });
    }
}
