using System.Reflection;

using ArchLucid.Host.Composition.Startup;

using FluentAssertions;

namespace ArchLucid.Architecture.Tests.CompositionCapability;

/// <summary>OP-05: composition exposes four omit-able capability facades; the root still invokes all of them.</summary>
[Trait("Suite", "Architecture")]
public sealed class CompositionCapabilityRegistrarTests
{
    private static readonly string[] RequiredFacadeMethodNames =
    [
        nameof(ServiceCollectionExtensions.AddPlatformCapability),
        nameof(ServiceCollectionExtensions.AddAuthorityCapability),
        nameof(ServiceCollectionExtensions.AddInfraEvidenceCapability),
        nameof(ServiceCollectionExtensions.AddGovernanceCapability),
    ];

    [Fact]
    [Trait("Category", "Unit")]
    public void Composition_assembly_exposes_all_four_capability_facade_methods()
    {
        MethodInfo[] methods = typeof(ServiceCollectionExtensions)
            .GetMethods(BindingFlags.Public | BindingFlags.Static)
            .Where(static method => RequiredFacadeMethodNames.Contains(method.Name))
            .ToArray();

        methods.Select(static method => method.Name)
            .Should()
            .BeEquivalentTo(RequiredFacadeMethodNames);
    }

    [Fact]
    [Trait("Category", "Unit")]
    public void AddArchLucidApplicationServices_invokes_all_four_capability_facades()
    {
        string source = File.ReadAllText(CompositionCapabilityRegistrarPaths.RootServiceCollectionExtensionsFile);

        foreach (string facadeName in RequiredFacadeMethodNames)
        {
            source.Should().Contain(facadeName, $"AddArchLucidApplicationServices must call {facadeName}");
        }
    }
}
