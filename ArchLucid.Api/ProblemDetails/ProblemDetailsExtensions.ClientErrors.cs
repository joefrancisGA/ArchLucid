using ArchLucid.Application;
using ArchLucid.Contracts.Validation;
using ArchLucid.Host.Core.ProblemDetails;

using Microsoft.AspNetCore.Mvc;

namespace ArchLucid.Api.ProblemDetails;

public static partial class ProblemDetailsExtensions
{
    extension(ControllerBase controller)
    {
        /// <summary>
        ///     Returns 400 Bad Request with a Problem Details body.
        /// </summary>
        public IActionResult BadRequestProblem(string detail,
            string? type = null,
            string? instance = null,
            IReadOnlyDictionary<string, object?>? extensions = null)
        {
            Microsoft.AspNetCore.Mvc.ProblemDetails problem = new()
            {
                Type = type ?? ProblemTypes.BadRequest,
                Title = "Bad Request",
                Status = StatusCodes.Status400BadRequest,
                Detail = detail,
                Instance = instance ?? controller.Request.Path
            };
            ApplyOptionalProblemExtensions(problem, extensions);
            ProblemErrorCodes.AttachErrorCode(problem, problem.Type);
            AttachAudienceSupportHint(problem, controller.HttpContext);
            ProblemCorrelation.Attach(problem, controller.HttpContext);
            return new ObjectResult(problem) { StatusCode = problem.Status, ContentTypes = { ProblemJsonMediaType } };
        }
    }

    /// <summary>
    ///     Returns 404 Not Found with a Problem Details body.
    /// </summary>
    public static IActionResult NotFoundProblem(
        this ControllerBase controller,
        string detail,
        string? type = null,
        string? instance = null,
        IReadOnlyDictionary<string, object?>? extensions = null)
    {
        Microsoft.AspNetCore.Mvc.ProblemDetails problem = new()
        {
            Type = type ?? ProblemTypes.ResourceNotFound,
            Title = "Not Found",
            Status = StatusCodes.Status404NotFound,
            Detail = detail,
            Instance = instance ?? controller.Request.Path
        };
        ApplyOptionalProblemExtensions(problem, extensions);
        ProblemErrorCodes.AttachErrorCode(problem, problem.Type);
        AttachAudienceSupportHint(problem, controller.HttpContext);
        ProblemCorrelation.Attach(problem, controller.HttpContext);
        return new ObjectResult(problem) { StatusCode = problem.Status, ContentTypes = { ProblemJsonMediaType } };
    }

    public static IActionResult ConflictProblem(
        this ControllerBase controller,
        string detail,
        string? type = null,
        string? instance = null,
        IReadOnlyDictionary<string, object?>? extensions = null)
    {
        Microsoft.AspNetCore.Mvc.ProblemDetails problem = new()
        {
            Type = type ?? ProblemTypes.Conflict,
            Title = "Conflict",
            Status = StatusCodes.Status409Conflict,
            Detail = detail,
            Instance = instance ?? controller.Request.Path
        };
        ApplyOptionalProblemExtensions(problem, extensions);
        ProblemErrorCodes.AttachErrorCode(problem, problem.Type);
        AttachAudienceSupportHint(problem, controller.HttpContext);
        ProblemCorrelation.Attach(problem, controller.HttpContext);
        return new ObjectResult(problem) { StatusCode = problem.Status, ContentTypes = { ProblemJsonMediaType } };
    }

    /// <summary>Returns 501 Not Implemented with RFC 9457 Problem Details (optional extension fields for client hints).</summary>
    public static IActionResult NotImplementedProblem(
        this ControllerBase controller,
        string detail,
        string? type = null,
        string? title = null,
        IReadOnlyDictionary<string, object?>? extensions = null)
    {
        Microsoft.AspNetCore.Mvc.ProblemDetails problem = new()
        {
            Type = type ?? ProblemTypes.FeatureNotYetAvailable,
            Title = title ?? "Not Implemented",
            Status = StatusCodes.Status501NotImplemented,
            Detail = detail,
            Instance = controller.Request.Path.Value
        };

        if (extensions is not null)
        {
            foreach (KeyValuePair<string, object?> kv in extensions)
            {

                if (!string.IsNullOrEmpty(kv.Key) && kv.Value is not null)
                    problem.Extensions[kv.Key] = kv.Value;
            }
        }

        ProblemErrorCodes.AttachErrorCode(problem, problem.Type);
        AttachAudienceSupportHint(problem, controller.HttpContext);
        ProblemCorrelation.Attach(problem, controller.HttpContext);
        return new ObjectResult(problem) { StatusCode = problem.Status, ContentTypes = { ProblemJsonMediaType } };
    }

