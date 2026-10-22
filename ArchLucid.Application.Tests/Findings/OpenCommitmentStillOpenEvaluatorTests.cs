using ArchLucid.Application.Findings;
using ArchLucid.Core.Findings;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Findings;

[Trait("Suite", "Application")]
public sealed class OpenCommitmentStillOpenEvaluatorTests
{
    [Fact]
    public void IsStillOpen_public_network_theme_when_publicNetworkAccess_enabled()
    {
        Dictionary<string, string> properties = new(StringComparer.Ordinal)
        {
            ["publicNetworkAccess"] = "Enabled",
        };

        OpenCommitmentStillOpenEvaluator.IsStillOpen(
                OpenCommitmentDeclarationTheme.PublicNetworkAccess,
                properties)
            .Should().BeTrue();
    }

    [Fact]
    public void IsStillOpen_public_network_theme_when_private_only()
    {
        Dictionary<string, string> properties = new(StringComparer.Ordinal)
        {
            ["publicNetworkAccess"] = "Disabled",
        };

        OpenCommitmentStillOpenEvaluator.IsStillOpen(
                OpenCommitmentDeclarationTheme.PublicNetworkAccess,
                properties)
            .Should().BeFalse();
    }

    [Fact]
    public void IsStillOpen_https_theme_when_https_only_disabled()
    {
        Dictionary<string, string> properties = new(StringComparer.Ordinal)
        {
            [DeclarationSecurityPropertyLogicalNames.HttpsOnly] = "false",
        };

        OpenCommitmentStillOpenEvaluator.IsStillOpen(
                OpenCommitmentDeclarationTheme.HttpsOnly,
                properties)
            .Should().BeTrue();
    }
}
