namespace ArchLucid.Application.Planning;

public interface IGitTerraformContentFetcher
{
    Task<string> FetchTerraformFileAsync(
        string repositoryUrl,
        string branch,
        string terraformPath,
        CancellationToken cancellationToken);
}
