using System.IO.Compression;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;

using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace ArchLucid.Application.Analysis;

/// <summary>
///     Uses the GitHub REST API to create a branch, commit advisory Terraform files extracted from a ZIP,
///     and open a Pull Request. Credentials are never logged.
/// </summary>
public sealed class TerraformGitHubPrService(
    IHttpClientFactory httpClientFactory,
    IOptionsMonitor<TerraformGitHubPrOptions> optionsMonitor,
    ILogger<TerraformGitHubPrService> logger) : ITerraformGitHubPrService
{
    /// <summary>Named HttpClient key used by this service.</summary>
    public const string HttpClientName = "TerraformGitHubPr";

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower,
        DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull
    };

    private readonly IHttpClientFactory _httpClientFactory =
        httpClientFactory ?? throw new ArgumentNullException(nameof(httpClientFactory));

    private readonly IOptionsMonitor<TerraformGitHubPrOptions> _optionsMonitor =
        optionsMonitor ?? throw new ArgumentNullException(nameof(optionsMonitor));

    private readonly ILogger<TerraformGitHubPrService> _logger =
        logger ?? throw new ArgumentNullException(nameof(logger));

    /// <inheritdoc />
    public async Task<TerraformPrCreationResult> CreatePrAsync(
        Guid runId,
        byte[] terraformZipContent,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(terraformZipContent);

        TerraformGitHubPrOptions opts = _optionsMonitor.CurrentValue;
        ValidateOptions(opts);

        string owner = opts.Owner!;
        string repo = opts.Repo!;
        string baseBranch = opts.BaseBranch;
        string pat = opts.PersonalAccessToken!;
        string branch = $"archlucid/terraform-update-{runId:D}";

        HttpClient client = BuildClient(pat);

        string baseSha = await GetBaseShaAsync(client, owner, repo, baseBranch, cancellationToken);
        await CreateBranchAsync(client, owner, repo, branch, baseSha, cancellationToken);

        IReadOnlyList<(string Path, string Content)> files = ExtractFilesFromZip(terraformZipContent);

        foreach ((string filePath, string content) in files)
        {
            await CommitFileAsync(client, owner, repo, branch, filePath, content, runId, cancellationToken);
        }

        int prNumber = await CreatePullRequestAsync(client, owner, repo, branch, baseBranch, runId, cancellationToken);
        string prUrl = $"https://github.com/{owner}/{repo}/pull/{prNumber}";

        _logger.LogInformation(
            "Terraform advisory PR created: RunId={RunId} PR={PrUrl} Branch={Branch}",
            runId, prUrl, branch);

        return new TerraformPrCreationResult
        {
            PullRequestUrl = prUrl,
            PullRequestNumber = prNumber,
            BranchName = branch
        };
    }

    private static void ValidateOptions(TerraformGitHubPrOptions opts)
    {
        if (!opts.Enabled)
            throw new InvalidOperationException(
                "GitHub PR creation is not enabled. Set TerraformGitHubPr:Enabled=true and configure Owner, Repo, and PersonalAccessToken.");

        if (string.IsNullOrWhiteSpace(opts.Owner))
            throw new InvalidOperationException("TerraformGitHubPr:Owner is required.");

        if (string.IsNullOrWhiteSpace(opts.Repo))
            throw new InvalidOperationException("TerraformGitHubPr:Repo is required.");

        if (string.IsNullOrWhiteSpace(opts.PersonalAccessToken))
            throw new InvalidOperationException("TerraformGitHubPr:PersonalAccessToken is required.");
    }

    private HttpClient BuildClient(string pat)
    {
        HttpClient client = _httpClientFactory.CreateClient(HttpClientName);
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", pat);
        client.DefaultRequestHeaders.UserAgent.ParseAdd("ArchLucid-TerraformPrService/1.0");
        client.DefaultRequestHeaders.Accept.ParseAdd("application/vnd.github+json");
        client.DefaultRequestHeaders.TryAddWithoutValidation("X-GitHub-Api-Version", "2022-11-28");
        return client;
    }

    /// <summary>Resolves the commit SHA of the base branch — required to create a new branch ref via the Git API.</summary>
    private static async Task<string> GetBaseShaAsync(
        HttpClient client,
        string owner,
        string repo,
        string baseBranch,
        CancellationToken ct)
    {
        string url = $"https://api.github.com/repos/{owner}/{repo}/git/ref/heads/{baseBranch}";
        HttpResponseMessage response = await client.GetAsync(url, ct).ConfigureAwait(false);
        response.EnsureSuccessStatusCode();
        string json = await response.Content.ReadAsStringAsync(ct).ConfigureAwait(false);
        using JsonDocument doc = JsonDocument.Parse(json);
        return doc.RootElement.GetProperty("object").GetProperty("sha").GetString()
               ?? throw new InvalidOperationException($"Could not read SHA for branch '{baseBranch}'.");
    }

    /// <summary>Creates <c>refs/heads/{branch}</c> pointing at <paramref name="baseSha" /> (Git data API).</summary>
    private static async Task CreateBranchAsync(
        HttpClient client,
        string owner,
        string repo,
        string branch,
        string baseSha,
        CancellationToken ct)
    {
        string url = $"https://api.github.com/repos/{owner}/{repo}/git/refs";
        object body = new
        {
            @ref = $"refs/heads/{branch}",
            sha = baseSha
        };
        StringContent content = Serialize(body);
        HttpResponseMessage response = await client.PostAsync(url, content, ct).ConfigureAwait(false);
        response.EnsureSuccessStatusCode();
    }

    /// <summary>
    ///     Commits one file via the GitHub Contents API. Content must be Base64-encoded per GitHub's REST contract
    ///     (raw UTF-8 would break JSON transport for non-ASCII HCL).
    /// </summary>
    private static async Task CommitFileAsync(
        HttpClient client,
        string owner,
        string repo,
        string branch,
        string filePath,
        string fileContent,
        Guid runId,
        CancellationToken ct)
    {
        string url = $"https://api.github.com/repos/{owner}/{repo}/contents/{filePath}";
        string encoded = Convert.ToBase64String(Encoding.UTF8.GetBytes(fileContent));
        object body = new
        {
            message = $"chore: ArchLucid advisory Terraform export (run {runId:D})",
            content = encoded,
            branch
        };
        StringContent content = Serialize(body);
        HttpResponseMessage response = await client.PutAsync(url, content, ct).ConfigureAwait(false);
        response.EnsureSuccessStatusCode();
    }

    private async Task<int> CreatePullRequestAsync(
        HttpClient client,
        string owner,
        string repo,
        string branch,
        string baseBranch,
        Guid runId,
        CancellationToken ct)
    {
        string url = $"https://api.github.com/repos/{owner}/{repo}/pulls";
        object body = new
        {
            title = $"ArchLucid: Advisory Terraform export for run {runId:D}",
            body = BuildPrBody(runId),
            head = branch,
            @base = baseBranch
        };
        StringContent content = Serialize(body);
        HttpResponseMessage response = await client.PostAsync(url, content, ct).ConfigureAwait(false);
        response.EnsureSuccessStatusCode();
        string json = await response.Content.ReadAsStringAsync(ct).ConfigureAwait(false);
        using JsonDocument doc = JsonDocument.Parse(json);
        return doc.RootElement.GetProperty("number").GetInt32();
    }

    private string BuildPrBody(Guid runId)
    {
        string baseUrl = _optionsMonitor.CurrentValue.OperatorUiBaseUrl ?? "https://archlucid.local";
        string approveUrl = $"{baseUrl}/reviews/{runId:D}/finalize";

        return $"""
         ## ArchLucid Advisory Terraform Export

         > **This is an advisory export only.** Review and adapt the Terraform files before applying them
         > to any environment. ArchLucid does not apply infrastructure changes on your behalf.

         **Run ID:** `{runId:D}`

         See the README inside the committed files for aztfexport usage guidance.

         ---
         
         ### Actions
         - [Approve / Finalize Run]({approveUrl})
         """;
    }

    /// <summary>
    ///     Extracts text files from the advisory Terraform ZIP (skips binary files and directories).
    /// </summary>
    private static IReadOnlyList<(string Path, string Content)> ExtractFilesFromZip(byte[] zipContent)
    {
        List<(string, string)> files = [];

        using MemoryStream ms = new(zipContent);
        using ZipArchive archive = new(ms, ZipArchiveMode.Read);

        foreach (ZipArchiveEntry entry in archive.Entries)
        {
            if (entry.FullName.EndsWith('/'))
                continue;

            using StreamReader reader = new(entry.Open(), Encoding.UTF8, detectEncodingFromByteOrderMarks: true, leaveOpen: false);
            string text = reader.ReadToEnd();
            files.Add((entry.FullName, text));
        }

        return files;
    }

    private static StringContent Serialize(object value)
    {
        string json = JsonSerializer.Serialize(value, JsonOptions);
        return new StringContent(json, Encoding.UTF8, "application/json");
    }
}
