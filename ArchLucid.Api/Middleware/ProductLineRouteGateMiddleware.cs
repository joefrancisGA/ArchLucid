using ArchLucid.Api.ProblemDetails;
using ArchLucid.Core.ProductCapability;
using ArchLucid.Core.ProductLine;

using Microsoft.AspNetCore.Mvc.Controllers;

namespace ArchLucid.Api.Middleware;

/// <summary>
///     OP-04: when the effective product line is Security-only (or Architecture-only), block controllers mapped to the
///     other exclusive line. Unmapped controllers fail closed with 500 so OP-01 coverage stays authoritative.
/// </summary>
internal sealed class ProductLineRouteGateMiddleware(RequestDelegate next)
{
    public async Task InvokeAsync(
        HttpContext context,
        IProductLineRequestAccessor productLineRequestAccessor,
        IProductCapabilityControllerCatalog capabilityCatalog)
    {
        ArgumentNullException.ThrowIfNull(context);
        ArgumentNullException.ThrowIfNull(productLineRequestAccessor);
        ArgumentNullException.ThrowIfNull(capabilityCatalog);

        if (ProductLineRouteGatePathClassifier.ShouldSkip(context, capabilityCatalog))
        {
            await next(context);

            return;
        }

        Endpoint? endpoint = context.GetEndpoint();

        if (endpoint?.Metadata.GetMetadata<ControllerActionDescriptor>() is not ControllerActionDescriptor actionDescriptor)
        {
            await next(context);

            return;
        }

        string controllerTypeFullName = actionDescriptor.ControllerTypeInfo.FullName
            ?? actionDescriptor.ControllerTypeInfo.Name;

        if (!capabilityCatalog.TryGetControllerProductLine(controllerTypeFullName, out string mapProductLine))
        {
            await WriteProblemAsync(
                context,
                StatusCodes.Status500InternalServerError,
                ProblemTypes.InternalError,
                "Unmapped API controller",
                "This API controller is missing from the product capability map.");

            return;
        }

        EffectiveProductLineKind effectiveProductLine = productLineRequestAccessor.GetEffectiveProductLine();
        ProductLineRouteGateDecision decision = ProductLineRouteGateEvaluator.Evaluate(effectiveProductLine, mapProductLine);

        if (decision == ProductLineRouteGateDecision.Forbidden)
        {
            await WriteProblemAsync(
                context,
                StatusCodes.Status403Forbidden,
                ProblemTypes.Forbidden,
                "Product line cannot use this route",
                "The active product line cannot access this API route.");

            return;
        }

        if (decision == ProductLineRouteGateDecision.UnmappedController)
        {
            await WriteProblemAsync(
                context,
                StatusCodes.Status500InternalServerError,
                ProblemTypes.InternalError,
                "Unmapped API controller",
                "This API controller is missing from the product capability map.");

            return;
        }

        await next(context);
    }

    private static async Task WriteProblemAsync(
        HttpContext context,
        int statusCode,
        string problemType,
        string title,
        string detail)
    {
        Microsoft.AspNetCore.Mvc.ProblemDetails problem = new()
        {
            Type = problemType,
            Title = title,
            Status = statusCode,
            Detail = detail,
            Instance = context.Request.Path.Value,
        };

        ProblemErrorCodes.AttachErrorCode(problem, problemType);
        ProblemSupportHints.AttachForProblemType(problem);
        ProblemCorrelation.Attach(problem, context);

        context.Response.StatusCode = statusCode;
        context.Response.ContentType = ApplicationProblemMapper.ProblemJsonMediaType;
        await context.Response.WriteAsJsonAsync(problem, context.RequestAborted);
    }
}
