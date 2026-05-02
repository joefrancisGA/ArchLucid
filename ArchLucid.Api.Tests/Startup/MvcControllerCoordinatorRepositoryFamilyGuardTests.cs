using System.Reflection;

using ArchLucid.Api.Controllers.Authority;

using FluentAssertions;

using Microsoft.AspNetCore.Mvc;

namespace ArchLucid.Api.Tests.Startup;

/// <summary>
///     <c>docs/library/V1_SCOPE.md</c> Section 3 (net-new public routes must not extend only the coordinator repository family
///     without a superseding ADR) plus ADR 0021 / ADR 0030 (coordinator interfaces and legacy commit orchestrator removed).
///     Guards MVC <see cref="ControllerBase"/> constructors — the primary ASP.NET Core DI surface — so resurrected
///     coordinator-only ports cannot creep back onto HTTP routes unnoticed.
///
///     <para><b>Omissions.</b> Action parameters annotated with <c>[FromServices]</c> are not scanned.</para>
/// </summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class MvcControllerCoordinatorRepositoryFamilyGuardTests
{
    /// <summary>
    ///     Type simple names retired with ADR 0030 PR A3 or otherwise treated as coordinator-pipeline coupling for HTTP MVC.
    ///     Prefer updating this list and <see cref="ControllersExplicitlyBypassingForbiddenConstructorDependencies" /> together
    ///     with ADR amendments — not silent controller edits.
    /// </summary>
    private static readonly HashSet<string> ForbiddenCoordinatorFamilyTypeNames = new(StringComparer.Ordinal)
    {
        "ArchitectureRunCommitOrchestrator",
        "ICoordinatorDecisionTraceRepository",
        "ICoordinatorGoldenManifestRepository",
        "LegacyRunCommitPathOptions",
        "RunCommitPathSelector",
    };

    /// <summary>
    ///     Absolute escape hatch for a deliberate, ADR-reviewed exception to V1_SCOPE Section 3 only. Entries must cite ADR +
    ///     decision date inline in surrounding comments whenever non-empty — never widen silently.
    /// </summary>
    private static readonly HashSet<string> ControllersExplicitlyBypassingForbiddenConstructorDependencies =
        new(StringComparer.Ordinal);

    [Fact]
    public void ArchLucid_Api_ControllerBase_types_do_not_constructor_inject_retired_coordinator_family()
    {
        Assembly apiAssembly = typeof(RunsController).Assembly;
        List<string> offenders = [];

        foreach (Type type in ExportedConcreteControllerTypes(apiAssembly))
        {
            string? fullName = type.FullName;
            if (fullName is null)
                continue;

            if (ControllersExplicitlyBypassingForbiddenConstructorDependencies.Contains(fullName))
                continue;

            IEnumerable<Type> ctorParameterTypes =
                EnumerateNormalizedConstructorParameterTypes(type);

            foreach (Type parameterType in ctorParameterTypes)
            {
                if (!IsForbiddenCoordinatorFamily(parameterType))
                    continue;

                offenders.Add($"{fullName} -> {DescribeType(parameterType)}");
            }
        }

        offenders.Should().BeEmpty(
            "Controllers must not reintroduce V1_SCOPE Section 3 / ADR 0021 coordinator-repository-family dependencies on MVC routes "
            + $"(ADR 0030 PR A3). Violations:{Environment.NewLine}{string.Join(Environment.NewLine, offenders)}");
    }

    private static IEnumerable<Type> ExportedConcreteControllerTypes(Assembly assembly)
    {
        return assembly
            .GetExportedTypes()
            .Where(t => t is { IsClass: true, IsAbstract: false }
                        && typeof(ControllerBase).IsAssignableFrom(t));
    }

    private static IEnumerable<Type> EnumerateNormalizedConstructorParameterTypes(Type controllerType)
    {
        ConstructorInfo[] ctors = controllerType.GetConstructors(BindingFlags.Instance | BindingFlags.Public);

        foreach (ConstructorInfo ctor in ctors)
        {
            foreach (ParameterInfo parameter in ctor.GetParameters())
            {
                Type normalized = NormalizeParameterType(parameter.ParameterType);

                yield return normalized;
            }
        }
    }

    private static Type NormalizeParameterType(Type parameterType)
    {
        Type t = parameterType;
        Type? nullable = Nullable.GetUnderlyingType(t);

        if (nullable is not null)
            t = nullable;

        return t;
    }

    private static bool IsForbiddenCoordinatorFamily(Type type)
    {
        if (ForbiddenCoordinatorFamilyTypeNames.Contains(type.Name))
            return true;

        if (type.IsGenericType && ForbiddenCoordinatorFamilyTypeNames.Contains(type.GetGenericTypeDefinition().Name))
            return true;

        string? full = type.FullName;

        if (full is not null
            && (full.Contains("ICoordinatorGoldenManifestRepository", StringComparison.Ordinal)
                || full.Contains("ICoordinatorDecisionTraceRepository", StringComparison.Ordinal)))
            return true;

        return false;
    }

    private static string DescribeType(Type type) => type.FullName ?? type.Name;
}
