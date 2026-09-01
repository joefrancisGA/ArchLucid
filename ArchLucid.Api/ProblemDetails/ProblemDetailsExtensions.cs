using ArchLucid.Application;
using ArchLucid.Host.Core.ProblemDetails;

using Microsoft.AspNetCore.Mvc;

namespace ArchLucid.Api.ProblemDetails;

/// <summary>
///     Extension methods for returning RFC 9457 Problem Details from controllers (obsoletes RFC 7807).
/// </summary>
public static partial class ProblemDetailsExtensions
{
    private const string ProblemJsonMediaType = ApplicationProblemMapper.ProblemJsonMediaType;

    private static void AttachAudienceSupportHint(Microsoft.AspNetCore.Mvc.ProblemDetails problem, HttpContext httpContext)
    {
        ProblemSupportHints.AttachForProblemType(problem, ProblemDetailsAudienceHttpContext.Resolve(httpContext));
    }

    private static void ApplyOptionalProblemExtensions(
        Microsoft.AspNetCore.Mvc.ProblemDetails problem,
        IReadOnlyDictionary<string, object?>? extensions)
    {
        if (extensions is null || extensions.Count is 0)
            return;

        foreach (KeyValuePair<string, object?> kv in extensions)
        {
            if (!string.IsNullOrEmpty(kv.Key) && kv.Value is not null)
                problem.Extensions[kv.Key] = kv.Value;
        }
    }
}
