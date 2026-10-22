using ArchLucid.Api.ProblemDetails;
using ArchLucid.Application.AzureExtractor;
using ArchLucid.Application.Common;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.AzureExtractor;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Data.Repositories;

using static ArchLucid.Application.AzureExtractor.AzureExtractorUploadLimits;

using Asp.Versioning;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace ArchLucid.Api.Controllers.Authority;

/// <summary>Multipart ingest of customer-run Azure extractor ZIP packages (schema-validated).</summary>
[ApiController]
[Authorize(Policy = ArchLucidPolicies.ReadAuthority)]
[ApiVersion("1.0")]
[Route("v{version:apiVersion}/azure-extractor")]
[EnableRateLimiting("fixed")]
[ProducesResponseType(StatusCodes.Status401Unauthorized)]
[ProducesResponseType(StatusCodes.Status403Forbidden)]
public sealed partial class AzureExtractorUploadController(
    IAzureExtractorIngestService ingestService,
    AzureExtractorChunkedUploadService chunkedUpload,
    IAzureExtractorPackageRepository packageRepository,
    IActorContext actorContext,
    IScopeContextProvider scopeContextProvider,
    IAuditService auditService,
    ILogger<AzureExtractorUploadController> logger) : ControllerBase
{
    private IActionResult MapIngestFailure(AzureExtractorIngestResult result)
    {
        string detail = result.FailureDetail ?? "Ingest failed.";

        if (logger.IsEnabled(LogLevel.Information))

            logger.LogInformation("Azure extractor ingest rejected: {Detail}", detail);

        if (result.IsInvalidArchive || result.IsSchemaRejection)
        {
            string failureKind = result.IsSchemaRejection ? "schema" : "archive";
            Dictionary<string, object?> extensions = new()
            {
                ["failureKind"] = failureKind,
                ["errors"] = new[] { detail },
            };

            if (result.IsSchemaRejection)
                extensions["requiredSchemaVersion"] = AzureExtractorPackageZipValidator.SupportedSchemaVersion;

            return this.BadRequestProblem(
                detail,
                ProblemTypes.ValidationFailed,
                extensions: extensions);
        }

        return this.UnprocessableEntityProblem(
            detail,
            extensions: new Dictionary<string, object?>
            {
                ["failureKind"] = "validation",
                ["errors"] = new[] { detail },
            });
    }
}
