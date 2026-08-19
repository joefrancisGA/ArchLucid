using System.Net.Http.Headers;

namespace ArchLucid.ReviewApiHarness;

/// <summary>Builds an authenticated <see cref="HttpClient"/> for harness calls.</summary>
public static class HarnessHttpClientFactory
{
    public static HttpClient Create(JourneyOptions options)
    {
        ArgumentNullException.ThrowIfNull(options);

        HttpClient http = new()
        {
            BaseAddress = new Uri(options.ApiBaseUrl.TrimEnd('/') + "/"),
            Timeout = TimeSpan.FromSeconds(options.TimeoutSeconds + 120)
        };

        http.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));

        string? apiKey = Environment.GetEnvironmentVariable("ARCHLUCID_API_KEY");

        if (!string.IsNullOrWhiteSpace(apiKey))
            http.DefaultRequestHeaders.Add("X-Api-Key", apiKey);

        string? bearer = Environment.GetEnvironmentVariable("ARCHLUCID_BEARER_TOKEN");

        if (!string.IsNullOrWhiteSpace(bearer))
            http.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", bearer);

        return http;
    }
}
