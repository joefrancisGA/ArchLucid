using System.Reflection;

using ArchLucid.Application.Runs.Orchestration;
using ArchLucid.Host.Composition.Orchestration;

using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>
///     TB-922 — keep the dormant DTF forwarding seam discoverable so a future cutover cannot delete it silently.
/// </summary>
[Trait("Category", "Architecture")]
[Trait("Suite", "Core")]
public sealed class DtfAuthorityRunOrchestratorSeamArchitectureTests
{
    [Fact]
    public void DtfAuthorityRunOrchestrator_type_exists_and_implements_authority_port()
    {
        Type? seamType = typeof(DtfAuthorityRunOrchestrator);

        seamType.Should().NotBeNull();
        seamType.IsClass.Should().BeTrue();
        seamType.IsAbstract.Should().BeFalse();
        typeof(IAuthorityRunOrchestrator).IsAssignableFrom(seamType).Should().BeTrue(
            "SQL hosts register the DTF forwarding adapter as IAuthorityRunOrchestrator (TB-922).");
    }

    [Fact]
    public void DtfAuthorityRunOrchestrator_forwards_to_inner_AuthorityRunOrchestrator()
    {
        ConstructorInfo[] constructors = typeof(DtfAuthorityRunOrchestrator).GetConstructors(BindingFlags.Instance | BindingFlags.Public | BindingFlags.NonPublic);

        constructors.Should().ContainSingle();
        constructors[0].GetParameters().Should().ContainSingle(static parameter =>
            parameter.ParameterType == typeof(AuthorityRunOrchestrator));
    }
}
