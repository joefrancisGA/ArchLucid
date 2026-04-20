using System.Reflection;

using ArchLucid.Contracts.Abstractions.Evolution;
using ArchLucid.Contracts.Metadata;

using FluentAssertions;

using NetArchTest.Rules;

namespace ArchLucid.Architecture.Tests;

/// <summary>
/// Contracts and Contracts.Abstractions are leaf assemblies — they describe the
/// public shape of ArchLucid (DTOs, ports). They must not pull in framework
/// concretes like ASP.NET Core or SqlClient, because doing so couples every
/// downstream consumer to the same framework choices and quietly turns the
/// "shared contracts" library into a hosting decision.
///
/// This test pins that invariant. If you reach for AspNetCore or SqlClient
/// in Contracts*, that is the signal to either move the type to a host
/// assembly or introduce a Contracts.Abstractions port.
/// </summary>
public sealed class ContractsFrameworkIsolationTests
{
    /// <summary>Forbidden framework namespace prefixes for Contracts* assemblies.</summary>
    private static readonly string[] ForbiddenFrameworkNamespaces =
    [
        "Microsoft.AspNetCore",
        "Microsoft.Data.SqlClient",
        "System.Data.SqlClient",
        "Dapper",
        "DbUp",
    ];

    [Fact]
    [Trait("Suite", "Core")]
    [Trait("Category", "Unit")]
    public void Contracts_must_not_reference_AspNetCore_or_data_access_libraries()
    {
        Assembly contracts = typeof(ArchitectureRun).Assembly;

        TestResult result = Types
            .InAssembly(contracts)
            .ShouldNot()
            .HaveDependencyOnAny(ForbiddenFrameworkNamespaces)
            .GetResult();

        result.IsSuccessful.Should().BeTrue(
            because: "ArchLucid.Contracts is a DTO leaf consumed by every host (API, Worker, CLI, Api.Client). Adding AspNetCore or SqlClient here couples every consumer to the same framework. Offending types: {0}",
            FormatFailingTypeNames(result));
    }

    [Fact]
    [Trait("Suite", "Core")]
    [Trait("Category", "Unit")]
    public void ContractsAbstractions_must_not_reference_AspNetCore_or_data_access_libraries()
    {
        Assembly abstractions = typeof(ISimulationEngine).Assembly;

        TestResult result = Types
            .InAssembly(abstractions)
            .ShouldNot()
            .HaveDependencyOnAny(ForbiddenFrameworkNamespaces)
            .GetResult();

        result.IsSuccessful.Should().BeTrue(
            because: "ArchLucid.Contracts.Abstractions defines cross-cutting service ports — concrete framework choices belong on the implementation side. Offending types: {0}",
            FormatFailingTypeNames(result));
    }

    private static string FormatFailingTypeNames(TestResult result)
    {
        IReadOnlyList<string>? names = result.FailingTypeNames;

        if (names is null || names.Count == 0) return "(none reported)";

        return string.Join(", ", names);
    }
}
