using System.Reflection;

using ArchLucid.Api.Controllers.Authority;
using ArchLucid.Api.Routing;

using FluentAssertions;

using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Routing;

namespace ArchLucid.Architecture.Tests;

/// <summary>
///     TB-305 / ADR 0042: the run-lifecycle write surface stays collapsed onto one canonical family. Deprecated
///     <c>v1/runs/*</c> / <c>v1/requests</c> aliases were retired once the coordinator strangler migration closed
///     pre-release (<c>docs/architecture/COORDINATOR_STRANGLER_INVENTORY.md</c>); no run-lifecycle write action on
///     <see cref="RunsController" /> may register more than one HTTP route template without an ADR-cited
///     <see cref="RunWriteLifecycleRoutes" /> entry.
/// </summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class CanonicalRunWriteSurfaceArchitectureTests
{
    private static readonly string RepoRoot = FindRepoRoot();

    [Fact]
    public void Adr0064_exists()
    {
        File.Exists(Path.Combine(RepoRoot, "docs", "architecture", "adrs", "0064-buyer-vocabulary-api-and-schema-alignment.md"))
            .Should()
            .BeTrue();
    }

    [Fact]
    public void Adr0042_exists()
    {
        File.Exists(Path.Combine(RepoRoot, "docs", "architecture", "adrs", "0042-canonical-run-write-surface.md"))
            .Should()
            .BeTrue();
    }

    [Fact]
    public void Canonical_run_write_routes_exist_on_one_action_each()
    {
        foreach (RunWriteLifecycleRoutes.RunWriteRoute route in RunWriteLifecycleRoutes.All)
        {
            MethodInfo? canonicalAction = FindActionByFullTemplate(route.CanonicalTemplate);

            canonicalAction.Should().NotBeNull($"canonical {route.Operation} route must exist on RunsController");
        }
    }

    [Fact]
    public void RunsController_write_actions_do_not_add_dual_write_surface()
    {
        List<string> violations = [];

        foreach (MethodInfo action in PublicActions(typeof(RunsController)))
        {
            List<string> templates = FullWriteTemplates(typeof(RunsController), action);

            if (templates.Count <= 1)
                continue;

            violations.Add($"{action.Name}: [{string.Join(", ", templates)}]");
        }

        violations.Should().BeEmpty(
            "a new run-lifecycle dual-write route requires an ADR plus a RunWriteLifecycleRoutes entry (TB-305 / ADR 0042); "
            + $"unregistered multi-verb write actions:{Environment.NewLine}{string.Join(Environment.NewLine, violations)}");
    }

    private static MethodInfo? FindActionByFullTemplate(string fullTemplate)
    {
        string target = Normalize(fullTemplate);

        return PublicActions(typeof(RunsController))
            .FirstOrDefault(action =>
                FullWriteTemplates(typeof(RunsController), action)
                    .Any(template => string.Equals(Normalize(template), target, StringComparison.OrdinalIgnoreCase)));
    }

    private static IEnumerable<MethodInfo> PublicActions(Type controllerType) =>
        controllerType.GetMethods(BindingFlags.Instance | BindingFlags.Public | BindingFlags.DeclaredOnly);

    private static List<string> FullWriteTemplates(Type controllerType, MethodInfo action)
    {
        string controllerPrefix = controllerType.GetCustomAttribute<RouteAttribute>()?.Template ?? string.Empty;

        return action
            .GetCustomAttributes()
            .OfType<IRouteTemplateProvider>()
            .Where(attribute => attribute is HttpPostAttribute or HttpPutAttribute or HttpPatchAttribute or HttpDeleteAttribute)
            .Select(attribute => CombineTemplate(controllerPrefix, attribute.Template))
            .Where(template => template is not null)
            .Select(template => template!)
            .ToList();
    }

    // Absolute action templates (leading '/') ignore the controller prefix; relative ones are prefixed — matching ASP.NET.
    private static string? CombineTemplate(string controllerPrefix, string? actionTemplate)
    {
        if (actionTemplate is null)
            return null;

        if (actionTemplate.StartsWith('/'))
            return Normalize(actionTemplate);

        return Normalize($"{controllerPrefix}/{actionTemplate}");
    }

    private static string Normalize(string template) => template.Trim().TrimStart('/');

    private static string FindRepoRoot()
    {
        DirectoryInfo? dir = new(AppContext.BaseDirectory);

        while (dir is not null)
        {
            if (File.Exists(Path.Combine(dir.FullName, "ArchLucid.sln")))
                return dir.FullName;

            dir = dir.Parent;
        }

        throw new InvalidOperationException("Could not locate repo root (ArchLucid.sln).");
    }
}
