using System.Diagnostics.CodeAnalysis;

using ArchLucid.Api.ProblemDetails;
using ArchLucid.Core.Configuration;

using Microsoft.Extensions.Options;

namespace ArchLucid.Api.Middleware;

/// <summary>
///     Rejects oversized create-run payloads using <c>Content-Length</c> before the body is read (HTTP 413).
/// </summary>
[ExcludeFromCodeCoverage(
    Justification = "Thin guard unit-tested via LooksLikeArchitectureCreateRun static helpers.")]
public sealed class ContextIngestionMaxPayloadMiddleware(
    RequestDelegate next,
    IOptions<ContextIngestionLimitsOptions> options)
{
    private readonly long _max = Math.Max(options.Value.MaxPayloadBytes, 1);

    public Task InvokeAsync(HttpContext context)
    {
        if (!HttpMethods.IsPost(context.Request.Method))
            return next(context);


        PathString path = context.Request.Path;

        if (!LooksLikeArchitectureCreateRun(path))
            return next(context);


        long? len = context.Request.ContentLength;

        if (len is null or <= 0)
            return next(context);


        if (len <= _max)
            return next(context);


        Microsoft.AspNetCore.Mvc.ProblemDetails problem = new()
        {
            Type = ProblemTypes.RequestPayloadTooLarge,
            Title = "Payload Too Large",
            Status = StatusCodes.Status413PayloadTooLarge,
            Detail =
                $"Request body exceeds the configured architecture request limit ({_max} bytes). Reduce context payload size or adjust ArchLucid:ContextIngestion:MaxPayloadBytes.",
            Instance = path.Value
        };

        ProblemErrorCodes.AttachErrorCode(problem, problem.Type);
        ProblemSupportHints.AttachForProblemType(problem);
        ProblemCorrelation.Attach(problem, context);
        context.Response.StatusCode = problem.Status!.Value;
        context.Response.ContentType = ApplicationProblemMapper.ProblemJsonMediaType;

        return context.Response.WriteAsJsonAsync(problem);
    }

    internal static bool LooksLikeArchitectureCreateRun(PathString path)
    {
        string? p = path.Value;

        if (string.IsNullOrEmpty(p))
            return false;

        return p.Contains("/architecture/request", StringComparison.OrdinalIgnoreCase) || EndsWithVersionedRequests(p.TrimEnd('/'));
    }

    internal static bool EndsWithVersionedRequests(string trimmedNoTrailingSlash)
    {
        if (!trimmedNoTrailingSlash.EndsWith("/requests", StringComparison.OrdinalIgnoreCase))
            return false;

        ReadOnlySpan<char> s = trimmedNoTrailingSlash.AsSpan(
            0,
            trimmedNoTrailingSlash.Length - "/requests".Length);

        int lastSlash = s.LastIndexOf('/');

        if (lastSlash < 0 || lastSlash >= s.Length - 1)
            return false;


        ReadOnlySpan<char> segment = s[(lastSlash + 1)..];

        if (segment.Length < 2 || segment[0] != 'v')

            return false;


        return SegmentHasVersionDigits(segment[1..]);
    }

    private static bool SegmentHasVersionDigits(ReadOnlySpan<char> afterV)
    {
        if (afterV.IsEmpty)

            return false;


        foreach (char c in afterV)
        {
            if (char.IsDigit(c) || c == '.')
                continue;


            return false;
        }

        return true;
    }
}
