using System.Reflection;

using ArchLucid.Api.ProblemDetails;
using ArchLucid.Api.Validation;
using ArchLucid.Host.Core.ProblemDetails;

using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Controllers;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.AspNetCore.Mvc.ModelBinding;

namespace ArchLucid.Api.Filters;

/// <summary>
///     Rejects <c>[FromBody]</c> models with null non-nullable collection properties or null entries inside
///     collection properties with HTTP 400
///     <see cref="ProblemTypes.ValidationFailed" /> before controller code runs.
/// </summary>
public sealed class ApiRequestNullCollectionElementsFilter : IAsyncActionFilter
{
    public async Task OnActionExecutionAsync(ActionExecutingContext context, ActionExecutionDelegate next)
    {
        if (context.ActionDescriptor is not Microsoft.AspNetCore.Mvc.Controllers.ControllerActionDescriptor descriptor)
        {
            await next();

            return;
        }

        foreach (Microsoft.AspNetCore.Mvc.Abstractions.ParameterDescriptor parameter in descriptor.Parameters)
        {

            if (parameter.BindingInfo?.BindingSource != BindingSource.Body)
                continue;

            if (!context.ActionArguments.TryGetValue(parameter.Name, out object? body) || body is null)
                continue;

            ParameterInfo? bodyParameter = parameter is ControllerParameterDescriptor controllerParameter
                ? controllerParameter.ParameterInfo
                : null;

            if (ApiRequestNullCollectionElementsGuard.ContainsNullCollectionElement(body, bodyParameter))
            {
                context.Result = ApplicationProblemMapper.CreateProblemResult(
                    StatusCodes.Status400BadRequest,
                    "Bad Request",
                    ApiRequestNullCollectionElementsGuard.ValidationMessage,
                    ProblemTypes.ValidationFailed,
                    context.HttpContext.Request.Path.Value,
                    context.HttpContext);

                return;
            }
        }

        await next();
    }
}
