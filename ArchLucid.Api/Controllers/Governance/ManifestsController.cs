using ArchLucid.Api.Attributes;
using ArchLucid.Application.Diagrams;
using ArchLucid.Application.Diffs;
using ArchLucid.Application.Exports;
using ArchLucid.Application.Runs;
using ArchLucid.Application.Summaries;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.Persistence.Ports;
using ArchLucid.Core.Scoping;
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
    IRunRepository runRepository)
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
}
