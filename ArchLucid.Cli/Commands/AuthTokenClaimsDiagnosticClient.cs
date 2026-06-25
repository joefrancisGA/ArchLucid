using System.Text;
using System.Text.Json;

using ArchLucid.Contracts.Admin;

namespace ArchLucid.Cli.Commands;

/// <summary>
///     Shared HTTP client for <c>POST /v1/admin/auth/diagnose-token</c> (admin API key required).
/// </summary>
internal static class AuthTokenClaimsDiagnosticClient
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

    internal static async Task<AuthTokenClaimsDiagnosticOutcome> DiagnoseAsync(
        string baseUrl,
        string bearerToken,
        HttpClient? httpClient = null,
        CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(baseUrl);
        ArgumentException.ThrowIfNullOrWhiteSpace(bearerToken);

        string? apiKey = Environment.GetEnvironmentVariable("ARCHLUCID_API_KEY");

        if (string.IsNullOrWhiteSpace(apiKey))
        {
            return AuthTokenClaimsDiagnosticOutcome.FromMissingApiKey();
        }

        bool ownsClient = httpClient is null;
        HttpClient client = httpClient ?? new HttpClient { BaseAddress = new Uri(baseUrl.TrimEnd('/') + "/") };

        try
        {
            AdminTokenClaimsDiagnosticRequest payload = new() { BearerToken = bearerToken.Trim() };
            string jsonBody = JsonSerializer.Serialize(payload, JsonOptions);

            using HttpRequestMessage request = new(HttpMethod.Post, "v1/admin/auth/diagnose-token");
            request.Headers.Add("X-Api-Key", apiKey);
            request.Content = new StringContent(jsonBody, Encoding.UTF8, "application/json");

            using HttpResponseMessage response = await client
                .SendAsync(request, cancellationToken)
                .ConfigureAwait(false);

            string body = await response.Content.ReadAsStringAsync(cancellationToken).ConfigureAwait(false);

            if (!response.IsSuccessStatusCode)
            {
                return AuthTokenClaimsDiagnosticOutcome.HttpFailure((int)response.StatusCode, body);
            }

            AdminTokenClaimsDiagnosticResponse? parsed =
                JsonSerializer.Deserialize<AdminTokenClaimsDiagnosticResponse>(body, JsonOptions);

            if (parsed is null)
                return AuthTokenClaimsDiagnosticOutcome.ParseFailure();

            return AuthTokenClaimsDiagnosticOutcome.Success(parsed);
        }
        finally
        {
            if (ownsClient)
                client.Dispose();
        }
    }
}

internal sealed class AuthTokenClaimsDiagnosticOutcome
{
    public bool IsSuccess
    {
        get;
        private init;
    }

    public AdminTokenClaimsDiagnosticResponse? Response
    {
        get;
        private init;
    }

    public string? ErrorDetail
    {
        get;
        private init;
    }

    public int? HttpStatusCode
    {
        get;
        private init;
    }

    public bool IsMissingApiKey
    {
        get;
        private init;
    }

    internal static AuthTokenClaimsDiagnosticOutcome Success(AdminTokenClaimsDiagnosticResponse response) =>
        new() { IsSuccess = true, Response = response };

    internal static AuthTokenClaimsDiagnosticOutcome FromMissingApiKey() =>
        new()
        {
            IsSuccess = false,
            IsMissingApiKey = true,
            ErrorDetail =
                "ARCHLUCID_API_KEY is unset — set an AdminAuthority key before running token diagnostics.",
        };

    internal static AuthTokenClaimsDiagnosticOutcome HttpFailure(int statusCode, string body) =>
        new()
        {
            IsSuccess = false,
            HttpStatusCode = statusCode,
            ErrorDetail = $"POST /v1/admin/auth/diagnose-token returned HTTP {statusCode}: {TrimBody(body)}",
        };

    internal static AuthTokenClaimsDiagnosticOutcome ParseFailure() =>
        new() { IsSuccess = false, ErrorDetail = "Could not parse diagnose-token JSON response." };

    private static string TrimBody(string body)
    {
        string trimmed = body.Trim();

        return trimmed.Length <= 240 ? trimmed : trimmed[..240] + "…";
    }
}
