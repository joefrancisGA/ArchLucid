using System.Reflection;

using ArchLucid.Api.Security;
using ArchLucid.Architecture.Tests.DependencyInjection;
using ArchLucid.Core.Scoping;
using ArchLucid.Host.Core.Auth.Services;

using FluentAssertions;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ArchLucid.Architecture.Tests;

/// <summary>TB-304 / ADR 0041: fail-closed scope derivation contracts stay wired.</summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class FailClosedScopeDerivationArchitectureTests
{
    private static readonly string RepoRoot = FindRepoRoot();

    [Fact]
    public void Adr0041_and_defense_in_depth_doc_exist()
    {
        File.Exists(Path.Combine(RepoRoot, "docs", "architecture", "adrs", "0041-fail-closed-scope-derivation.md"))
            .Should()
            .BeTrue();

        string defenseDoc = File.ReadAllText(
            Path.Combine(RepoRoot, "docs", "security", "TENANT_ISOLATION_DEFENSE_IN_DEPTH.md"));

        defenseDoc.Should().Contain("Fail-closed derivation");
        defenseDoc.Should().Contain("AllowUnscopedRoute");
    }

    [Fact]
    public void Http_scope_provider_exposes_resolve_current_scope()
    {
        typeof(HttpScopeContextProvider)
            .GetMethod(nameof(IScopeContextProvider.ResolveCurrentScope), BindingFlags.Public | BindingFlags.Instance)
            .Should()
            .NotBeNull();
    }

    [Fact]
    public void Scope_resolution_guard_middleware_is_registered_in_pipeline()
    {
        string pipeline = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Api", "Startup", "PipelineExtensions.cs"));

        pipeline.Should().Contain("ScopeResolutionGuardMiddleware");
    }

    [Fact]
    public void Production_safety_rules_include_scope_derivation_guard()
    {
        string rules = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Host.Core",
                "Startup",
                "Validation",
                "Rules",
                "ProductionSafetyRules.cs"));

        rules.Should().Contain("CollectScopeDerivationUnsafeInProductionLike");
    }

    [Fact]
    public void Every_allow_anonymous_surface_is_explicitly_allow_unscoped()
    {
        List<string> violations = [];

        foreach (Type controllerType in ApiHostControllerAndHandlerDiscovery.DiscoverControllerTypes())
        {
            bool controllerAnonymous = controllerType.GetCustomAttribute<AllowAnonymousAttribute>() is not null;
            bool controllerAllowUnscoped =
                controllerType.GetCustomAttribute<AllowUnscopedRouteAttribute>() is not null;

            if (controllerAnonymous && !controllerAllowUnscoped)
                violations.Add(controllerType.FullName!);

            foreach (MethodInfo action in controllerType.GetMethods(BindingFlags.Instance | BindingFlags.Public | BindingFlags.DeclaredOnly))
            {
                if (action.GetCustomAttribute<AllowAnonymousAttribute>() is null)
                    continue;

                if (controllerAllowUnscoped || action.GetCustomAttribute<AllowUnscopedRouteAttribute>() is not null)
                    continue;

                violations.Add($"{controllerType.FullName}.{action.Name}");
            }
        }

        violations.Should().BeEmpty(
            because: "anonymous endpoints must carry [AllowUnscopedRoute] on production-like fail-closed hosts");
    }

    [Fact]
    public void Scope_ids_defaults_are_not_used_in_scope_guard_evaluator()
    {
        string guard = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Api", "Security", "ScopeResolutionGuard.cs"));

        guard.Should().Contain(nameof(ScopeIds.IsDevelopmentDefault));
    }

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
