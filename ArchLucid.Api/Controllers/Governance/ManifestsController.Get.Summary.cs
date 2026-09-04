using ArchLucid.Api.Models;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Application.Summaries;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Manifest;

using Microsoft.AspNetCore.Mvc;

namespace ArchLucid.Api.Controllers.Governance;

public sealed partial class ManifestsController
{
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
        IActionResult? manifestVersionProblem = BadRequestWhenManifestVersionEmpty(manifestVersion);

        if (manifestVersionProblem is not null)
            return manifestVersionProblem;

        if (maxRelationships is < 1 or > ManifestSummaryLimits.MaxRelationships)
        {
            return this.BadRequestProblem(
                $"maxRelationships must be between 1 and {ManifestSummaryLimits.MaxRelationships}.",
                ProblemTypes.ValidationFailed);
        }

        if (!string.Equals(format, FormatMarkdown, StringComparison.OrdinalIgnoreCase)
            && !string.Equals(format, FormatJson, StringComparison.OrdinalIgnoreCase))
        {
            return this.BadRequestProblem(
                $"format must be '{FormatMarkdown}' or '{FormatJson}'.",
                ProblemTypes.ValidationFailed);
        }

        IActionResult? tenantProblem = await RequireTenantAndWorkspaceOrNotFoundAsync(cancellationToken).ConfigureAwait(false);

        if (tenantProblem is not null)
            return tenantProblem;

        GoldenManifest? manifest = await GetManifestInScopeAsync(manifestVersion, cancellationToken);

        if (manifest is null)
            return this.NotFoundProblem($"Manifest '{manifestVersion}' was not found.", ProblemTypes.ManifestNotFound);

        int? validatedMaxRelationships = maxRelationships ?? ManifestSummaryLimits.MaxRelationships;

        string canonicalManifestVersion = manifest.Metadata.ManifestVersion;

        if (string.Equals(format, FormatJson, StringComparison.OrdinalIgnoreCase))
            return Ok(new ManifestSummaryJsonResponse
            {
                ManifestVersion = canonicalManifestVersion,
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
                    ? manifest.Relationships.Take(validatedMaxRelationships ?? int.MaxValue).Select(r =>
                        new ManifestSummaryRelationshipItem
                        {
                            SourceId = r.SourceId,
                            TargetId = r.TargetId,
                            RelationshipType = r.RelationshipType.ToString(),
                            Description = r.Description
                        }).ToList()
                    : []
            });

        ManifestSummaryOptions options = new()
        {
            IncludeRelationships = includeRelationships,
            IncludeRequiredControls = includeRequiredControls,
            IncludeTags = includeTags,
            IncludeComponentControls = includeComponentControls,
            MaxRelationships = validatedMaxRelationships
        };

        string content = manifestSummaryService.GenerateMarkdown(manifest, options);

        return Ok(new ManifestMarkdownDocumentResponse
        {
            ManifestVersion = canonicalManifestVersion, Format = FormatMarkdown, Content = content, Summary = content
        });
    }

    [HttpGet("manifest/{manifestVersion}/summary/evidence")]
    [ProducesResponseType(typeof(ManifestMarkdownDocumentResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetManifestSummaryEvidence(
        [FromRoute] string manifestVersion,
        CancellationToken cancellationToken)
    {
        IActionResult? manifestVersionProblem = BadRequestWhenManifestVersionEmpty(manifestVersion);

        if (manifestVersionProblem is not null)
            return manifestVersionProblem;

        IActionResult? tenantProblem = await RequireTenantAndWorkspaceOrNotFoundAsync(cancellationToken).ConfigureAwait(false);

        if (tenantProblem is not null)
            return tenantProblem;

        (GoldenManifest? manifest, AgentEvidencePackage? evidence) =
            await LoadManifestWithEvidenceAsync(manifestVersion, cancellationToken);

        if (manifest is null)
            return this.NotFoundProblem($"Manifest '{manifestVersion}' was not found.", ProblemTypes.ManifestNotFound);

        string markdown = summaryGenerator.GenerateMarkdown(manifest, evidence);
        string canonicalManifestVersion = manifest.Metadata.ManifestVersion;

        return Ok(new ManifestMarkdownDocumentResponse
        {
            ManifestVersion = canonicalManifestVersion, Format = FormatMarkdown, Content = markdown, Summary = markdown
        });
    }
}
