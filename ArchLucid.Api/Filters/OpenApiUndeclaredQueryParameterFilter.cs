using ArchLucid.Api.ProblemDetails;
using ArchLucid.Host.Core.ProblemDetails;

using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Abstractions;
using Microsoft.AspNetCore.Mvc.Controllers;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.AspNetCore.Mvc.ModelBinding;

namespace ArchLucid.Api.Filters;

/// <summary>
///     Rejects query parameters that are not declared on the action so OpenAPI additionalProperties checks pass.
/// </summary>
public sealed class OpenApiUndeclaredQueryParameterFilter : IActionFilter
{
    public void OnActionExecuting(ActionExecutingContext context)
    {
        if (context.ActionDescriptor is not ControllerActionDescriptor descriptor)
            return;

        HashSet<string> allowed = new(StringComparer.OrdinalIgnoreCase);

        foreach (ParameterDescriptor parameter in descriptor.Parameters)
        {
            if (parameter.BindingInfo?.BindingSource != BindingSource.Query)
                continue;

            if (!string.IsNullOrWhiteSpace(parameter.Name))
                _ = allowed.Add(parameter.Name);
        }

        foreach (string key in context.HttpContext.Request.Query.Keys)
        {
            if (allowed.Contains(key))
                continue;

            context.Result = new ObjectResult(
                new Microsoft.AspNetCore.Mvc.ProblemDetails
                {
                    Type = ProblemTypes.ValidationFailed,
                    Title = "Bad Request",
                    Status = StatusCodes.Status400BadRequest,
                    Detail = $"Unknown query parameter '{key}'.",
                    Instance = context.HttpContext.Request.Path.Value
                })
            {
                StatusCode = StatusCodes.Status400BadRequest,
                ContentTypes = { ApplicationProblemMapper.ProblemJsonMediaType }
            };

            return;
        }
    }

    public void OnActionExecuted(ActionExecutedContext context)
    {
    }
}
