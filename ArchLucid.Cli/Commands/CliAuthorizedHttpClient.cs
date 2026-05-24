using System.Net.Http.Headers;

namespace ArchLucid.Cli.Commands;

internal static class CliAuthorizedHttpClient
{
    internal static HttpClient Create(string baseUrl)
    {
        HttpClient http = new() { Timeout = TimeSpan.FromMinutes(2), BaseAddress = new Uri(baseUrl.Trim().TrimEnd('/') + "/") };
        string? apiKey = Environment.GetEnvironmentVariable("ARCHLUCID_API_KEY");

        if (!string.IsNullOrWhiteSpace(apiKey))
        {
            http.DefaultRequestHeaders.Remove("X-Api-Key");
            http.DefaultRequestHeaders.Add("X-Api-Key", apiKey);
        }

        http.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));

        return http;
    }

    internal static string ResolveBaseUrl(string[] args, ArchLucidProjectScaffolder.ArchLucidCliConfig? config)
    {
        string? apiOverride = CliCommandShared.TryGetOptionValue(args, "--api-base-url");
        string baseUrl = CliCommandShared.GetBaseUrl(config);

        return string.IsNullOrWhiteSpace(apiOverride) ? baseUrl : apiOverride.Trim().TrimEnd('/');
    }
}
