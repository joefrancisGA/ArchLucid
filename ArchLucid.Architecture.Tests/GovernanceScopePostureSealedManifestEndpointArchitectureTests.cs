using System.Reflection;
using System.Text.RegularExpressions;

using ArchLucid.Api.Attributes;
using ArchLucid.Api.Http.Governance;

using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class GovernanceScopePostureSealedManifestEndpointArchitectureTests
{
    private static readonly Assembly ApiAssembly = typeof(RequiresGovernanceScopePostureSealedManifestAttribute).Assembly;

    [Fact]
    public void Catalog_matches_requires_attribute_on_api_guarded_actions()
    {
        IReadOnlyList<GovernanceScopePostureSealedManifestEndpointCatalog.Entry> required = GovernanceScopePostureSealedManifestEndpointCatalog.All
            .Where(entry => entry.Classification == GovernanceScopePostureSealedManifestClassification.RequiresLatestCommittedRunSealedAtApi)
            .ToList();

        foreach (GovernanceScopePostureSealedManifestEndpointCatalog.Entry entry in required)
        {
            MethodInfo? method = FindActionMethod(entry.Controller, entry.Action);
            method.Should().NotBeNull($"catalog entry {entry.Controller}.{entry.Action} must resolve to a public action");

            RequiresGovernanceScopePostureSealedManifestAttribute? attribute =
                method!.GetCustomAttribute<RequiresGovernanceScopePostureSealedManifestAttribute>();

            attribute.Should().NotBeNull(
                $"{entry.Controller}.{entry.Action} is cataloged as RequiresLatestCommittedRunSealedAtApi and must carry RequiresGovernanceScopePostureSealedManifest");
        }

        IEnumerable<MethodInfo> attributedActions = ApiAssembly
            .GetTypes()
            .Where(type => type.IsClass && type.Name.EndsWith("Controller", StringComparison.Ordinal))
            .SelectMany(type => type.GetMethods(BindingFlags.Instance | BindingFlags.Public | BindingFlags.DeclaredOnly))
            .Where(method => method.GetCustomAttribute<RequiresGovernanceScopePostureSealedManifestAttribute>() is not null);

        foreach (MethodInfo method in attributedActions)
        {
            string controller = method.DeclaringType!.Name;
            bool cataloged = GovernanceScopePostureSealedManifestEndpointCatalog.All.Any(
                entry => entry.Controller == controller
                    && entry.Action == method.Name
                    && entry.Classification == GovernanceScopePostureSealedManifestClassification.RequiresLatestCommittedRunSealedAtApi);

            cataloged.Should().BeTrue(
                $"{controller}.{method.Name} has RequiresGovernanceScopePostureSealedManifest but is missing from the catalog as RequiresLatestCommittedRunSealedAtApi");
        }
    }

    [Fact]
    public void GetDecisionsNeededSummary_is_cataloged_and_uses_preflight_plus_shared_waiver_row_guard()
    {
        GovernanceScopePostureSealedManifestEndpointCatalog.Entry? entry = GovernanceScopePostureSealedManifestEndpointCatalog.All
            .SingleOrDefault(
                candidate => candidate.Controller == "GovernanceStickinessController"
                    && candidate.Action == "GetDecisionsNeededSummary");

        entry.Should().NotBeNull();
        entry!.Classification.Should().Be(GovernanceScopePostureSealedManifestClassification.RequiresLatestCommittedRunSealedAtApi);
        entry.Rationale.Should().Contain("fail closed", "catalog documents 409 parity with risk-exceptions list");

        string registers = ArchitectureSourceProbe.ReadCsTypeFamily(
            "ArchLucid.Api/Controllers/Governance/GovernanceStickinessController.Registers.cs");
        string sealedGuard = ArchitectureSourceProbe.ReadCsTypeFamily(
            "ArchLucid.Api/Controllers/Governance/GovernanceStickinessController.SealedManifestGuard.cs");
        string exceptions = ArchitectureSourceProbe.ReadCsTypeFamily(
            "ArchLucid.Api/Controllers/Governance/GovernanceStickinessController.Exceptions.cs");

        registers.Should().Contain("GetDecisionsNeededSummary");
        registers.Should().Contain("EnsureRegistersSealedManifestAllowedAsync");
        registers.Should().Contain("EnsureRiskExceptionRecordsSealedManifestAllowedAsync");
        sealedGuard.Should().Contain(
            nameof(GovernanceScopePostureSealedManifestPreflight.TryGetConflictResultAsync),
            "latest committed run guard must use sanctioned preflight");
        exceptions.Should().Contain("EnsureRiskExceptionRecordsSealedManifestAllowedAsync");
    }

    [Fact]
    public void Controllers_do_not_call_scope_posture_guard_outside_preflight()
    {
        string controllersRoot = Path.Combine(ArchitectureSourceProbe.RepoRoot, "ArchLucid.Api", "Controllers");
        string[] controllerSources = Directory
            .GetFiles(controllersRoot, "*.cs", SearchOption.AllDirectories)
            .Where(path => !path.Contains("GovernanceScopePostureSealedManifestPreflight", StringComparison.Ordinal))
            .ToArray();

        Regex directGuard = new(
            @"GovernancePostureSealedManifestHashGuard\.EnsureLatestCommittedRunSealedOrThrowAsync",
            RegexOptions.CultureInvariant);

        Regex legacyWrapper = new(
            @"EnsureGovernance(?:Insights|Scope|Preview|Posture)?ScopeSealedManifestReadAllowedAsync",
            RegexOptions.CultureInvariant);

        foreach (string path in controllerSources)
        {
            string text = File.ReadAllText(path);
            directGuard.IsMatch(text).Should().BeFalse(
                $"{Path.GetRelativePath(ArchitectureSourceProbe.RepoRoot, path)} must not call scope-posture guard directly; use {nameof(GovernanceScopePostureSealedManifestPreflight)}");
            legacyWrapper.IsMatch(text).Should().BeFalse(
                $"{Path.GetRelativePath(ArchitectureSourceProbe.RepoRoot, path)} must not use legacy scope-posture guard wrappers");
        }
    }

    private static MethodInfo? FindActionMethod(string controllerName, string actionName)
    {
        Type? controllerType = ApiAssembly
            .GetTypes()
            .SingleOrDefault(type => type.Name == controllerName);

        if (controllerType is null)
            return null;

        return controllerType.GetMethod(actionName, BindingFlags.Instance | BindingFlags.Public);
    }
}
