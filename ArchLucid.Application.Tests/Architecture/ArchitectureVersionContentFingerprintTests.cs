using ArchLucid.Application.Architecture;
using ArchLucid.Application.Runs;
using ArchLucid.Contracts.ArchitectureIntelligence;
using ArchLucid.Contracts.Requests;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Architecture;

[Trait("Category", "Unit")]
public sealed class ArchitectureVersionContentFingerprintTests
{
    [Fact]
    public void ComputeArtifactHash_uses_knowledge_model_when_present()
    {
        ArchitectureRequest request = new()
        {
            RequestId = "req-1",
            Description = "Intake description",
            SystemName = "System",
        };

        ArchitectureKnowledgeModel model = new()
        {
            ModelId = "model-1",
            SchemaVersion = 1,
            Elements = [],
        };

        byte[] requestHash = ArchitectureVersionContentFingerprint.ComputeIntakeRequestHash(request);
        byte[] artifactHash = ArchitectureVersionContentFingerprint.ComputeArtifactHash(request, model);

        artifactHash.Should().NotEqual(requestHash);
    }
}
