using System.Reflection;

using ArchLucid.Api.OpenApi;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Routing;

namespace ArchLucid.Architecture.Tests;

/// <summary>
///     Discovers HTTP controller actions classified as buyer-facing per <see cref="OpenApiAudiencePathClassifier" />.
/// </summary>
internal static class BuyerFacingControllerRouteScanner
{
    internal sealed record BuyerFacingAction(string RelativePath, bool AllowsAnonymous, MethodInfo Method, Type Controller);

    internal static IEnumerable<BuyerFacingAction> Enumerate(Assembly apiAssembly)
    {
        ArgumentNullException.ThrowIfNull(apiAssembly);

        foreach (Type controller in apiAssembly.GetTypes())
        {
            if (!controller.IsClass || controller.IsAbstract || !controller.Name.EndsWith("Controller", StringComparison.Ordinal))
                continue;

            string? controllerRoute = ResolveRouteTemplate(controller);
            bool controllerAnonymous = controller.IsDefined(typeof(AllowAnonymousAttribute), inherit: true);

            foreach (MethodInfo method in controller.GetMethods(BindingFlags.Instance | BindingFlags.Public | BindingFlags.DeclaredOnly))
            {
                IEnumerable<HttpMethodAttribute> httpAttributes =
                    method.GetCustomAttributes(inherit: true).OfType<HttpMethodAttribute>();

                foreach (HttpMethodAttribute httpAttribute in httpAttributes)
                {
                    bool allowsAnonymous = controllerAnonymous
                        || method.IsDefined(typeof(AllowAnonymousAttribute), inherit: true);

                    string relativePath = NormalizeRelativePath(CombineRouteSegments(controllerRoute, httpAttribute.Template));

                    if (!string.Equals(
                            OpenApiAudiencePathClassifier.Classify(relativePath, allowsAnonymous),
                            OpenApiAudience.Buyer,
                            StringComparison.Ordinal))
                        continue;

                    yield return new BuyerFacingAction(relativePath, allowsAnonymous, method, controller);
                }
            }
        }
    }

    private static string? ResolveRouteTemplate(Type type)
    {
        RouteAttribute? route = type.GetCustomAttribute<RouteAttribute>(inherit: true);

        if (route?.Template is not null)
            return route.Template;

        if (type.BaseType is not null && type.BaseType != typeof(object))
            return ResolveRouteTemplate(type.BaseType);

        return null;
    }

    private static string CombineRouteSegments(string? controllerRoute, string? methodRoute)
    {
        if (string.IsNullOrWhiteSpace(controllerRoute))
            return methodRoute ?? string.Empty;

        if (string.IsNullOrWhiteSpace(methodRoute))
            return controllerRoute;

        return $"{controllerRoute.TrimEnd('/')}/{methodRoute.TrimStart('/')}";
    }

    private static string NormalizeRelativePath(string rawPath)
    {
        string path = (rawPath ?? string.Empty).Trim('/');

        path = path.Replace("v{version:apiVersion}", "v1", StringComparison.OrdinalIgnoreCase);
        path = path.Replace("{version:apiVersion}", "1", StringComparison.OrdinalIgnoreCase);

        // OpenAPI relative paths use simple parameter names without route constraints.
        return System.Text.RegularExpressions.Regex.Replace(path, @"\{([^}:]+):[^}]+\}", "{$1}");
    }
}
