using System.Net.Http.Json;
using System.Text.Json.Serialization;

using ArchLucid.Core.Identity;

namespace ArchLucid.Application.Identity;

/// <summary>DNS-over-HTTPS TXT lookup via Cloudflare public resolver.</summary>
public sealed class CloudflareDnsTxtRecordLookup(HttpClient httpClient) : IDnsTxtRecordLookup
{
    private readonly HttpClient _httpClient =
        httpClient ?? throw new ArgumentNullException(nameof(httpClient));

    public async Task<IReadOnlyList<string>> GetTxtRecordsAsync(string domain, CancellationToken cancellationToken)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(domain);

        string requestUri =
            $"https://cloudflare-dns.com/dns-query?name={Uri.EscapeDataString(domain)}&type=TXT";

        using HttpRequestMessage request = new(HttpMethod.Get, requestUri);
        request.Headers.TryAddWithoutValidation("Accept", "application/dns-json");

        using HttpResponseMessage response = await _httpClient.SendAsync(request, cancellationToken).ConfigureAwait(false);
        response.EnsureSuccessStatusCode();

        CloudflareDnsResponse? payload =
            await response.Content.ReadFromJsonAsync<CloudflareDnsResponse>(cancellationToken).ConfigureAwait(false);

        if (payload?.Answer is null || payload.Answer.Count == 0)
        {
            return Array.Empty<string>();
        }

        List<string> records = new();

        foreach (CloudflareDnsAnswer answer in payload.Answer)
        {
            if (answer.Type != 16 || string.IsNullOrWhiteSpace(answer.Data))
            {
                continue;
            }

            records.Add(answer.Data.Trim('"'));
        }

        return records;
    }

    private sealed class CloudflareDnsResponse
    {
        [JsonPropertyName("Answer")]
        public List<CloudflareDnsAnswer>? Answer
        {
            get;
            init;
        }
    }

    private sealed class CloudflareDnsAnswer
    {
        [JsonPropertyName("type")]
        public int Type
        {
            get;
            init;
        }

        [JsonPropertyName("data")]
        public string? Data
        {
            get;
            init;
        }
    }
}
