using System.Net;
using System.Text;
using System.Text.Json;

using ArchLucid.Contracts.Requests;

using Gen = ArchLucid.Api.Client.Generated;

namespace ArchLucid.Cli;

/// <summary>
///     Architecture run creation (<c>POST /v1/architecture/request</c>).
/// </summary>
public sealed partial class ArchLucidApiClient
{
    /// <summary>
    ///     Create an architecture run by submitting an ArchitectureRequest.
    /// </summary>
    public async Task<CreateRunResult> CreateRunAsync(
        ArchitectureRequest request,
        CancellationToken ct = default,
        string? idempotencyKey = null)
    {
        try
        {
            Gen.Body51? body = MapToOpenApiRequestBody<Gen.Body51>(MapToGenerated(request), GenNumericEnumBridgeJson);

            if (body is null)
                return CreateRunResult.Fail(null, "Invalid architecture request payload.");

            if (!string.IsNullOrWhiteSpace(idempotencyKey))
            {
                return await CreateRunWithIdempotencyHeaderAsync(MapToGenerated(request)!, idempotencyKey.Trim(), ct);
            }

            Gen.CreateArchitectureRunResponse created = await _api.RequestPOSTAsync(body, ct);
            CreateRunResponse? mapped = DeserializeRoundTrip<CreateRunResponse>(created);

            return CreateRunResult.Ok(mapped);
        }
        catch (Gen.ArchLucidApiException ex)
        {
            return CreateRunResult.Fail(ex.StatusCode, ResolveApiErrorMessage(ex), TryReadCorrelationId(ex));
        }
        catch (HttpRequestException ex)
        {
            return CreateRunResult.Fail(null, $"Cannot connect to ArchLucid API: {ex.Message}");
        }
        catch (TaskCanceledException)
        {
            return CreateRunResult.Fail(null, "Request timed out.");
        }
    }

    private async Task<CreateRunResult> CreateRunWithIdempotencyHeaderAsync(
        Gen.ArchitectureRequest body,
        string idempotencyKey,
        CancellationToken ct)
    {
        string json = JsonSerializer.Serialize(body, GenNumericEnumBridgeJson);
        using HttpRequestMessage request = new(HttpMethod.Post, "v1/architecture/request");
        request.Content = new StringContent(json, Encoding.UTF8, "application/json");
        request.Headers.TryAddWithoutValidation("Idempotency-Key", idempotencyKey);

        using HttpResponseMessage response = await _http.SendAsync(request, ct);
        string text = await response.Content.ReadAsStringAsync(ct);

        if (!response.IsSuccessStatusCode)
        {
            return CreateRunResult.Fail((int)response.StatusCode, ResolveApiErrorMessageFromBody(text), TryReadCorrelationIdFromHeaders(response.Headers));
        }

        Gen.CreateArchitectureRunResponse? created = JsonSerializer.Deserialize<Gen.CreateArchitectureRunResponse>(text, GenNumericEnumBridgeJson);
        CreateRunResponse? mapped = DeserializeRoundTrip<CreateRunResponse>(created);

        return CreateRunResult.Ok(mapped);
    }
}
