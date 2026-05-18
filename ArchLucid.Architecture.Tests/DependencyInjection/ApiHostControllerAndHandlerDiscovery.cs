using System.Reflection;

using ArchLucid.Api.Controllers.Authority;

using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

using NetArchTest.Rules;

namespace ArchLucid.Architecture.Tests.DependencyInjection;

/// <summary>
///     NetArchTest discovery for MVC controllers and ASP.NET authentication/authorization handlers in <c>ArchLucid.Api</c>.
/// </summary>
internal static class ApiHostControllerAndHandlerDiscovery
{
    private static readonly Assembly ApiAssembly = typeof(RunsController).Assembly;

    public static IReadOnlyList<Type> DiscoverControllerAndHandlerTypes()
    {
        List<Type> controllers = Types
            .InAssembly(ApiAssembly)
            .That()
            .Inherit(typeof(ControllerBase))
            .And()
            .AreNotAbstract()
            .GetTypes()
            .ToList();

        List<Type> handlerCandidates = Types
            .InAssembly(ApiAssembly)
            .That()
            .HaveNameEndingWith("Handler")
            .GetTypes()
            .ToList();

        List<Type> handlers = handlerCandidates.Where(IsAuthPipelineHandler).ToList();

        return controllers
            .Concat(handlers)
            .Distinct()
            .OrderBy(static type => type.FullName, StringComparer.Ordinal)
            .ToList();
    }

    private static bool IsAuthPipelineHandler(Type type)
    {
        if (type is not { IsClass: true, IsAbstract: false })
            return false;

        if (!type.Name.EndsWith("Handler", StringComparison.Ordinal))
            return false;

        if (InheritsOpenGeneric(type, typeof(AuthenticationHandler<>)))
            return true;

        if (InheritsOpenGeneric(type, typeof(AuthorizationHandler<>)))
            return true;

        return typeof(IAuthorizationMiddlewareResultHandler).IsAssignableFrom(type);
    }

    private static bool InheritsOpenGeneric(Type type, Type openGenericDefinition)
    {
        for (Type? current = type; current is not null; current = current.BaseType)
        {
            if (!current.IsGenericType)
                continue;

            if (current.GetGenericTypeDefinition() == openGenericDefinition)
                return true;
        }

        return false;
    }
}
