using ArchLucid.Application.InfraEvidence.Mermaid;

using FluentAssertions;

namespace ArchLucid.Application.Tests.InfraEvidence;

[Trait("Category", "Unit")]
public sealed class InfraEvidenceMermaidCompletenessModeFilterTests
{
    [Fact]
    public void FilterMissingWarnings_identity_omits_nic_and_subnet_gaps()
    {
        List<string> warnings =
        [
            "Missing NIC subnet ids on hosted list rows.",
            "Missing federated credential metadata.",
        ];

        InfraEvidenceMermaidCompletenessModeFilter
            .FilterMissingWarnings("identity", warnings)
            .Should()
            .Equal("Missing federated credential metadata.");
    }

    [Fact]
    public void FilterMissingWarnings_network_keeps_nic_subnet_gaps()
    {
        List<string> warnings =
        [
            "Missing NIC subnet ids on hosted list rows.",
        ];

        InfraEvidenceMermaidCompletenessModeFilter
            .FilterMissingWarnings("network", warnings)
            .Should()
            .Equal("Missing NIC subnet ids on hosted list rows.");
    }
}
