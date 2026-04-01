using System.Reflection;

using ArchiForge.Core.Diagnostics;

using FluentAssertions;

namespace ArchiForge.Api.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class BuildProvenanceTests
{
    [Fact]
    public void FromAssembly_returns_non_empty_versions_for_api_host()
    {
        Assembly api = typeof(ArchiForge.Api.Program).Assembly;

        BuildProvenance provenance = BuildProvenance.FromAssembly(api);

        provenance.InformationalVersion.Should().NotBeNullOrWhiteSpace();
        provenance.AssemblyVersion.Should().NotBeNullOrWhiteSpace();
        provenance.RuntimeFrameworkDescription.Should().Contain(".NET");
    }
}