    /// <summary>Returns 400 when the committed golden manifest fails JSON Schema validation.</summary>
    public static IActionResult GoldenManifestSchemaValidationProblem(
        this ControllerBase controller,
        SchemaValidationResult result)
    {
        ArgumentNullException.ThrowIfNull(result);

        Microsoft.AspNetCore.Mvc.ProblemDetails problem = new()
        {
            Type = ProblemTypes.ValidationFailed,
            Title = "Bad Request",
            Status = StatusCodes.Status400BadRequest,
            Detail = result.Errors.Count == 0
                ? "Golden manifest schema validation failed."
                : string.Join(
                    "; ",
                    result.Errors.Count <= 5
                        ? result.Errors
                        : result.Errors.Take(5).Concat([$"(+{result.Errors.Count - 5} more)"])),
            Instance = controller.Request.Path.Value,
            Extensions =
            {
                ["errors"] = result.Errors.ToArray(),
            }
        };

        ProblemErrorCodes.AttachErrorCode(problem, problem.Type);
        AttachAudienceSupportHint(problem, controller.HttpContext);
        ProblemCorrelation.Attach(problem, controller.HttpContext);
        return new ObjectResult(problem) { StatusCode = problem.Status, ContentTypes = { ProblemJsonMediaType } };
    }

    /// <summary>
    ///     Returns 422 Unprocessable Entity with a Problem Details body (e.g. batch replay where every ID failed).
    /// </summary>
    public static IActionResult UnprocessableEntityProblem(
        this ControllerBase controller,
        string detail,
        string? type = null,
        string? instance = null,
        IReadOnlyDictionary<string, object?>? extensions = null)
    {
        Microsoft.AspNetCore.Mvc.ProblemDetails problem = new()
        {
            Type = type ?? ProblemTypes.ValidationFailed,
            Title = "Unprocessable Entity",
            Status = StatusCodes.Status422UnprocessableEntity,
            Detail = detail,
            Instance = instance ?? controller.Request.Path
        };
        ApplyOptionalProblemExtensions(problem, extensions);
        ProblemErrorCodes.AttachErrorCode(problem, problem.Type);
        AttachAudienceSupportHint(problem, controller.HttpContext);
        ProblemCorrelation.Attach(problem, controller.HttpContext);
        return new ObjectResult(problem) { StatusCode = problem.Status, ContentTypes = { ProblemJsonMediaType } };
    }

    /// <summary>
    ///     Returns 413 Payload Too Large with Problem Details (e.g. graph node count exceeds full-response limit).
    /// </summary>
    public static IActionResult PayloadTooLargeProblem(
        this ControllerBase controller,
        string detail,
        string? type = null,
        string? instance = null,
        IReadOnlyDictionary<string, object?>? extensions = null)
    {
        Microsoft.AspNetCore.Mvc.ProblemDetails problem = new()
        {
            Type = type ?? ProblemTypes.GraphTooLargeForFullResponse,
            Title = "Payload Too Large",
            Status = StatusCodes.Status413PayloadTooLarge,
            Detail = detail,
            Instance = instance ?? controller.Request.Path
        };
        ApplyOptionalProblemExtensions(problem, extensions);
        ProblemErrorCodes.AttachErrorCode(problem, problem.Type);
        AttachAudienceSupportHint(problem, controller.HttpContext);
        ProblemCorrelation.Attach(problem, controller.HttpContext);
        return new ObjectResult(problem) { StatusCode = problem.Status, ContentTypes = { ProblemJsonMediaType } };
    }

    /// <summary>
    ///     Converts common InvalidOperationException variants to consistent ProblemDetails.
    /// </summary>
    public static IActionResult InvalidOperationProblem(
        this ControllerBase controller,
        InvalidOperationException exception,
        string badRequestType)
    {
        if (exception is ConflictException)
            return controller.ConflictProblem(exception.Message, ProblemTypes.Conflict);

        string? instance = controller.Request.Path.Value;
        return ApplicationProblemMapper.MapInvalidOperation(
            exception,
            instance,
            badRequestType,
            controller.HttpContext);
    }

    /// <summary>
    ///     Returns 400 Bad Request when bulk evidence upload exceeds the configured file count limit.
    /// </summary>
    public static IActionResult EvidenceBulkUploadLimitProblem(
        this ControllerBase controller,
        int maxAllowed,
        int attempted)
    {
        Microsoft.AspNetCore.Mvc.ProblemDetails problem = new()
        {
            Type = ProblemTypes.EvidenceBulkUploadLimitExceeded,
            Title = "Bad Request",
            Status = StatusCodes.Status400BadRequest,
            Detail = $"Upload exceeds the maximum allowed file count of {maxAllowed}.",
            Instance = controller.Request.Path,
            Extensions =
            {
                ["maxAllowed"] = maxAllowed,
                ["attempted"] = attempted
            }
        };

        ProblemErrorCodes.AttachErrorCode(problem, problem.Type);
        AttachAudienceSupportHint(problem, controller.HttpContext);
        ProblemCorrelation.Attach(problem, controller.HttpContext);
        return new ObjectResult(problem) { StatusCode = problem.Status, ContentTypes = { ProblemJsonMediaType } };
    }
}
