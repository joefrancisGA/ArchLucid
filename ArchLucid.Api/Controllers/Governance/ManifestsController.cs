using ArchLucid.Api.Attributes;
using ArchLucid.Api.Http;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Api.Validators;
using ArchLucid.Application.Analysis;
using ArchLucid.Application.Diagrams;
using ArchLucid.Application.Diffs;
using ArchLucid.Application.Exports;
using ArchLucid.Application.Runs;
using ArchLucid.Application.Summaries;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.Persistence.Ports;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Queries;
using ArchLucid.Core.Tenancy;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Interfaces;

using Asp.Versioning;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace ArchLucid.Api.Controllers.Governance;

/// <summary>
///     Provides read access to golden manifests, manifest diffs, and manifest-level export operations.
/// </summary>
[ApiController]
[Authorize(Policy = ArchLucidPolicies.ReadAuthority)]
[ApiVersion("1.0")]
[Route("v{version:apiVersion}/architecture")]
[EnableRateLimiting("fixed")]
[RequiresCommercialTenantTier(TenantTier.Standard)]
[ProducesResponseType(StatusCodes.Status404NotFound)]
public sealed partial class ManifestsController(
    IUnifiedGoldenManifestReader unifiedGoldenManifestReader,
    IManifestDiffService manifestDiffService,
    IManifestDiffSummaryFormatter manifestDiffSummaryFormatter,
    IManifestDiffExportService manifestDiffExportService,
    IDiagramGenerator diagramGenerator,
    IManifestSummaryGenerator summaryGenerator,
    IManifestSummaryService manifestSummaryService,
    IArchitectureExportService exportService,
    IAgentEvidencePackageRepository agentEvidencePackageRepository,
    IManifestDiagramService manifestDiagramService,
    IScopeContextProvider scopeContextProvider,
    IRunRepository runRepository,
    IAuthorityQueryService authorityQueryService,
    ICompareRunsApplicationFacade compareRunsFacade,
    ITenantRepository tenantRepository)
    : ControllerBase
{
    private const string FormatMarkdown = "markdown";
    private const string FormatJson = "json";
    private const string FormatMermaid = "mermaid";
    private const string DiagramTypeMermaid = "Mermaid";
    private const string DiagramLayoutDefault = "LR";
    private const string RelationshipLabelsDefault = "type";
    private const string GroupByDefault = "none";

    private readonly IScopeContextProvider _scopeContextProvider =
        scopeContextProvider ?? throw new ArgumentNullException(nameof(scopeContextProvider));

    private readonly IRunRepository _runRepository =
        runRepository ?? throw new ArgumentNullException(nameof(runRepository));

    private readonly IAuthorityQueryService _authorityQueryService =
        authorityQueryService ?? throw new ArgumentNullException(nameof(authorityQueryService));

    private readonly ICompareRunsApplicationFacade _compareRunsFacade =
        compareRunsFacade ?? throw new ArgumentNullException(nameof(compareRunsFacade));

    private readonly ITenantRepository _tenantRepository =
        tenantRepository ?? throw new ArgumentNullException(nameof(tenantRepository));

    private async Task<IActionResult?> RequireTenantAndWorkspaceOrNotFoundAsync(CancellationToken cancellationToken)
    {
        (IActionResult? problem, _) = await TenantWorkspaceScopePreflight.RequireTenantAndWorkspaceAsync(
            this,
            _scopeContextProvider,
            _tenantRepository,
            cancellationToken).ConfigureAwait(false);

        return problem;
    }

    private IActionResult? BadRequestWhenManifestVersionEmpty(string manifestVersion) =>
        BadRequestWhenManifestVersionInvalid(manifestVersion, "manifestVersion");

    private IActionResult? BadRequestWhenManifestVersionInvalid(string manifestVersion, string fieldName)
    {
        if (string.IsNullOrWhiteSpace(manifestVersion))
        {
            return this.BadRequestProblem(
                $"{fieldName} is required.",
                ProblemTypes.ValidationFailed);
        }

        if (manifestVersion.Trim().Length > GovernanceRequestValidationRules.ManifestVersionMaxLength)
        {
            return this.BadRequestProblem(
                $"{fieldName} must not exceed {GovernanceRequestValidationRules.ManifestVersionMaxLength} characters.",
                ProblemTypes.ValidationFailed);
        }

        return null;
    }
}
