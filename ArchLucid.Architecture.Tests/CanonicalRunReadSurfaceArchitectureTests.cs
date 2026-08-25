using System.Reflection;

using ArchLucid.Api.Controllers.Authority;
using ArchLucid.Api.Routing;

using FluentAssertions;

using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Routing;

namespace ArchLucid.Architecture.Tests;

/// <summary>
///     REST API redesign: canonical run READ routes live on <see cref="AuthorityReadsController" /> under
///     <c>/v1/runs/*</c>; legacy <see cref="AuthorityQueryController" /> aliases remain marked
///     <see cref="ObsoleteAttribute" />.
/// </summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class CanonicalRunReadSurfaceArchitectureTests
{
    [Fact]
    public void Canonical_run_read_routes_exist_on_consolidated_controllers()
    {
        foreach (RunReadLifecycleRoutes.RunReadRoute route in RunReadLifecycleRoutes.All)
        {
            MethodInfo? canonicalAction =
                FindActionByFullTemplate(typeof(AuthorityReadsController), route.CanonicalTemplate)
                ?? FindActionByFullTemplate(typeof(RunQueryController), route.CanonicalTemplate);

            canonicalAction.Should().NotBeNull(
                $"canonical {route.Operation} route must exist on AuthorityReadsController or RunQueryController");
        }
    }

    [Fact]
    public void Legacy_AuthorityQueryController_scope_list_is_obsolete()
    {
        MethodInfo? listRuns = typeof(AuthorityQueryController)
            .GetMethod(nameof(AuthorityQueryController.ListRunsInScope));

        listRuns.Should().NotBeNull();
        listRuns!.GetCustomAttribute<ObsoleteAttribute>().Should().NotBeNull();
    }

    private static MethodInfo? FindActionByFullTemplate(Type controllerType, string fullTemplate)
    {
        string target = Normalize(fullTemplate);

        return controllerType
            .GetMethods(BindingFlags.Instance | BindingFlags.Public | BindingFlags.DeclaredOnly)
            .FirstOrDefault(action =>
                FullGetTemplates(controllerType, action)
                    .Any(template => string.Equals(Normalize(template), target, StringComparison.OrdinalIgnoreCase)));
    }

    private static List<string> FullGetTemplates(Type controllerType, MethodInfo action)
    {
        string controllerPrefix = controllerType.GetCustomAttribute<RouteAttribute>()?.Template ?? string.Empty;

        return action
            .GetCustomAttributes()
            .OfType<IRouteTemplateProvider>()
            .Where(attribute => attribute is HttpGetAttribute)
            .Select(attribute => CombineTemplate(controllerPrefix, attribute.Template))
            .Where(template => template is not null)
            .Select(template => template!)
            .ToList();
    }

    private static string? CombineTemplate(string controllerPrefix, string? actionTemplate)
    {
        if (actionTemplate is null)
            return null;

        if (actionTemplate.StartsWith('/'))
            return Normalize(actionTemplate);

        if (actionTemplate.Length == 0)
            return Normalize(controllerPrefix);

        return Normalize($"{controllerPrefix}/{actionTemplate}");
    }

    private static string Normalize(string template) => template.Trim().TrimStart('/');
}
