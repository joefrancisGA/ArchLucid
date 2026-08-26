using ArchLucid.Application.CloudInventoryExtractor;
using ArchLucid.Application.Common;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Data.Repositories;

using Asp.Versioning;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace ArchLucid.Api.Controllers.Authority;

/// <summary>Multipart ingest of customer-run AWS/GCP inventory ZIP packages (schema-validated).</summary>
[ApiController]
[Authorize(Policy = ArchLucidPolicies.ReadAuthority)]
[ApiVersion("1.0")]
[Route("v{version:apiVersion}/extractor")]
[EnableRateLimiting("fixed")]
[ProducesResponseType(StatusCodes.Status401Unauthorized)]
[ProducesResponseType(StatusCodes.Status403Forbidden)]
public sealed partial class CloudInventoryExtractorUploadController(
    ICloudInventoryExtractorIngestService ingestService,
    CloudInventoryExtractorChunkedUploadService chunkedUpload,
    ICloudInventoryExtractorPackageRepository packageRepository,
    IActorContext actorContext,
    IScopeContextProvider scopeContextProvider,
    IAuditService auditService,
    ILogger<CloudInventoryExtractorUploadController> logger) : ControllerBase;
