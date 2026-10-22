using ArchLucid.Contracts.User;

using FluentAssertions;

using Xunit;

namespace ArchLucid.Contracts.Tests;

[Trait("Category", "Unit")]
public sealed class WorkspaceModeValuesTests
{
    [Fact]
    public void ParseOrDefault_returns_working_when_unset()
    {
        WorkspaceModeValues.ParseOrDefault(null).Should().Be(WorkspaceModeValues.Working);
        WorkspaceModeValues.ParseOrDefault("").Should().Be(WorkspaceModeValues.Working);
        WorkspaceModeValues.ParseOrDefault("unknown").Should().Be(WorkspaceModeValues.Working);
    }

    [Fact]
    public void ParseOrDefault_accepts_working_case_insensitive()
    {
        WorkspaceModeValues.ParseOrDefault("WORKING").Should().Be(WorkspaceModeValues.Working);
    }

    [Fact]
    public void Serialize_normalizes_to_known_mode()
    {
        WorkspaceModeValues.Serialize("working").Should().Be(WorkspaceModeValues.Working);
        WorkspaceModeValues.Serialize("bogus").Should().Be(WorkspaceModeValues.Working);
    }
}
