using System.Text.Json;

using ArchLucid.Api.ProblemDetails;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Models;
using ArchLucid.Persistence.Serialization;

using Microsoft.AspNetCore.Mvc;

namespace ArchLucid.Api.Controllers.Authority;

public sealed partial class AzureExtractorUploadController
{
    /// <summary>Downloads a persisted Azure extractor ZIP package for the current workspace scope.</summary>
    [HttpGet("packages/{packageId:guid}")]
    [Produces("application/zip")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DownloadPackageAsync(Guid packageId, CancellationToken cancellationToken)
    {
        ScopeContext scope = scopeContextProvider.GetCurrentScope();

        AzureExtractorPackageDownloadRecord? package =
            await packageRepository.TryGetDownloadByPackageIdAsync(scope, packageId, cancellationToken);

        if (package is null)
            return this.NotFoundProblem(
                $"Azure extractor package '{packageId}' was not found in the current scope.",
                ProblemTypes.ResourceNotFound);

        string auditActor = actorContext.GetActor();

        await auditService.LogAsync(
            new AuditEvent
            {
                EventType = AuditEventTypes.AzureExtractorPackageDownloaded,
                ActorUserId = auditActor,
                ActorUserName = auditActor,
                TenantId = scope.TenantId,
                WorkspaceId = scope.WorkspaceId,
                ProjectId = scope.ProjectId,
                RunId = package.RunId,
                CorrelationId = HttpContext.TraceIdentifier,
                DataJson = JsonSerializer.Serialize(
                    new
                    {
                        packageId = package.PackageId,
                        runId = package.RunId,
                        originalFileName = package.OriginalFileName,
                        sizeBytes = package.PackageBytes.LongLength,
                    },
                    AuditJsonSerializationOptions.Instance),
            },
            cancellationToken);

        string fileName = string.IsNullOrWhiteSpace(package.OriginalFileName)
            ? "azure-extractor-package.zip"
            : package.OriginalFileName.Trim();

        return File(package.PackageBytes, "application/zip", fileName);
    }
}
