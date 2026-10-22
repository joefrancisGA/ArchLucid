using System.Text.Json;

using ArchLucid.Api.ProblemDetails;
using ArchLucid.Contracts.Common;
using ArchLucid.Core.Audit;
using ArchLucid.Core.CloudInventoryExtractor;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Models;
using ArchLucid.Persistence.Serialization;

using Microsoft.AspNetCore.Mvc;

namespace ArchLucid.Api.Controllers.Authority;

public sealed partial class CloudInventoryExtractorUploadController
{
    /// <summary>Downloads a persisted AWS inventory ZIP package for the current workspace scope.</summary>
    [HttpGet("aws/packages/{packageId:guid}")]
    [Produces("application/zip")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public Task<IActionResult> DownloadAwsPackageAsync(Guid packageId, CancellationToken cancellationToken)
        => DownloadPackageAsync(CloudProvider.Aws, packageId, cancellationToken);

    /// <summary>Downloads a persisted GCP inventory ZIP package for the current workspace scope.</summary>
    [HttpGet("gcp/packages/{packageId:guid}")]
    [Produces("application/zip")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public Task<IActionResult> DownloadGcpPackageAsync(Guid packageId, CancellationToken cancellationToken)
        => DownloadPackageAsync(CloudProvider.Gcp, packageId, cancellationToken);

    private async Task<IActionResult> DownloadPackageAsync(
        CloudProvider cloudProvider,
        Guid packageId,
        CancellationToken cancellationToken)
    {
        ScopeContext scope = scopeContextProvider.GetCurrentScope();

        CloudInventoryExtractorPackageDownloadRecord? package =
            await packageRepository.TryGetDownloadByPackageIdAsync(scope, cloudProvider, packageId, cancellationToken);

        if (package is null)
        {
            return this.NotFoundProblem(
                $"{cloudProvider} inventory package '{packageId}' was not found in the current scope.",
                ProblemTypes.ResourceNotFound);
        }

        string auditActor = actorContext.GetActor();

        await auditService.LogAsync(
            new AuditEvent
            {
                EventType = AuditEventTypes.CloudInventoryExtractorPackageDownloaded,
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
                        cloudProvider = cloudProvider.ToString(),
                        packageId = package.PackageId,
                        runId = package.RunId,
                        originalFileName = package.OriginalFileName,
                        sizeBytes = package.PackageBytes.LongLength,
                    },
                    AuditJsonSerializationOptions.Instance),
            },
            cancellationToken);

        string defaultName = cloudProvider == CloudProvider.Aws
            ? "aws-inventory-package.zip"
            : "gcp-inventory-package.zip";

        string fileName = string.IsNullOrWhiteSpace(package.OriginalFileName)
            ? defaultName
            : package.OriginalFileName.Trim();

        return File(package.PackageBytes, "application/zip", fileName);
    }
}
