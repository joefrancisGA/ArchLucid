using ArchLucid.AgentRuntime.Evaluation;
using ArchLucid.Contracts.Agents;

using FluentAssertions;

namespace ArchLucid.AgentRuntime.Tests.Evaluation;

[Trait("Category", "Unit")]
public sealed class AgentEvidenceGroundingIndexTests
{
    [Fact]
    public void Build_includes_evidence_package_cloud_provider_in_full_blob()
    {
        AgentEvidencePackage evidence = new()
        {
            CloudProvider = "Azure-custom-cloud-label",
            Request = new RequestEvidence { Description = "desc" },
        };

        AgentEvidenceGroundingIndex.Index index = AgentEvidenceGroundingIndex.Build(evidence);

        index.FullBlob.Should().Contain("azure-custom-cloud-label");
    }
}
