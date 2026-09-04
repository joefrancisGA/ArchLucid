using ArchLucid.Api.Models;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Application;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Manifest;

using Microsoft.AspNetCore.Mvc;

namespace ArchLucid.Api.Controllers.Governance;

public sealed partial class ManifestsController
{
    [HttpGet("manifest/{manifestVersion}/export")]
    [ProducesResponseType(typeof(ManifestExportContentResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> GetManifestExport(
        [FromRoute] string manifestVersion,
        CancellationToken cancellationToken)
    {
        IActionResult? manifestVersionProblem = BadRequestWhenManifestVersionEmpty(manifestVersion);

        if (manifestVersionProblem is not null)
            return manifestVersionProblem;

        IActionResult? tenantProblem = await RequireTenantAndWorkspaceOrNotFoundAsync(cancellationToken).ConfigureAwait(false);

        if (tenantProblem is not null)
            return tenantProblem;

        try
        {
            (GoldenManifest? manifest, AgentEvidencePackage? evidence) =
                await LoadManifestWithEvidenceAsync(manifestVersion, cancellationToken);

            if (manifest is null)
                return this.NotFoundProblem($"Manifest '{manifestVersion}' was not found.", ProblemTypes.ManifestNotFound);

            string diagram = diagramGenerator.GenerateMermaid(manifest);
            string summary = summaryGenerator.GenerateMarkdown(manifest, evidence);
            string markdown = exportService.GenerateMarkdownPackage(manifest, diagram, summary, evidence);
            string canonicalManifestVersion = manifest.Metadata.ManifestVersion;

            return Ok(new ManifestExportContentResponse
            {
                ManifestVersion = canonicalManifestVersion, Format = FormatMarkdown, Content = markdown
            });
        }
        catch (ConflictException ex)
        {
            return GoldenManifestReadConflictProblem(ex);
        }
    }

    [HttpGet("manifest/{manifestVersion}/export/download")]
    [ProducesResponseType(typeof(FileContentResult), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> DownloadManifestExport(
        [FromRoute] string manifestVersion,
        CancellationToken cancellationToken)
    {
        IActionResult? manifestVersionProblem = BadRequestWhenManifestVersionEmpty(manifestVersion);

        if (manifestVersionProblem is not null)
            return manifestVersionProblem;

        IActionResult? tenantProblem = await RequireTenantAndWorkspaceOrNotFoundAsync(cancellationToken).ConfigureAwait(false);

        if (tenantProblem is not null)
            return tenantProblem;

        try
        {
            (GoldenManifest? manifest, AgentEvidencePackage? evidence) =
                await LoadManifestWithEvidenceAsync(manifestVersion, cancellationToken);

            if (manifest is null)
                return this.NotFoundProblem($"Manifest '{manifestVersion}' was not found.", ProblemTypes.ManifestNotFound);

            string diagram = diagramGenerator.GenerateMermaid(manifest);
            string summary = summaryGenerator.GenerateMarkdown(manifest, evidence);
            string markdown = exportService.GenerateMarkdownPackage(manifest, diagram, summary, evidence);
            string canonicalManifestVersion = manifest.Metadata.ManifestVersion;
            string fileName = $"architecture-export-{canonicalManifestVersion}.md";

            return ApiFileResults.RangeText(Request, markdown, "text/markdown", fileName);
        }
        catch (ConflictException ex)
        {
            return GoldenManifestReadConflictProblem(ex);
        }
    }

    /// <summary>
    ///     Loads a manifest by version together with its associated evidence package.
    ///     Returns <c>(null, null)</c> when the manifest does not exist.
    /// </summary>
    private async Task<(GoldenManifest? Manifest, AgentEvidencePackage? Evidence)> LoadManifestWithEvidenceAsync(
        string manifestVersion,
        CancellationToken cancellationToken)
    {
        GoldenManifest? manifest = await GetManifestInScopeAsync(manifestVersion, cancellationToken);

        if (manifest is null)
            return (null, null);

        AgentEvidencePackage? evidence =
            await agentEvidencePackageRepository.GetByRunIdAsync(manifest.RunId, cancellationToken);
        return (manifest, evidence);
    }
}
