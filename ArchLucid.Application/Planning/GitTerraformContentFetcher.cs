using System.Net;
using System.Text.RegularExpressions;

namespace ArchLucid.Application.Planning;

public sealed partial class GitTerraformContentFetcher(IHttpClientFactory httpClientFactory) : IGitTerraformContentFetcher
{
    public const string HttpClientName = "ConnectorIntakeGit";

    private const int MaxTerraformBytes = 512_000;

    private readonly IHttpClientFactory _httpClientFactory = httpClientFactory
                                                             ?? throw new ArgumentNullException(nameof(httpClientFactory));

    public async Task<string> FetchTerraformFileAsync(
        string repositoryUrl,
        string branch,
        string terraformPath,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(repositoryUrl))
            throw new ArgumentException("GitRepositoryUrl is required.", nameof(repositoryUrl));

        if (string.IsNullOrWhiteSpace(terraformPath))
            throw new ArgumentException("GitTerraformPath is required.", nameof(terraformPath));

        string normalizedBranch = string.IsNullOrWhiteSpace(branch) ? "main" : branch.Trim();
        (string owner, string repo, string path) = ParseGitHubCoordinates(repositoryUrl.Trim(), normalizedBranch, terraformPath.Trim());

        string rawUrl = $"https://raw.githubusercontent.com/{owner}/{repo}/{normalizedBranch}/{path.TrimStart('/')}";
        HttpClient client = _httpClientFactory.CreateClient(HttpClientName);
        client.DefaultRequestHeaders.UserAgent.ParseAdd("ArchLucid-ConnectorIntake/1.0");

        using HttpResponseMessage response = await client.GetAsync(rawUrl, cancellationToken);

        if (response.StatusCode == HttpStatusCode.NotFound)
            throw new InvalidOperationException($"Terraform file was not found at '{path}' on branch '{normalizedBranch}'.");

        response.EnsureSuccessStatusCode();

        byte[] bytes = await response.Content.ReadAsByteArrayAsync(cancellationToken);

        if (bytes.Length == 0)
            throw new InvalidOperationException("Git Terraform file was empty.");

        if (bytes.Length > MaxTerraformBytes)
            throw new InvalidOperationException($"Git Terraform file exceeds the {MaxTerraformBytes} byte limit.");

        return System.Text.Encoding.UTF8.GetString(bytes);
    }

    internal static (string Owner, string Repo, string Path) ParseGitHubCoordinates(
        string repositoryUrl,
        string branch,
        string terraformPath)
    {
        string path = terraformPath;

        if (Uri.TryCreate(repositoryUrl, UriKind.Absolute, out Uri? uri) && uri.Host.Contains("github.com", StringComparison.OrdinalIgnoreCase))
        {
            string[] segments = uri.AbsolutePath.Trim('/').Split('/', StringSplitOptions.RemoveEmptyEntries);

            if (segments.Length >= 2)
            {
                string owner = segments[0];
                string repo = segments[1].EndsWith(".git", StringComparison.OrdinalIgnoreCase)
                    ? segments[1][..^4]
                    : segments[1];

                if (segments.Length >= 5 && string.Equals(segments[2], "blob", StringComparison.OrdinalIgnoreCase))
                {
                    branch = segments[3];
                    path = string.Join('/', segments.Skip(4));
                }
                else if (segments.Length >= 5 && string.Equals(segments[2], "tree", StringComparison.OrdinalIgnoreCase))
                {
                    branch = segments[3];
                    path = string.Join('/', segments.Skip(4));
                }

                if (path.Length == 0)
                    path = terraformPath;

                return (owner, repo, path);
            }
        }

        Match match = GitHubHttpsRegex().Match(repositoryUrl);

        if (!match.Success)
            throw new InvalidOperationException("GitRepositoryUrl must be a public github.com HTTPS URL.");

        return (match.Groups["owner"].Value, match.Groups["repo"].Value, path);
    }

    [GeneratedRegex(@"^https://github\.com/(?<owner>[^/]+)/(?<repo>[^/]+)", RegexOptions.IgnoreCase)]
    private static partial Regex GitHubHttpsRegex();
}
