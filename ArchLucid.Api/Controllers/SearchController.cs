using ArchLucid.Application.Search;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.Search;

using Asp.Versioning;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ArchLucid.Api.Controllers;

[ApiController]
[Authorize(Policy = ArchLucidPolicies.ReadAuthority)]
[ApiVersion("1.0")]
[Route("v{version:apiVersion}/search")]
public sealed class SearchController(IGlobalSearchService searchService) : ControllerBase
{
    private readonly IGlobalSearchService _searchService =
        searchService ?? throw new ArgumentNullException(nameof(searchService));

    [HttpGet]
    [ProducesResponseType(typeof(GlobalSearchResponse), StatusCodes.Status200OK)]
    public async Task<IActionResult> SearchAsync([FromQuery] string? q, [FromQuery] int take = 8, CancellationToken cancellationToken = default)
    {
        GlobalSearchResult result = await _searchService.SearchAsync(q ?? string.Empty, take, cancellationToken);

        return Ok(GlobalSearchResponse.FromResult(result));
    }
}

public sealed class GlobalSearchResponse
{
    public IReadOnlyList<GlobalSearchRunResponse> Runs
    {
        get;
        init;
    } = [];

    public IReadOnlyList<GlobalSearchFindingResponse> Findings
    {
        get;
        init;
    } = [];

    public IReadOnlyList<GlobalSearchPolicyPackResponse> PolicyPacks
    {
        get;
        init;
    } = [];

    public static GlobalSearchResponse FromResult(GlobalSearchResult result)
    {
        return new GlobalSearchResponse
        {
            Runs = result.Runs
                .Select(static r => new GlobalSearchRunResponse
                {
                    RunId = r.RunId,
                    Description = r.Description,
                    AuthorityProjectSlug = r.AuthorityProjectSlug,
                    CreatedUtc = r.CreatedUtc,
                })
                .ToList(),
            Findings = result.Findings
                .Select(static f => new GlobalSearchFindingResponse
                {
                    RunId = f.RunId,
                    FindingId = f.FindingId,
                    Title = f.Title,
                    Severity = f.Severity,
                })
                .ToList(),
            PolicyPacks = result.PolicyPacks
                .Select(static p => new GlobalSearchPolicyPackResponse
                {
                    PolicyPackId = p.PolicyPackId,
                    Name = p.Name,
                    IsCatalogEntry = p.IsCatalogEntry,
                })
                .ToList(),
        };
    }
}

public sealed class GlobalSearchRunResponse
{
    public Guid RunId
    {
        get;
        init;
    }

    public string? Description
    {
        get;
        init;
    }

    public string? AuthorityProjectSlug
    {
        get;
        init;
    }

    public DateTimeOffset CreatedUtc
    {
        get;
        init;
    }
}

public sealed class GlobalSearchFindingResponse
{
    public Guid RunId
    {
        get;
        init;
    }

    public string FindingId
    {
        get;
        init;
    } = string.Empty;

    public string Title
    {
        get;
        init;
    } = string.Empty;

    public string Severity
    {
        get;
        init;
    } = string.Empty;
}

public sealed class GlobalSearchPolicyPackResponse
{
    public Guid PolicyPackId
    {
        get;
        init;
    }

    public string Name
    {
        get;
        init;
    } = string.Empty;

    public bool IsCatalogEntry
    {
        get;
        init;
    }
}
