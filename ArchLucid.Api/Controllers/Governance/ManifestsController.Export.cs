using ArchLucid.Application.Runs;
using ArchLucid.Api.Models;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Manifest;
using ArchLucid.Core.Scoping;

using Microsoft.AspNetCore.Mvc;

namespace ArchLucid.Api.Controllers.Governance;

public sealed partial class ManifestsController
{
    [HttpGet("manifest/{manifestVersion}/export")]
    [ProducesResponseType(typeof(ManifestExportContentResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetManifestExport(
        [FromRoute] string manifestVersion,
        CancellationToken cancellationToken)
    {
        IActionResult? tenantProblem = await RequireTenantOrNotFoundAsync(cancellationToken).ConfigureAwait(false);

        if (tenantProblem is not null)
            return tenantProblem;

        (GoldenManifest? manifest, AgentEvidencePackage? evidence) =
            await LoadManifestWithEvidenceAsync(manifestVersion, cancellationToken);
        if (manifest is null)
            return this.NotFoundProblem($"Manifest '{manifestVersion}' was not found.", ProblemTypes.ManifestNotFound);

        string diagram = diagramGenerator.GenerateMermaid(manifest);
        string summary = summaryGenerator.GenerateMarkdown(manifest, evidence);
        string markdown = exportService.GenerateMarkdownPackage(manifest, diagram, summary, evidence);

        return Ok(new ManifestExportContentResponse
        {
            ManifestVersion = manifestVersion, Format = FormatMarkdown, Content = markdown
        });
    }

    [HttpGet("manifest/{manifestVersion}/export/download")]
    [ProducesResponseType(typeof(FileContentResult), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DownloadManifestExport(
        [FromRoute] string manifestVersion,
        CancellationToken cancellationToken)
    {
        IActionResult? tenantProblem = await RequireTenantOrNotFoundAsync(cancellationToken).ConfigureAwait(false);

        if (tenantProblem is not null)
            return tenantProblem;

        (GoldenManifest? manifest, AgentEvidencePackage? evidence) =
            await LoadManifestWithEvidenceAsync(manifestVersion, cancellationToken);
        if (manifest is null)
            return this.NotFoundProblem($"Manifest '{manifestVersion}' was not found.", ProblemTypes.ManifestNotFound);

        string diagram = diagramGenerator.GenerateMermaid(manifest);
        string summary = summaryGenerator.GenerateMarkdown(manifest, evidence);
        string markdown = exportService.GenerateMarkdownPackage(manifest, diagram, summary, evidence);

        string fileName = $"architecture-export-{manifestVersion}.md";
        return ApiFileResults.RangeText(Request, markdown, "text/markdown", fileName);
    }

    /// <summary>
    ///     Loads a manifest by version together with its associated evidence package.
    ///     Returns <c>(null, null)</c> when the manifest does not exist.
    /// </summary>
    private async Task<(GoldenManifest? Manifest, AgentEvidencePackage? Evidence)> LoadManifestWithEvidenceAsync(
        string manifestVersion,
        CancellationToken cancellationToken)
    {
        GoldenManifest? manifest =
            await unifiedGoldenManifestReader.GetByVersionAsync(manifestVersion, cancellationToken);
        if (manifest is null)
            return (null, null);

        if (!await IsManifestRunInScopeAsync(manifest, cancellationToken))
            return (null, null);

        AgentEvidencePackage? evidence =
            await agentEvidencePackageRepository.GetByRunIdAsync(manifest.RunId, cancellationToken);
        return (manifest, evidence);
    }

    private async Task<bool> IsManifestRunInScopeAsync(GoldenManifest manifest, CancellationToken cancellationToken)
    {
        if (!AuthorityRunIdentifier.TryParse(manifest.RunId, out Guid runGuid))
            return false;

        ScopeContext scope = _scopeContextProvider.GetCurrentScope();
        Persistence.Models.RunRecord? run =
            await _runRepository.GetByIdAsync(scope, runGuid, cancellationToken);

        return run is not null;
    }
}
