using ArchLucid.AgentRuntime.Evaluation;
using ArchLucid.Contracts.Agents;

using FluentAssertions;

namespace ArchLucid.AgentRuntime.Tests.Evaluation;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class AgentResultEvidenceFaithfulnessCheckerTests
{
    private readonly AgentResultEvidenceFaithfulnessChecker _sut = new();

    [Fact]
    public void Evaluate_all_claims_and_findings_supported_when_refs_overlap_catalog()
    {
        AgentEvidencePackage evidence = new()
        {
            RunId = "r",
            RequestId = "q",
            Policies =
            [
                new PolicyEvidence { PolicyId = "pol-net", Title = "Network isolation", Summary = "Front Door TLS requirement" }
            ],
            ServiceCatalog =
            [
                new ServiceCatalogEvidence
                {
                    ServiceId = "cat-app-service",
                    ServiceName = "Azure App Service",
                    Category = "Compute",
                    Summary = "Hosts web workloads",
                }
            ],
            Patterns =
            [
                new PatternEvidence
                {
                    PatternId = "pattern-front-door",
                    Name = "Front Door edge",
                    Summary = "Edge TLS termination",
                }
            ],
        };

        const string json = """
                            {"claims":[{"detail":"Front Door terminates TLS per pattern-front-door guidance for cat-app-service deployments.","evidenceRefs":["pattern-front-door","cat-app-service"]}],"findings":[{"severity":"Low","category":"Topology","description":"Azure Front Door terminates HTTPS before requests reach App Service compute.","recommendation":"Keep managed rules enabled on Azure Front Door edge profiles annually."}]}
                            """;

        AgentResultEvidenceFaithfulnessReport report = _sut.Evaluate(json, evidence);

        report.SupportRatio.Should().Be(1.0);
    }

    [Fact]
    public void Evaluate_unresolved_evidence_ref_lowers_ratio()
    {
        AgentEvidencePackage evidence = new();

        const string json = """
                            {"claims":[{"detail":"Missing catalog linkage","evidenceRefs":["does-not-exist"]}],"findings":[]}
                            """;

        AgentResultEvidenceFaithfulnessReport report = _sut.Evaluate(json, evidence);

        report.SupportRatio.Should().BeLessThan(1.0);
    }
}
