using ArchLucid.Api.Models;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Application.Diagrams;
using ArchLucid.Application.Summaries;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Manifest;
using ArchLucid.Core.Scoping;

using Microsoft.AspNetCore.Mvc;

namespace ArchLucid.Api.Controllers.Governance;

public sealed partial class ManifestsController
{
    [HttpGet("manifest/{manifestVersion}")]
    [ProducesResponseType(typeof(GoldenManifest), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetManifest(
        [FromRoute] string manifestVersion,
        CancellationToken cancellationToken)
    {
        IActionResult? tenantProblem = await RequireTenantOrNotFoundAsync(cancellationToken).ConfigureAwait(false);

        if (tenantProblem is not null)
            return tenantProblem;

        GoldenManifest? manifest = await GetManifestInScopeAsync(manifestVersion, cancellationToken);
        return manifest is null
            ? this.NotFoundProblem($"Manifest '{manifestVersion}' was not found.", ProblemTypes.ManifestNotFound)
            : Ok(manifest);
    }

    [HttpGet("manifest/{manifestVersion}/diagram")]
    [ProducesResponseType(typeof(DiagramResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetManifestDiagram(
        [FromRoute] string manifestVersion,
        CancellationToken cancellationToken)
    {
        IActionResult? tenantProblem = await RequireTenantOrNotFoundAsync(cancellationToken).ConfigureAwait(false);

        if (tenantProblem is not null)
            return tenantProblem;

        GoldenManifest? manifest = await GetManifestInScopeAsync(manifestVersion, cancellationToken);
        if (manifest is null)
            return this.NotFoundProblem($"Manifest '{manifestVersion}' was not found.", ProblemTypes.ManifestNotFound);

        string mermaid = diagramGenerator.GenerateMermaid(manifest);

        return Ok(new DiagramResponse { ManifestVersion = manifestVersion, Format = FormatMermaid, Diagram = mermaid });
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
        IActionResult? tenantProblem = await RequireTenantOrNotFoundAsync(cancellationToken).ConfigureAwait(false);

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

        return Ok(new ManifestDiagramResponse
        {
            ManifestVersion = manifestVersion, DiagramType = DiagramTypeMermaid, Content = mermaid
        });
    }

    [HttpGet("manifest/{manifestVersion}/summary")]
    [ProducesResponseType(typeof(ManifestMarkdownDocumentResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetManifestSummary(
        [FromRoute] string manifestVersion,
        [FromQuery] string? format = "markdown",
        [FromQuery] bool includeRelationships = true,
        [FromQuery] bool includeRequiredControls = true,
        [FromQuery] bool includeTags = true,
        [FromQuery] bool includeComponentControls = true,
        [FromQuery] int? maxRelationships = null,
        CancellationToken cancellationToken = default)
    {
        IActionResult? tenantProblem = await RequireTenantOrNotFoundAsync(cancellationToken).ConfigureAwait(false);

        if (tenantProblem is not null)
            return tenantProblem;

        GoldenManifest? manifest = await GetManifestInScopeAsync(manifestVersion, cancellationToken);
        if (manifest is null)
            return this.NotFoundProblem($"Manifest '{manifestVersion}' was not found.", ProblemTypes.ManifestNotFound);

        int? clampedMaxRelationships = maxRelationships.HasValue
            ? Math.Clamp(maxRelationships.Value, 1, ManifestSummaryLimits.MaxRelationships)
            : null;

        if (string.Equals(format, FormatJson, StringComparison.OrdinalIgnoreCase))
            return Ok(new ManifestSummaryJsonResponse
            {
                ManifestVersion = manifestVersion,
                SystemName = manifest.SystemName,
                ServiceCount = manifest.Services.Count,
                DatastoreCount = manifest.Datastores.Count,
                RelationshipCount = manifest.Relationships.Count,
                RequiredControls = includeRequiredControls
                    ? manifest.Governance.RequiredControls.OrderBy(x => x, StringComparer.OrdinalIgnoreCase).ToList()
                    : [],
                Services = manifest.Services
                    .OrderBy(s => s.ServiceName, StringComparer.OrdinalIgnoreCase)
                    .Select(s => new ManifestSummaryServiceItem
                    {
                        Name = s.ServiceName,
                        ServiceType = s.ServiceType.ToString(),
                        RuntimePlatform = s.RuntimePlatform.ToString(),
                        Purpose = s.Purpose,
                        RequiredControls = includeComponentControls
                            ? s.RequiredControls.OrderBy(x => x, StringComparer.OrdinalIgnoreCase).ToList()
                            : [],
                        Tags = includeTags
                            ? s.Tags.OrderBy(x => x, StringComparer.OrdinalIgnoreCase).ToList()
                            : []
                    })
                    .ToList(),
                Datastores = manifest.Datastores
                    .OrderBy(d => d.DatastoreName, StringComparer.OrdinalIgnoreCase)
                    .Select(d => new ManifestSummaryDatastoreItem
                    {
                        Name = d.DatastoreName,
                        DatastoreType = d.DatastoreType.ToString(),
                        RuntimePlatform = d.RuntimePlatform.ToString(),
                        Purpose = d.Purpose,
                        PrivateEndpointRequired = d.PrivateEndpointRequired,
                        EncryptionAtRestRequired = d.EncryptionAtRestRequired
                    })
                    .ToList(),
                Relationships = includeRelationships
                    ? manifest.Relationships.Take(clampedMaxRelationships ?? int.MaxValue).Select(r =>
                        new ManifestSummaryRelationshipItem
                        {
                            SourceId = r.SourceId,
                            TargetId = r.TargetId,
                            RelationshipType = r.RelationshipType.ToString(),
                            Description = r.Description
                        }).ToList()
                    : []
            });

        if (!string.Equals(format, FormatMarkdown, StringComparison.OrdinalIgnoreCase))
            return this.BadRequestProblem(
                $"format must be '{FormatMarkdown}' or '{FormatJson}'.",
                ProblemTypes.ValidationFailed);

        ManifestSummaryOptions options = new()
        {
            IncludeRelationships = includeRelationships,
            IncludeRequiredControls = includeRequiredControls,
            IncludeTags = includeTags,
            IncludeComponentControls = includeComponentControls,
            MaxRelationships = clampedMaxRelationships
        };

        string content = manifestSummaryService.GenerateMarkdown(manifest, options);

        return Ok(new ManifestMarkdownDocumentResponse
        {
            ManifestVersion = manifestVersion, Format = FormatMarkdown, Content = content, Summary = content
        });
    }

    [HttpGet("manifest/{manifestVersion}/summary/evidence")]
    [ProducesResponseType(typeof(ManifestMarkdownDocumentResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetManifestSummaryEvidence(
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

        string markdown = summaryGenerator.GenerateMarkdown(manifest, evidence);

        return Ok(new ManifestMarkdownDocumentResponse
        {
            ManifestVersion = manifestVersion, Format = FormatMarkdown, Content = markdown, Summary = markdown
        });
    }

    [HttpGet("manifest/{manifestVersion}/bundle")]
    [ProducesResponseType(typeof(ManifestBundleResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetManifestBundle(
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

        return Ok(new ManifestBundleResponse
        {
            ManifestVersion = manifestVersion, Manifest = manifest, Diagram = diagram, Summary = summary
        });
    }

    private async Task<GoldenManifest?> GetManifestInScopeAsync(
        string manifestVersion,
        CancellationToken cancellationToken)
    {
        GoldenManifest? manifest =
            await unifiedGoldenManifestReader.GetByVersionAsync(manifestVersion, cancellationToken);

        if (manifest is null)
            return null;

        if (!await IsManifestRunInScopeAsync(manifest, cancellationToken))
            return null;

        return manifest;
    }
}
