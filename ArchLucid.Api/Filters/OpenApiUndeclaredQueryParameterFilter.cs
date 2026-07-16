using System.Reflection;

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

            Type? parameterType = parameter.ParameterType;

            if (parameterType is null || IsSimpleQueryType(parameterType))
                continue;

            foreach (PropertyInfo property in parameterType.GetProperties(BindingFlags.Public | BindingFlags.Instance))
            {
                if (!property.CanRead)
                    continue;

                string propertyName = property.Name;
                FromQueryAttribute? fromQuery = property.GetCustomAttribute<FromQueryAttribute>();

                if (!string.IsNullOrWhiteSpace(fromQuery?.Name))
                    propertyName = fromQuery.Name;

                _ = allowed.Add(propertyName);
            }
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

    private static bool IsSimpleQueryType(Type type)
    {
        Type underlying = Nullable.GetUnderlyingType(type) ?? type;

        return underlying.IsPrimitive
            || underlying == typeof(string)
            || underlying == typeof(decimal)
            || underlying == typeof(Guid)
            || underlying == typeof(DateTime)
            || underlying == typeof(DateTimeOffset)
            || underlying == typeof(TimeSpan)
            || underlying.IsEnum;
    }
}
