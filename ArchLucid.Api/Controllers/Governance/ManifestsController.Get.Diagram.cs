using ArchLucid.Api.Http.Governance;
using ArchLucid.Api.Models;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Application.Diagrams;
using ArchLucid.Contracts.Manifest;

using Microsoft.AspNetCore.Mvc;

namespace ArchLucid.Api.Controllers.Governance;

public sealed partial class ManifestsController
{
    [HttpGet("manifest/{manifestVersion}/diagram")]
    [ProducesResponseType(typeof(DiagramResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetManifestDiagram(
        [FromRoute] string manifestVersion,
        CancellationToken cancellationToken)
    {
        IActionResult? manifestVersionProblem = BadRequestWhenManifestVersionEmpty(manifestVersion);

        if (manifestVersionProblem is not null)
            return manifestVersionProblem;

        IActionResult? tenantProblem = await RequireTenantAndWorkspaceOrNotFoundAsync(cancellationToken).ConfigureAwait(false);

        if (tenantProblem is not null)
            return tenantProblem;

        GoldenManifest? manifest = await GetManifestInScopeAsync(manifestVersion, cancellationToken);

        if (manifest is null)
            return this.NotFoundProblem($"Manifest '{manifestVersion}' was not found.", ProblemTypes.ManifestNotFound);

        string mermaid = diagramGenerator.GenerateMermaid(manifest);
        string canonicalManifestVersion = manifest.Metadata.ManifestVersion;

        return Ok(new DiagramResponse
        {
            ManifestVersion = canonicalManifestVersion, Format = FormatMermaid, Diagram = mermaid
        });
    }

    [HttpGet("manifest/{manifestVersion}/diagram/v2")]
    [ProducesResponseType(typeof(ManifestDiagramResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetManifestDiagramV2(
        [FromRoute] string manifestVersion,
        [FromQuery] string? layout = DiagramLayoutDefault,
        [FromQuery] bool includeRuntimePlatform = true,
        [FromQuery] string? relationshipLabels = RelationshipLabelsDefault,
        [FromQuery] string? groupBy = GroupByDefault,
        CancellationToken cancellationToken = default)
    {
        IActionResult? manifestVersionProblem = BadRequestWhenManifestVersionEmpty(manifestVersion);

        if (manifestVersionProblem is not null)
            return manifestVersionProblem;

        IActionResult? layoutProblem =
            ManifestDiagramQueryValidation.ValidateLayout(layout).ToBadRequestProblemOrNull(this);

        if (layoutProblem is not null)
            return layoutProblem;

        IActionResult? relationshipLabelsProblem =
            ManifestDiagramQueryValidation.ValidateRelationshipLabels(relationshipLabels)
                .ToBadRequestProblemOrNull(this);

        if (relationshipLabelsProblem is not null)
            return relationshipLabelsProblem;

        IActionResult? groupByProblem =
            ManifestDiagramQueryValidation.ValidateGroupBy(groupBy).ToBadRequestProblemOrNull(this);

        if (groupByProblem is not null)
            return groupByProblem;

        IActionResult? tenantProblem = await RequireTenantAndWorkspaceOrNotFoundAsync(cancellationToken).ConfigureAwait(false);

        if (tenantProblem is not null)
            return tenantProblem;

        GoldenManifest? manifest = await GetManifestInScopeAsync(manifestVersion, cancellationToken);

        if (manifest is null)
            return this.NotFoundProblem($"Manifest '{manifestVersion}' was not found.", ProblemTypes.ManifestNotFound);

        ManifestDiagramOptions opts = new()
        {
            Layout = layout ?? DiagramLayoutDefault,
            IncludeRuntimePlatform = includeRuntimePlatform,
            RelationshipLabels = relationshipLabels ?? RelationshipLabelsDefault,
            GroupBy = groupBy ?? GroupByDefault
        };

        string mermaid = manifestDiagramService.GenerateMermaid(manifest, opts);
        string canonicalManifestVersion = manifest.Metadata.ManifestVersion;

        return Ok(new ManifestDiagramResponse
        {
            ManifestVersion = canonicalManifestVersion, DiagramType = DiagramTypeMermaid, Content = mermaid
        });
    }
}
