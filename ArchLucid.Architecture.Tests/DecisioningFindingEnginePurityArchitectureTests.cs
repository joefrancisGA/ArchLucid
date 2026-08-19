using System.Reflection;

using ArchLucid.Decisioning.Alerts;
using ArchLucid.Decisioning.Interfaces;

using FluentAssertions;

using NetArchTest.Rules;

namespace ArchLucid.Architecture.Tests;

/// <summary>
///     EK-05: Decisioning <see cref="IFindingEngine"/> implementations stay graph-pure
///     (no Persistence or cloud-extractor package repositories).
/// </summary>
[Trait("Category", "Architecture")]
[Trait("Suite", "Core")]
public sealed class DecisioningFindingEnginePurityArchitectureTests
{
    [Fact]
    public void Decisioning_IFindingEngine_implementations_must_not_depend_on_Persistence_or_extractor_packages()
    {
        Assembly decisioning = typeof(AlertEvaluator).Assembly;

        TestResult result = Types
            .InAssembly(decisioning)
            .That()
            .ImplementInterface(typeof(IFindingEngine))
            .ShouldNot()
            .HaveDependencyOnAny(
                "ArchLucid.Persistence",
                "ArchLucid.Integrations.AzureExtractor",
                "ArchLucid.Integrations.AwsExtractor",
                "ArchLucid.Integrations.GcpExtractor")
            .GetResult();

        result.IsSuccessful.Should().BeTrue(
            because:
            "Decisioning IFindingEngine types must remain graph-pure; effectful inventory engines implement "
            + "IEffectfulFindingEngine in Application. Offending types: {0}",
            ArchitectureConstraintFailureReport.FormatFailingTypeNames(result));
    }
}
