using System.Text.Json;
using System.Text.Json.Serialization;

using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Requests;

namespace ArchLucid.Cli.Request;

/// <summary>
///     Parses a full <see cref="ArchitectureRequest" /> JSON document (templates/architecture-requests/*.json).
/// </summary>
internal static class ArchitectureRequestFileParser
{
    /// <summary>Hard cap for on-disk request files (UTF-8 bytes).</summary>
    public const int MaxUtf8Bytes = 512 * 1024;

    private static readonly JsonSerializerOptions JsonRead = new(ContractJson.Default)
    {
        PropertyNameCaseInsensitive = true,
        ReadCommentHandling = JsonCommentHandling.Skip,
        AllowTrailingCommas = true,
        Converters =
        {
            new JsonStringEnumConverter<CloudProvider>(allowIntegerValues: true),
        },
    };

    /// <summary>Reads a file and deserializes it into <see cref="ArchitectureRequest" />.</summary>
    public static ArchitectureRequestFileParseOutcome ParseFromFile(string path)
    {
        if (string.IsNullOrWhiteSpace(path))
            return ArchitectureRequestFileParseOutcome.Fail(
                ArchitectureRequestFileParseFailureCode.BadRequest,
                "File path is required.");

        if (!File.Exists(path))
        {
            return ArchitectureRequestFileParseOutcome.Fail(
                ArchitectureRequestFileParseFailureCode.BadRequest,
                $"File not found: {path}");
        }

        byte[] bytes = File.ReadAllBytes(path);

        return ParseFromUtf8(bytes, path);
    }

    /// <summary>Parses UTF-8 JSON bytes into <see cref="ArchitectureRequest" />.</summary>
    public static ArchitectureRequestFileParseOutcome ParseFromUtf8(ReadOnlySpan<byte> utf8, string sourceLabel)
    {
        if (utf8.Length > MaxUtf8Bytes)
        {
            return ArchitectureRequestFileParseOutcome.Fail(
                ArchitectureRequestFileParseFailureCode.PayloadTooLarge,
                $"Architecture request file exceeds maximum size ({MaxUtf8Bytes} UTF-8 bytes) for {sourceLabel}.");
        }

        ArchitectureRequest? request;

        try
        {
            request = JsonSerializer.Deserialize<ArchitectureRequest>(utf8, JsonRead);
        }
        catch (JsonException ex)
        {
            return ArchitectureRequestFileParseOutcome.Fail(
                ArchitectureRequestFileParseFailureCode.BadRequest,
                $"Malformed JSON in {sourceLabel}: {ex.Message}");
        }

        if (request is null)
        {
            return ArchitectureRequestFileParseOutcome.Fail(
                ArchitectureRequestFileParseFailureCode.BadRequest,
                $"Empty JSON document in {sourceLabel}.");
        }

        return Validate(request, sourceLabel);
    }

    /// <summary>Applies optional CLI override for <see cref="ArchitectureRequest.RequestId" />.</summary>
    public static ArchitectureRequestFileParseOutcome ApplyRequestIdOverride(
        ArchitectureRequest request,
        string? requestIdOverride,
        string sourceLabel)
    {
        ArgumentNullException.ThrowIfNull(request);

        if (string.IsNullOrWhiteSpace(requestIdOverride))
            return ArchitectureRequestFileParseOutcome.Ok(request);

        string normalized = requestIdOverride.Trim().Replace("-", string.Empty);

        if (string.IsNullOrWhiteSpace(normalized))
        {
            return ArchitectureRequestFileParseOutcome.Fail(
                ArchitectureRequestFileParseFailureCode.BadRequest,
                $"Option --request-id must not be empty in {sourceLabel}.");
        }

        if (normalized.Length > 64)
        {
            return ArchitectureRequestFileParseOutcome.Fail(
                ArchitectureRequestFileParseFailureCode.BadRequest,
                $"Option --request-id exceeds 64 characters in {sourceLabel}.");
        }

        request.RequestId = normalized;

        return ArchitectureRequestFileParseOutcome.Ok(request);
    }

    private static ArchitectureRequestFileParseOutcome Validate(ArchitectureRequest request, string sourceLabel)
    {
        string systemName = (request.SystemName ?? string.Empty).Trim();

        if (string.IsNullOrWhiteSpace(systemName))
        {
            return ArchitectureRequestFileParseOutcome.Fail(
                ArchitectureRequestFileParseFailureCode.BadRequest,
                $"Missing required field 'systemName' in {sourceLabel}.");
        }

        string description = (request.Description ?? string.Empty).Trim();

        if (string.IsNullOrWhiteSpace(description))
        {
            return ArchitectureRequestFileParseOutcome.Fail(
                ArchitectureRequestFileParseFailureCode.BadRequest,
                $"Missing required field 'description' in {sourceLabel}.");
        }

        if (description.Length < 10)
        {
            return ArchitectureRequestFileParseOutcome.Fail(
                ArchitectureRequestFileParseFailureCode.BadRequest,
                $"Field 'description' must be at least 10 characters (API contract) in {sourceLabel}.");
        }

        string requestId = (request.RequestId ?? string.Empty).Trim().Replace("-", string.Empty);

        if (string.IsNullOrWhiteSpace(requestId))
            requestId = Guid.NewGuid().ToString("N");

        if (requestId.Length > 64)
        {
            return ArchitectureRequestFileParseOutcome.Fail(
                ArchitectureRequestFileParseFailureCode.BadRequest,
                $"Field 'requestId' exceeds 64 characters in {sourceLabel}.");
        }

        request.SystemName = systemName;
        request.Description = description;
        request.RequestId = requestId;

        string environment = (request.Environment ?? string.Empty).Trim();

        if (string.IsNullOrWhiteSpace(environment))
            request.Environment = "prod";

        return ArchitectureRequestFileParseOutcome.Ok(request);
    }
}
