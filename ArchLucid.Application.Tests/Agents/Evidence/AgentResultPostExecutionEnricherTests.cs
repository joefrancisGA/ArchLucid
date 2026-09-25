using ArchLucid.Application.Agents.Evidence;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Requests;
using ArchLucid.Core.AgentEvaluation;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Llm;

using FluentAssertions;

using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;

using Moq;

namespace ArchLucid.Application.Tests.Agents.Evidence;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class AgentResultPostExecutionEnricherTests
{
    [Fact]
    public async Task EnrichAsync_skips_curated_evidence_when_findings_are_withheld_by_emission_gate()
    {
        Mock<IAgentCompletionClient> completionClient = new();
        completionClient
            .Setup(client => client.CompleteJsonAsync(
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<int?>(),
                It.IsAny<float?>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(
                """
                {"type":"Policy","title":"Catalog gap policy","description":"Add missing catalog policy.","rationale":"Finding cited a gap."}
                """);

        AgentCuratedEvidenceProposer proposer = new(
            completionClient.Object,
            Options.Create(new AgentCuratedEvidenceProposalOptions { Enabled = true }),
            NullLogger<AgentCuratedEvidenceProposer>.Instance);

        CompositeAgentResultPostExecutionEnricher sut = new(
        [
            new AgentArchitectureFindingEmissionEnricher(),
            new AgentResultPostExecutionEnricher(proposer),
        ]);

        AgentResult result = new()
        {
            AgentType = AgentType.Compliance,
            Findings =
            [
                new ArchitectureFinding
                {
                    Classification = FindingClassification.DecisionGradeFinding,
                    Message = "Prose-only gap should not drive curated evidence",
                },
            ],
        };

        await sut.EnrichAsync(
            "run-1",
            new ArchitectureRequest { RequestId = "req-1", Description = new string('x', 12) },
            new AgentEvidencePackage(),
            [result],
            CancellationToken.None);

        result.ProposedEvidenceJson.Should().BeNull();
        result.Findings.Should().BeEmpty();
        result.WithheldFindings.Should().ContainSingle();
        result.WithheldFindings[0].Reason.Should().Be(WithheldFindingReasons.ProseOnlyEmission);

        completionClient.Verify(
            client => client.CompleteJsonAsync(
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<int?>(),
                It.IsAny<float?>(),
                It.IsAny<CancellationToken>()),
            Times.Never);
    }
}
