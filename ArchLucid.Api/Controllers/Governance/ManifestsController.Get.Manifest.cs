using ArchLucid.Api.Models;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Application;
using ArchLucid.Application.Governance;
using ArchLucid.Application.Runs;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Manifest;
using ArchLucid.Core.Runs;
using ArchLucid.Core.Scoping;

using Microsoft.AspNetCore.Mvc;

namespace ArchLucid.Api.Controllers.Governance;

public sealed partial class ManifestsController
{
    [HttpGet("manifest/{manifestVersion}")]
    [ProducesResponseType(typeof(GoldenManifest), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> GetManifest(
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
            GoldenManifest? manifest = await GetManifestInScopeAsync(manifestVersion, cancellationToken);

            return manifest is null
                ? this.NotFoundProblem($"Manifest '{manifestVersion}' was not found.", ProblemTypes.ManifestNotFound)
                : Ok(manifest);
        }
        catch (ConflictException ex)
        {
            return GoldenManifestReadConflictProblem(ex);
        }
    }

    [HttpGet("manifest/{manifestVersion}/bundle")]
    [ProducesResponseType(typeof(ManifestBundleResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> GetManifestBundle(
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
            string canonicalManifestVersion = manifest.Metadata.ManifestVersion;

            return Ok(new ManifestBundleResponse
            {
                ManifestVersion = canonicalManifestVersion, Manifest = manifest, Diagram = diagram, Summary = summary
            });
        }
        catch (ConflictException ex)
        {
            return GoldenManifestReadConflictProblem(ex);
        }
    }

    private async Task<GoldenManifest?> GetManifestInScopeAsync(
        string manifestVersion,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(manifestVersion))
            return null;

        manifestVersion = manifestVersion.Trim();

        GoldenManifest? manifest =
            await unifiedGoldenManifestReader.GetByVersionAsync(manifestVersion, cancellationToken);

        if (manifest is null)
            return null;

        if (!await IsManifestRunInScopeAsync(manifest, cancellationToken))
            return null;

        ScopeContext scope = _scopeContextProvider.GetCurrentScope();
        await ManifestGoldenReadSealedManifestHashGuard.EnsureGoldenManifestRunSealedHashOrThrowAsync(
            manifest,
            scope,
            _authorityQueryService,
            _manifestHashService,
            cancellationToken).ConfigureAwait(false);

        return manifest;
    }

    private async Task<bool> IsManifestRunInScopeAsync(GoldenManifest manifest, CancellationToken cancellationToken)
    {
        if (!AuthorityRunIdentifier.TryParse(manifest.RunId, out Guid runGuid))
            return false;

        ScopeContext scope = _scopeContextProvider.GetCurrentScope();
        Persistence.Models.RunRecord? run =
            await _runRepository.GetByIdAsync(scope, runGuid, cancellationToken);

        if (run is null)
            return false;

        AuthorityLifecycleCompareExportGuard.EnsureCompleteOrThrow(
            AuthorityRunLifecyclePhaseListResolver.ResolveFromRunHeader(run),
            runGuid.ToString("N"));
        return true;
    }
}
