using ArchLucid.Core.Configuration;
using ArchLucid.Core.QualityGates;

using FluentAssertions;

namespace ArchLucid.Core.Tests.QualityGates;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class QualityGateDefinitionSnapshotFactoryTests
{
    [Fact]
    public void FromOptions_uses_config_prefix_and_fingerprint_hash()
    {
        AgentOutputQualityGateOptions options = new();
        string hash = QualityGateDefinitionFingerprint.ComputeFromOptions(options);

        QualityGateDefinitionSnapshot snapshot = QualityGateDefinitionSnapshotFactory.FromOptions(options);

        snapshot.DefinitionVersion.Should().Be($"config-{hash[..12]}");
        snapshot.ContentHashSha256.Should().Be(hash);
        snapshot.Mode.Should().Be(AgentOutputQualityGateMode.WarnOnly);
    }
}
