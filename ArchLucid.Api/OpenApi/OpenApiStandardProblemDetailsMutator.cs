using ArchLucid.Api.ProblemDetails;

using Microsoft.OpenApi;

namespace ArchLucid.Api.OpenApi;

/// <summary>
///     Ensures OpenAPI operations document standard problem+json error responses used by the API at runtime.
/// </summary>
internal static class OpenApiStandardProblemDetailsMutator
{
    private static readonly string[] StandardErrorStatusCodes =
    [
        "400",
        "401",
        "403",
        "404",
        "409",
        "422",
        "429",
        "500",
        "503"
    ];

    internal static void ApplyToOperation(OpenApiOperation operation)
    {
        operation.Responses ??= new OpenApiResponses();

        foreach (string statusCode in StandardErrorStatusCodes)
            EnsureProblemDetailsResponse(operation.Responses, statusCode);
    }

    private static void EnsureProblemDetailsResponse(OpenApiResponses responses, string statusCode)
    {
        if (!responses.TryGetValue(statusCode, out IOpenApiResponse? existing))
        {
            responses[statusCode] = CreateProblemDetailsResponse(statusCode);
            return;
        }

        if (existing is not OpenApiResponse mutable)
            return;

        mutable.Content ??= new Dictionary<string, OpenApiMediaType>(StringComparer.Ordinal);

        if (!mutable.Content.ContainsKey(ApplicationProblemMapper.ProblemJsonMediaType))
            mutable.Content[ApplicationProblemMapper.ProblemJsonMediaType] = CreateProblemDetailsMediaType();
    }

    private static OpenApiResponse CreateProblemDetailsResponse(string statusCode)
    {
        return new OpenApiResponse
        {
            Description = DescribeStatusCode(statusCode),
            Content = new Dictionary<string, OpenApiMediaType>(StringComparer.Ordinal)
            {
                [ApplicationProblemMapper.ProblemJsonMediaType] = CreateProblemDetailsMediaType()
            }
        };
    }

    private static OpenApiMediaType CreateProblemDetailsMediaType()
    {
        return new OpenApiMediaType
        {
            Schema = new OpenApiSchemaReference("ProblemDetails")
        };
    }

    private static string DescribeStatusCode(string statusCode) =>
        statusCode switch
        {
            "400" => "Bad Request (validation or malformed input).",
            "401" => "Unauthorized.",
            "403" => "Forbidden.",
            "404" => "Not Found.",
            "409" => "Conflict.",
            "422" => "Unprocessable Entity.",
            "429" => "Too Many Requests.",
            "500" => "Internal Server Error.",
            "503" => "Service Unavailable.",
            _ => statusCode
        };
}
