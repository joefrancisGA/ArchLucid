using System.Diagnostics.CodeAnalysis;
using System.Net;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;

using ArchLucid.Cli.Commands;
using ArchLucid.Contracts.Agents;
using ArchLucid.Core.AgentEvaluation;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Drafts;
using ArchLucid.Contracts.Manifest;
using ArchLucid.Contracts.Requests;

using Gen = ArchLucid.Api.Client.Generated;

namespace ArchLucid.Cli;

/// <summary>
///     Correlation-id extraction and API error-message resolution shared by every call in this client.
/// </summary>
public sealed partial class ArchLucidApiClient
{
    private static string? TryReadCorrelationIdFromHeaders(System.Net.Http.Headers.HttpResponseHeaders headers)
    {
        if (headers.TryGetValues("X-Correlation-ID", out IEnumerable<string>? values))
        {
            return values.FirstOrDefault();
        }

        return null;
    }

    private static string ResolveApiErrorMessageFromBody(string body)
    {
        if (string.IsNullOrWhiteSpace(body))
            return "API request failed.";

        try
        {
            using JsonDocument doc = JsonDocument.Parse(body);
            JsonElement root = doc.RootElement;

            if (root.TryGetProperty("detail", out JsonElement detail) && detail.ValueKind == JsonValueKind.String)
                return detail.GetString() ?? body;

            if (root.TryGetProperty("title", out JsonElement title) && title.ValueKind == JsonValueKind.String)
                return title.GetString() ?? body;
        }
        catch (JsonException)
        {
            // Fall through to raw body.
        }

        return body.Length > 500 ? body[..500] : body;
    }


    /// <summary>
    ///     NSwag reads ProblemDetails from the stream with <c>ReadResponseAsString=false</c>, so
    ///     <see cref="Gen.ArchLucidApiException.Response" />
    ///     is often empty even when <see cref="Gen.ArchLucidApiException{TResult}" /> carries a typed
    ///     <see cref="Gen.ProblemDetails" /> body.
    /// </summary>
    private static string? TryReadCorrelationId(Gen.ArchLucidApiException ex)
    {
        return (from pair in ex.Headers
            where pair.Key.Equals("X-Correlation-ID", StringComparison.OrdinalIgnoreCase)
            select pair.Value.FirstOrDefault()
            into first
            where !string.IsNullOrWhiteSpace(first)
            select first.Trim()).FirstOrDefault();
    }

    private static string ResolveApiErrorMessage(Gen.ArchLucidApiException ex)
    {
        string? fromBody = TryParseError(ex.Response ?? string.Empty);

        if (!string.IsNullOrWhiteSpace(fromBody))
            return fromBody;

        if (ex is not Gen.ArchLucidApiException<Gen.ProblemDetails> typed)
            return ex.Message;

        if (!string.IsNullOrWhiteSpace(typed.Result.Detail))
            return typed.Result.Detail;

        return !string.IsNullOrWhiteSpace(typed.Result.Title) ? typed.Result.Title : ex.Message;
    }

    /// <summary>
    ///     Parse error message from JSON. Supports RFC 9457 Problem Details (detail, title) and legacy (error, errors).
    /// </summary>
    private static string? TryParseError(string json)
    {
        try
        {
            JsonDocument doc = JsonDocument.Parse(json);
            JsonElement root = doc.RootElement;

            if (root.TryGetProperty("detail", out JsonElement detail))
                return detail.GetString();

            if (root.TryGetProperty("error", out JsonElement err))
                return err.GetString();

            if (root.TryGetProperty("errors", out JsonElement errs) && errs.ValueKind == JsonValueKind.Array)

                return string.Join("; ",
                    errs.EnumerateArray().Select(e => e.GetString()).Where(s => !string.IsNullOrEmpty(s)));

            if (root.TryGetProperty("title", out JsonElement title))
                return title.GetString();
        }
        catch (Exception)
        {
            // Best-effort parse of arbitrary API error JSON; avoid stderr noise.
        }

        return null;
    }
}
