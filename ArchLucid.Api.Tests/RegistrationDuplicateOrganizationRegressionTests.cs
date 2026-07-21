using System.Reflection;
using System.Text.Json;

using FluentAssertions;

using Xunit;

namespace ArchLucid.Api.Tests;

/// <summary>
///     Regression guards for TB-881: duplicate-organization registration must return 409 when the same catalog is used.
/// </summary>
[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class RegistrationDuplicateOrganizationRegressionTests
{
    [Fact]
    public void Api_test_assembly_disables_parallel_test_execution()
    {
        CollectionBehaviorAttribute? behavior = typeof(RegistrationControllerTests).Assembly
            .GetCustomAttribute<CollectionBehaviorAttribute>();

        behavior.Should().NotBeNull();
        behavior!.DisableTestParallelization.Should().BeTrue();
    }

    [Fact]
    public void Xunit_runner_json_disables_parallel_test_collections()
    {
        string runnerPath = Path.Combine(AppContext.BaseDirectory, "xunit.runner.json");
        File.Exists(runnerPath).Should().BeTrue("xunit.runner.json must ship with the test assembly output");

        using JsonDocument document = JsonDocument.Parse(File.ReadAllText(runnerPath));
        JsonElement root = document.RootElement;

        root.GetProperty("parallelizeTestCollections").GetBoolean().Should().BeFalse();
        root.GetProperty("maxParallelThreads").GetInt32().Should().Be(1);
    }

    [Fact]
    public void Registration_controller_tests_use_env_mutation_collection()
    {
        CustomAttributeData? collectionData = typeof(RegistrationControllerTests)
            .CustomAttributes
            .FirstOrDefault(attribute => attribute.AttributeType == typeof(CollectionAttribute));

        collectionData.Should().NotBeNull();
        collectionData!.ConstructorArguments[0].Value.Should().Be("ArchLucidEnvMutation");
    }
}
