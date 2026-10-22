using ArchLucid.Contracts.Architecture;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.Architecture;

[Trait("Category", "Unit")]
public sealed class ArchitectureIdentityDisplayNameDefaultsTests
{
    [Fact]
    public void Resolve_returns_trimmed_candidate_when_present()
    {
        ArchitectureIdentityDisplayNameDefaults.Resolve("  Payments edge  ")
            .Should()
            .Be("Payments edge");
    }

    [Fact]
    public void Resolve_returns_untitled_when_candidate_missing()
    {
        ArchitectureIdentityDisplayNameDefaults.Resolve(null)
            .Should()
            .Be(ArchitectureIdentityDisplayNameDefaults.UntitledArchitecture);

        ArchitectureIdentityDisplayNameDefaults.Resolve("   ")
            .Should()
            .Be(ArchitectureIdentityDisplayNameDefaults.UntitledArchitecture);
    }
}
