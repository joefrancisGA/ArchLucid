using ArchLucid.AgentRuntime.Evaluation;
using ArchLucid.Contracts.Agents;
using ArchLucid.Core.AgentEvaluation;
using ArchLucid.Core.Configuration;

using FluentAssertions;

using Microsoft.Extensions.Options;

namespace ArchLucid.AgentRuntime.Tests.Evaluation;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class AgentResultEvidenceFaithfulnessCheckerTests
{
    private readonly AgentResultEvidenceFaithfulnessChecker _sut = new(
        Options.Create(new AgentFaithfulnessOptions()));

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

    [Fact]
    public void Evaluate_empty_json_object_has_no_checkable_content_and_zero_ratio()
    {
        AgentResultEvidenceFaithfulnessReport report = _sut.Evaluate("{}", new AgentEvidencePackage());

        report.HasCheckableContent.Should().BeFalse();
        report.SupportRatio.Should().Be(0.0);
    }

    [Fact]
    public void Evaluate_single_token_overlap_fails_density_threshold()
    {
        AgentEvidencePackage evidence = new()
        {
            Patterns =
            [
                new PatternEvidence
                {
                    PatternId = "pattern-a",
                    Name = "Pattern A",
                    Summary = "kubernetes cluster nodes",
                }
            ],
        };

        const string json = """
                            {"claims":[{"detail":"kubernetes","evidenceRefs":["pattern-a"]}],"findings":[]}
                            """;

        AgentResultEvidenceFaithfulnessReport report = _sut.Evaluate(json, evidence);

        report.SupportRatio.Should().Be(0.0);
        report.UnsupportedIds.Should().Contain("claim:citation-fidelity");
    }

    [Fact]
    public void Evaluate_two_token_overlap_meets_default_density_threshold()
    {
        AgentEvidencePackage evidence = new()
        {
            Patterns =
            [
                new PatternEvidence
                {
                    PatternId = "pattern-a",
                    Name = "Pattern A",
                    Summary = "kubernetes cluster nodes scheduling",
                }
            ],
        };

        const string json = """
                            {"claims":[{"detail":"kubernetes cluster nodes","evidenceRefs":["pattern-a"]}],"findings":[]}
                            """;

        AgentResultEvidenceFaithfulnessReport report = _sut.Evaluate(json, evidence);

        report.SupportRatio.Should().Be(1.0);
    }

    [Fact]
    public void Evaluate_hallucinated_citation_fails_citation_fidelity_when_package_overlap_exceeds_cited_chunk()
    {
        AgentEvidencePackage evidence = new()
        {
            Patterns =
            [
                new PatternEvidence
                {
                    PatternId = "pattern-a",
                    Name = "Pattern A",
                    Summary = "kubernetes cluster nodes scheduling",
                }
            ],
            ServiceCatalog =
            [
                new ServiceCatalogEvidence
                {
                    ServiceId = "cat-db",
                    ServiceName = "Azure SQL",
                    Category = "Datastore",
                    Summary = "database retention compliance policy encryption governance",
                }
            ],
        };

        const string json = """
                            {"claims":[{"detail":"kubernetes cluster nodes scheduling database retention compliance policy encryption governance","evidenceRefs":["pattern-a"]}],"findings":[]}
                            """;

        AgentResultEvidenceFaithfulnessReport report = _sut.Evaluate(json, evidence);

        report.SupportRatio.Should().Be(0.0);
        report.UnsupportedIds.Should().Contain("claim:citation-fidelity");
    }

    [Fact]
    public void Evaluate_explicit_citation_with_matching_chunk_passes_citation_fidelity()
    {
        AgentEvidencePackage evidence = new()
        {
            Patterns =
            [
                new PatternEvidence
                {
                    PatternId = "pattern-a",
                    Name = "Pattern A",
                    Summary = "kubernetes cluster nodes scheduling policy",
                }
            ],
        };

        const string json = """
                            {"claims":[{"detail":"kubernetes cluster nodes scheduling policy","evidenceRefs":["pattern-a"]}],"findings":[]}
                            """;

        AgentResultEvidenceFaithfulnessReport report = _sut.Evaluate(json, evidence);

        report.SupportRatio.Should().Be(1.0);
        report.UnsupportedIds.Should().NotContain("claim:citation-fidelity");
    }
}
