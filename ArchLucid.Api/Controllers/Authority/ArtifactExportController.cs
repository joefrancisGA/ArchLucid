using ArchLucid.Api.Attributes;
using ArchLucid.Application.Analysis;
using ArchLucid.Application.Exports;
using ArchLucid.Application.InfraEvidence.Branding;
using ArchLucid.ArtifactSynthesis.Packaging;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.Diagrams;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Persistence.Coordination.Export;
using ArchLucid.Persistence.Queries;

using Asp.Versioning;

using Microsoft.Extensions.Configuration;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace ArchLucid.Api.Controllers.Authority;

/// <summary>
///     HTTP API for listing, downloading, and packaging synthesized artifacts produced for a golden manifest.
/// </summary>
/// <remarks>
///     Routes are prefixed <c>api/artifacts</c> and require the <see cref="ArchLucidPolicies.ReadAuthority" /> policy.
///     Artifact descriptors are resolved from the artifact query service; packaging (ZIP export) is performed
///     by <see cref="IArtifactPackagingService" />. All download operations emit an <c>ArtifactExported</c> audit event.
/// </remarks>
[ApiController]
[Authorize(Policy = ArchLucidPolicies.ReadAuthority)]
[ApiVersion("1.0")]
[Route("v{version:apiVersion}/artifacts")]
[EnableRateLimiting("fixed")]
[RequiresCommercialTenantTier(TenantTier.Standard)]
public sealed partial class ArtifactExportController(
    IArtifactQueryService artifactQueryService,
    IAuthorityQueryService authorityQueryService,
    IArtifactPackagingService artifactPackagingService,
    IScopeContextProvider scopeProvider,
    IAuditService auditService,
    IDiagramImageRenderer diagramImageRenderer,
    IConfiguration configuration,
    ITerraformGitHubPrService terraformGitHubPrService,
    IRunExportPackageBuilder runExportPackageBuilder,
    IRunExportBlobPushOutboxRepository runExportBlobPushOutbox,
    IRunExportLineageVerifier runExportLineageVerifier,
    IDecisionReceiptService decisionReceiptService,
    IManifestHashService manifestHashService,
    IBrandedDiagramExportService brandedDiagramExportService)
    : ControllerBase
{
}
