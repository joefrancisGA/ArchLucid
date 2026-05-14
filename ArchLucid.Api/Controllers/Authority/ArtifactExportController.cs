using System.Text.Json;

using ArchLucid.Api.Attributes;
using ArchLucid.Api.Contracts;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Application.Analysis;
using ArchLucid.ArtifactSynthesis.Models;
using ArchLucid.ArtifactSynthesis.Packaging;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.Diagrams;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;
using ArchLucid.Decisioning.Models;
using ArchLucid.Persistence.Queries;

using Asp.Versioning;

using Microsoft.Extensions.Configuration;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.Extensions.DependencyInjection;

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
public sealed class ArtifactExportController(
    IArtifactQueryService artifactQueryService,
    IAuthorityQueryService authorityQueryService,
    IArtifactPackagingService artifactPackagingService,
    IScopeContextProvider scopeProvider,
    IAuditService auditService,
    IDiagramImageRenderer diagramImageRenderer,
    IConfiguration configuration,
    ITerraformGitHubPrService terraformGitHubPrService,
    IServiceScopeFactory serviceScopeFactory)
    : ControllerBase
{
    private static readonly JsonSerializerOptions ExportJsonOptions = new()
    {
        WriteIndented = true, PropertyNamingPolicy = JsonNamingPolicy.CamelCase
    };

    /// <summary>
    ///     Lists artifact descriptors for a golden manifest. Returns <c>200 OK</c> with a JSON array (possibly empty)
    ///     sorted by name then id; <c>404</c> when the manifest is missing in the current scope.
    /// </summary>
    [HttpGet("manifests/{manifestId:guid}")]
    [ProducesResponseType(typeof(IReadOnlyList<ArtifactDescriptorResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(Microsoft.AspNetCore.Mvc.ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> ListArtifacts(
        Guid manifestId,
        CancellationToken ct = default)
    {
        ScopeContext scope = scopeProvider.GetCurrentScope();
        if (await authorityQueryService.GetManifestSummaryAsync(scope, manifestId, ct) is null)
            return this.NotFoundProblem(
                $"Manifest '{manifestId}' was not found in the current scope.",
                ProblemTypes.ManifestNotFound);

        IReadOnlyList<ArtifactDescriptor> artifacts =
            await artifactQueryService.ListArtifactsByManifestIdAsync(scope, manifestId, ct);

        return Ok(artifacts.Select(a => ArtifactDescriptorResponse.From(a, manifestId)).ToList());
    }

    /// <summary>Product route: artifact descriptors for the run's golden manifest.</summary>
    [HttpGet("/v{version:apiVersion}/runs/{runId:guid}/artifacts")]
    [ProducesResponseType(typeof(IReadOnlyList<ArtifactDescriptorResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(Microsoft.AspNetCore.Mvc.ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> ListArtifactsForRun(Guid runId, CancellationToken ct = default)
    {
        ScopeContext scope = scopeProvider.GetCurrentScope();
        RunDetailDto? detail = await authorityQueryService.GetRunDetailAsync(scope, runId, ct);
        if (detail is null)
            return this.NotFoundProblem($"Run '{runId}' was not found.", ProblemTypes.RunNotFound);

        if (detail.Run.GoldenManifestId is null)
            return this.NotFoundProblem(
                $"Run '{runId}' has no golden manifest in the current scope.",
                ProblemTypes.ManifestNotFound);

        return await ListArtifacts(detail.Run.GoldenManifestId.Value, ct);
    }

    /// <summary>Product route: bundle ZIP for the run's golden manifest.</summary>
    [HttpGet("/v{version:apiVersion}/runs/{runId:guid}/artifacts/bundle")]
    [Produces("application/zip")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(Microsoft.AspNetCore.Mvc.ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> DownloadBundleForRun(Guid runId, CancellationToken ct = default)
    {
        ScopeContext scope = scopeProvider.GetCurrentScope();
        RunDetailDto? detail = await authorityQueryService.GetRunDetailAsync(scope, runId, ct);
        if (detail is null)
            return this.NotFoundProblem($"Run '{runId}' was not found.", ProblemTypes.RunNotFound);

        if (detail.Run.GoldenManifestId is null)
            return this.NotFoundProblem(
                $"Run '{runId}' has no golden manifest in the current scope.",
                ProblemTypes.ManifestNotFound);

        return await DownloadBundle(detail.Run.GoldenManifestId.Value, ct);
    }

    /// <summary>Product route: download one artifact file for the run's golden manifest.</summary>
    [HttpGet("/v{version:apiVersion}/runs/{runId:guid}/artifacts/{artifactId:guid}")]
    [Produces("application/octet-stream")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(Microsoft.AspNetCore.Mvc.ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> DownloadArtifactForRun(Guid runId, Guid artifactId, CancellationToken ct = default)
    {
        ScopeContext scope = scopeProvider.GetCurrentScope();
        RunDetailDto? detail = await authorityQueryService.GetRunDetailAsync(scope, runId, ct);
        if (detail is null)
            return this.NotFoundProblem($"Run '{runId}' was not found.", ProblemTypes.RunNotFound);

        if (detail.Run.GoldenManifestId is null)
            return this.NotFoundProblem(
                $"Run '{runId}' has no golden manifest in the current scope.",
                ProblemTypes.ManifestNotFound);

        return await DownloadArtifact(detail.Run.GoldenManifestId.Value, artifactId, ct);
    }

    /// <summary>
    ///     JSON metadata for one artifact (operator review). <c>404</c> if the manifest is out of scope or the artifact id is
    ///     not in that manifest�s bundle.
    /// </summary>
    [HttpGet("manifests/{manifestId:guid}/artifact/{artifactId:guid}/descriptor")]
    [ProducesResponseType(typeof(ArtifactDescriptorResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(Microsoft.AspNetCore.Mvc.ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> GetArtifactDescriptor(
        Guid manifestId,
        Guid artifactId,
        CancellationToken ct = default)
    {
        ScopeContext scope = scopeProvider.GetCurrentScope();
        if (await authorityQueryService.GetManifestSummaryAsync(scope, manifestId, ct) is null)
            return this.NotFoundProblem(
                $"Manifest '{manifestId}' was not found in the current scope.",
                ProblemTypes.ManifestNotFound);

        SynthesizedArtifact? artifact =
            await artifactQueryService.GetArtifactByIdAsync(scope, manifestId, artifactId, ct);
        if (artifact is null)
            return this.NotFoundProblem(
                $"Artifact '{artifactId}' was not found for manifest '{manifestId}'.",
                ProblemTypes.ResourceNotFound);

        return Ok(ArtifactDescriptorResponse.From(artifact));
    }

    /// <summary>
    ///     Downloads one synthesized artifact file. Requires manifest in scope; same 404 semantics as the descriptor
    ///     endpoint.
    /// </summary>
    [HttpGet("manifests/{manifestId:guid}/artifact/{artifactId:guid}")]
    [Produces("application/octet-stream")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(Microsoft.AspNetCore.Mvc.ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> DownloadArtifact(
        Guid manifestId,
        Guid artifactId,
        CancellationToken ct = default)
    {
        ScopeContext scope = scopeProvider.GetCurrentScope();
        if (await authorityQueryService.GetManifestSummaryAsync(scope, manifestId, ct) is null)
            return this.NotFoundProblem(
                $"Manifest '{manifestId}' was not found in the current scope.",
                ProblemTypes.ManifestNotFound);

        SynthesizedArtifact? artifact =
            await artifactQueryService.GetArtifactByIdAsync(scope, manifestId, artifactId, ct);
        if (artifact is null)
            return this.NotFoundProblem($"Artifact '{artifactId}' was not found for manifest '{manifestId}'.",
                ProblemTypes.ResourceNotFound);

        ArtifactFileExport file = artifactPackagingService.BuildSingleFileExport(artifact);

        await auditService.LogAsync(
            new AuditEvent
            {
                EventType = AuditEventTypes.ArtifactDownloaded, ManifestId = manifestId, ArtifactId = artifactId
            },
            ct);

        return File(file.Content, file.ContentType, file.FileName);
    }

    /// <summary>
    ///     ZIP of all artifacts for the manifest (stable entry order: name then id). <c>404</c> with manifest-not-found when
    ///     the manifest is missing; <c>404</c> with resource-not-found when the manifest exists but has no bundle or zero
    ///     artifacts.
    /// </summary>
    [HttpGet("manifests/{manifestId:guid}/bundle")]
    [Produces("application/zip")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(Microsoft.AspNetCore.Mvc.ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> DownloadBundle(
        Guid manifestId,
        CancellationToken ct = default)
    {
        ScopeContext scope = scopeProvider.GetCurrentScope();
        if (await authorityQueryService.GetManifestSummaryAsync(scope, manifestId, ct) is null)
            return this.NotFoundProblem(
                $"Manifest '{manifestId}' was not found in the current scope.",
                ProblemTypes.ManifestNotFound);

        IReadOnlyList<SynthesizedArtifact> artifacts =
            await artifactQueryService.GetArtifactsByManifestIdAsync(scope, manifestId, ct);
        if (artifacts.Count == 0)
            return this.NotFoundProblem(
                $"Manifest '{manifestId}' has no artifact bundle or the bundle contains no artifacts. " +
                $"The list endpoint GET api/artifacts/manifests/{manifestId} returns an empty JSON array when there are no artifact rows.",
                ProblemTypes.ResourceNotFound);

        ArtifactPackage package = artifactPackagingService.BuildBundlePackage(manifestId, artifacts);

        await auditService.LogAsync(
            new AuditEvent { EventType = AuditEventTypes.BundleDownloaded, ManifestId = manifestId },
            ct);

        return File(package.Content, package.ContentType, package.PackageFileName);
    }

    /// <summary>
    ///     ZIP export of run manifest, trace, and artifacts when the run is committed; artifacts ordered like the
    ///     manifest bundle list.
    /// </summary>
    [HttpGet("runs/{runId:guid}/export")]
    [Produces("application/zip")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(Microsoft.AspNetCore.Mvc.ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> DownloadRunExport(
        Guid runId,
        CancellationToken ct = default)
    {
        ScopeContext scope = scopeProvider.GetCurrentScope();
        RunDetailDto? runDetail = await authorityQueryService.GetRunDetailAsync(scope, runId, ct);
        if (runDetail is null)
            return this.NotFoundProblem($"Run '{runId}' was not found.", ProblemTypes.RunNotFound);
        if (runDetail.GoldenManifest is null)
            return this.NotFoundProblem($"Run '{runId}' has no committed golden manifest available for export.",
                ProblemTypes.ManifestNotFound);

        IReadOnlyList<SynthesizedArtifact> artifacts = await artifactQueryService.GetArtifactsByManifestIdAsync(
            scope,
            runDetail.GoldenManifest.ManifestId,
            ct);

        string manifestJson = JsonSerializer.Serialize(runDetail.GoldenManifest, ExportJsonOptions);

        string? traceJson = runDetail.AuthorityTrace is null
            ? null
            : JsonSerializer.Serialize(runDetail.AuthorityTrace, ExportJsonOptions);

        byte[]? renderedPng = null;

        if (configuration.GetValue("ArchLucid:MermaidCli:Enabled", false))
        {
            string? mermaid = MermaidDiagramArtifactExtractor.TryGetDiagramSource(artifacts);

            if (!string.IsNullOrWhiteSpace(mermaid))
                renderedPng = await diagramImageRenderer.RenderMermaidPngAsync(mermaid, ct);
        }

        ManifestDocument golden = runDetail.GoldenManifest;
        string ruleSetLine = $"{golden.RuleSetId} {golden.RuleSetVersion}".Trim();
        RunExportReadmeContext readmeContext = new()
        {
            ManifestDisplayName = string.IsNullOrWhiteSpace(golden.Metadata.Name) ? null : golden.Metadata.Name,
            ManifestHash = string.IsNullOrWhiteSpace(golden.ManifestHash) ? null : golden.ManifestHash,
            RuleSetLabel = string.IsNullOrWhiteSpace(ruleSetLine) ? null : ruleSetLine,
            OperatorShellReviewRelativePath = $"/reviews/{runId:D}",
        };

        ArtifactPackage package = artifactPackagingService.BuildRunExportPackage(
            runId,
            golden.ManifestId,
            artifacts,
            manifestJson,
            traceJson,
            readmeContext,
            renderedArchitectureDiagramPng: renderedPng);

        await auditService.LogAsync(
            new AuditEvent
            {
                EventType = AuditEventTypes.RunExported,
                RunId = runId,
                ManifestId = runDetail.GoldenManifest.ManifestId
            },
            ct);

        return File(package.Content, package.ContentType, package.PackageFileName);
    }

    /// <summary>
    ///     Advisory Terraform ZIP for a run (placeholder README + stub file; CLI aztfexport wrapping is documented in README).
    /// </summary>
    [HttpGet("runs/{runId:guid}/terraform-advisory-export")]
    [Produces("application/zip")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(Microsoft.AspNetCore.Mvc.ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> DownloadTerraformAdvisoryExport(
        Guid runId,
        CancellationToken ct = default)
    {
        ScopeContext scope = scopeProvider.GetCurrentScope();
        RunDetailDto? runDetail = await authorityQueryService.GetRunDetailAsync(scope, runId, ct);
        if (runDetail is null)
            return this.NotFoundProblem($"Run '{runId}' was not found.", ProblemTypes.RunNotFound);

        ArtifactPackage package = artifactPackagingService.BuildTerraformAdvisoryPlaceholderExport(runId);

        await auditService.LogAsync(
            new AuditEvent { EventType = AuditEventTypes.TerraformAdvisoryExportDownloaded, RunId = runId },
            ct);

        return File(package.Content, package.ContentType, package.PackageFileName);
    }

    /// <summary>
    ///     Asynchronously pushes the run export ZIP to a customer-provided Azure Blob SAS URL.
    ///     Returns 202 Accepted immediately; the upload proceeds in the background.
    ///     Durable <c>RunExportBlobPushQueued</c> fires at accept; completion audits are
    ///     <c>RunExportBlobPushSucceeded</c> / <c>RunExportBlobPushFailed</c>.
    /// </summary>
    [HttpPost("runs/{runId:guid}/export/push")]
    [Authorize(Policy = ArchLucidPolicies.ExecuteAuthority)]
    [ProducesResponseType(StatusCodes.Status202Accepted)]
    [ProducesResponseType(typeof(Microsoft.AspNetCore.Mvc.ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(Microsoft.AspNetCore.Mvc.ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> PushRunExportToBlob(
        Guid runId,
        [FromBody] RunExportBlobPushRequest? request,
        CancellationToken ct = default)
    {
        if (request is null || string.IsNullOrWhiteSpace(request.DestinationSasUrl))
            return this.BadRequestProblem("DestinationSasUrl is required.", ProblemTypes.RequestBodyRequired);

        if (!Uri.TryCreate(request.DestinationSasUrl, UriKind.Absolute, out _))
            return this.BadRequestProblem("DestinationSasUrl is not a valid absolute URI.", ProblemTypes.ValidationFailed);

        ScopeContext scope = scopeProvider.GetCurrentScope();
        RunDetailDto? runDetail = await authorityQueryService.GetRunDetailAsync(scope, runId, ct);

        if (runDetail is null)
            return this.NotFoundProblem($"Run '{runId}' was not found.", ProblemTypes.RunNotFound);

        if (runDetail.GoldenManifest is null)
            return this.NotFoundProblem(
                $"Run '{runId}' has no committed golden manifest available for export.",
                ProblemTypes.ManifestNotFound);

        IReadOnlyList<SynthesizedArtifact> artifacts =
            await artifactQueryService.GetArtifactsByManifestIdAsync(scope, runDetail.GoldenManifest.ManifestId, ct);

        string manifestJson = JsonSerializer.Serialize(runDetail.GoldenManifest, ExportJsonOptions);
        string? traceJson = runDetail.AuthorityTrace is null
            ? null
            : JsonSerializer.Serialize(runDetail.AuthorityTrace, ExportJsonOptions);

        ManifestDocument golden = runDetail.GoldenManifest;
        string ruleSetLine = $"{golden.RuleSetId} {golden.RuleSetVersion}".Trim();
        RunExportReadmeContext readmeContext = new()
        {
            ManifestDisplayName = string.IsNullOrWhiteSpace(golden.Metadata.Name) ? null : golden.Metadata.Name,
            ManifestHash = string.IsNullOrWhiteSpace(golden.ManifestHash) ? null : golden.ManifestHash,
            RuleSetLabel = string.IsNullOrWhiteSpace(ruleSetLine) ? null : ruleSetLine,
            OperatorShellReviewRelativePath = $"/reviews/{runId:D}"
        };

        ArtifactPackage package = artifactPackagingService.BuildRunExportPackage(
            runId,
            golden.ManifestId,
            artifacts,
            manifestJson,
            traceJson,
            readmeContext,
            renderedArchitectureDiagramPng: null);

        byte[] zipContent = package.Content;
        string sasUrl = request.DestinationSasUrl;

        await auditService.LogAsync(
            new AuditEvent
            {
                EventType = AuditEventTypes.RunExportBlobPushQueued,
                RunId = runId,
                DataJson = JsonSerializer.Serialize(new { bytes = zipContent.Length })
            },
            ct);

        // Fire-and-forget: upload completes in the background while the API returns 202 immediately.
        _ = Task.Run(async () =>
        {
            using IServiceScope backgroundScope = serviceScopeFactory.CreateScope();
            IRunExportBlobPushService pushService =
                backgroundScope.ServiceProvider.GetRequiredService<IRunExportBlobPushService>();

            try
            {
                await pushService.PushAsync(runId, zipContent, sasUrl).ConfigureAwait(false);
            }
            catch
            {
                // Exceptions are logged inside PushAsync; swallow here to avoid unobserved task faults.
            }
        }, CancellationToken.None);

        return Accepted();
    }

    /// <summary>
    ///     Creates an advisory Terraform GitHub Pull Request for the given run.
    ///     Generates the Terraform placeholder ZIP then pushes the files to GitHub and opens a PR on the
    ///     configured repository. Returns <c>201 Created</c> with the PR URL on success.
    ///     Requires <c>TerraformGitHubPr:Enabled=true</c> and valid GitHub credentials in configuration.
    /// </summary>
    [HttpPost("runs/{runId:guid}/terraform-pr")]
    [Authorize(Policy = ArchLucidPolicies.ExecuteAuthority)]
    [ProducesResponseType(typeof(TerraformPrCreatedResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(Microsoft.AspNetCore.Mvc.ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(Microsoft.AspNetCore.Mvc.ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> CreateTerraformPr(
        Guid runId,
        CancellationToken ct = default)
    {
        ScopeContext scope = scopeProvider.GetCurrentScope();
        RunDetailDto? runDetail = await authorityQueryService.GetRunDetailAsync(scope, runId, ct);

        if (runDetail is null)
            return this.NotFoundProblem($"Run '{runId}' was not found.", ProblemTypes.RunNotFound);

        ArtifactPackage package = artifactPackagingService.BuildTerraformAdvisoryPlaceholderExport(runId);

        try
        {
            TerraformPrCreationResult result = await terraformGitHubPrService
                .CreatePrAsync(runId, package.Content, ct)
                .ConfigureAwait(false);

            await auditService.LogAsync(
                new AuditEvent
                {
                    EventType = AuditEventTypes.TerraformAdvisoryExportDownloaded,
                    RunId = runId,
                    DataJson = System.Text.Json.JsonSerializer.Serialize(new
                    {
                        source = "github_pr",
                        prUrl = result.PullRequestUrl,
                        branch = result.BranchName
                    })
                }, ct);

            return CreatedAtAction(
                nameof(DownloadTerraformAdvisoryExport),
                new { runId },
                new TerraformPrCreatedResponse
                {
                    PullRequestUrl = result.PullRequestUrl,
                    PullRequestNumber = result.PullRequestNumber,
                    BranchName = result.BranchName
                });
        }
        catch (InvalidOperationException ex)
        {
            return this.BadRequestProblem(ex.Message, ProblemTypes.BadRequest);
        }
    }
}
