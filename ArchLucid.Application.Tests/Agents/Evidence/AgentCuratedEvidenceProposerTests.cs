using ArchLucid.Application.Agents.Evidence;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Findings;
using ArchLucid.Core.AgentEvaluation;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Requests;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Agents.Evidence;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class AgentCuratedEvidenceProposerTests
{
    [Fact]
    public void BuildUserPrompt_tolerates_null_collections_on_result_and_evidence()
    {
        ArchitectureRequest request = new()
        {
            RequestId = "req",
            Description = new string('x', 12),
            SystemName = "Payments",
        };

        AgentEvidencePackage evidence = new()
        {
            Policies = null!,
            Patterns = null!,
            ServiceCatalog = null!,
        };

        AgentResult result = new()
        {
            RunId = "run",
            TaskId = "task",
            AgentType = AgentType.Topology,
            Findings = null!,
            Claims = null!,
            EvidenceRefs = null!,
        };

        string prompt = AgentCuratedEvidenceProposer.BuildUserPrompt("run", request, evidence, result);

        prompt.Should().Contain("RunId: run");
        prompt.Should().Contain("System: Payments");
    }

    [Fact]
    public void BuildUserPrompt_tolerates_null_string_entries_in_claims_and_evidence_refs()
    {
        ArchitectureRequest request = new()
        {
            RequestId = "req",
            Description = new string('x', 12),
            SystemName = "Payments",
        };

        AgentResult result = new()
        {
            RunId = "run",
            TaskId = "task",
            AgentType = AgentType.Topology,
            Claims = [null!, "Encrypt data at rest"],
            EvidenceRefs = [null!, "ref-1"],
        };

        Func<string> act = () =>
            AgentCuratedEvidenceProposer.BuildUserPrompt("run", request, new AgentEvidencePackage(), result);

        act.Should().NotThrow();
        act().Should().Contain("Encrypt data at rest");
        act().Should().Contain("ref-1");
    }

    [Fact]
    public void BuildUserPrompt_skips_null_catalog_entries_when_serializing_existing_catalog()
    {
        ArchitectureRequest request = new()
        {
            RequestId = "req",
            Description = new string('x', 12),
            SystemName = "Payments",
        };

        AgentEvidencePackage evidence = new()
        {
            Policies =
            [
                null!,
                new PolicyEvidence { PolicyId = "p1", Title = "Retention" },
            ],
            Patterns = [null!],
            ServiceCatalog = [null!],
        };

        AgentResult result = new()
        {
            RunId = "run",
            TaskId = "task",
            AgentType = AgentType.Topology,
            Findings = [],
        };

        Func<string> act = () => AgentCuratedEvidenceProposer.BuildUserPrompt("run", request, evidence, result);

        act.Should().NotThrow();
        act().Should().Contain("Retention");
    }

    [Fact]
    public void BuildUserPrompt_skips_null_finding_entries_when_building_typed_summary()
    {
        ArchitectureRequest request = new()
        {
            RequestId = "req",
            Description = new string('x', 12),
            SystemName = "Payments",
        };

        AgentResult result = new()
        {
            RunId = "run",
            TaskId = "task",
            AgentType = AgentType.Topology,
            Findings =
            [
                null!,
                new ArchitectureFinding
                {
                    SourceAgent = AgentType.Topology,
                    FindingId = "finding-typed",
                    Message = "Private endpoint required for storage.",
                    Category = "Network",
                    Severity = FindingSeverity.Warning,
                    EvidenceRefs =
                    [
                        "/subscriptions/00000000-0000-0000-0000-000000000000/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/sa1",
                    ],
                },
            ],
        };

        Func<string> act = () => AgentCuratedEvidenceProposer.BuildUserPrompt("run", request, new AgentEvidencePackage(), result);

        act.Should().NotThrow();
        act().Should().Contain("Private endpoint required for storage.");
    }

    [Fact]
    public void BuildUserPrompt_uses_finding_source_agent_when_envelope_agent_type_missing()
    {
        ArchitectureRequest request = new()
        {
            RequestId = "req",
            Description = new string('x', 12),
            SystemName = "Payments",
        };

        AgentEvidencePackage evidence = new();

        AgentResult result = new()
        {
            RunId = "run",
            TaskId = "task",
            Findings =
            [
                new ArchitectureFinding
                {
                    SourceAgent = AgentType.Topology,
                    FindingId = "finding-typed",
                    Message = "Private endpoint required for storage.",
                    Category = "Network",
                    Severity = FindingSeverity.Warning,
                    EvidenceRefs =
                    [
                        "/subscriptions/00000000-0000-0000-0000-000000000000/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/sa1",
                    ],
                },
            ],
        };

        result.AgentType.Should().Be(default(AgentType));

        string prompt = AgentCuratedEvidenceProposer.BuildUserPrompt("run", request, evidence, result);

        prompt.Should().Contain("AgentType: Topology");
        prompt.Should().NotContain("AgentType: 0");
    }

    [Fact]
    public void NormalizeResponse_returns_null_for_literal_null()
    {
        AgentCuratedEvidenceProposer.NormalizeResponse("null").Should().BeNull();
    }

    [Fact]
    public void NormalizeResponse_returns_null_when_description_is_zero_width_space_only()
    {
        const string json =
            """
            {"type":"Policy","title":"Encrypt SQL TDE","description":"\u200b"}
            """;
        AgentCuratedEvidenceProposer.NormalizeResponse(json).Should().BeNull();
    }

    [Fact]
    public void NormalizeResponse_returns_null_when_title_is_zero_width_space_only()
    {
        const string json =
            """
            {"type":"Policy","title":"\u200b","description":"Require TDE on all SQL databases."}
            """;

        AgentCuratedEvidenceProposer.NormalizeResponse(json).Should().BeNull();
    }

    [Fact]
    public void NormalizeResponse_returns_null_when_type_is_null()
    {
        const string json =
            """
            {"type":null,"title":"Encrypt SQL TDE","description":"Require TDE on all SQL databases."}
            """;

        AgentCuratedEvidenceProposer.NormalizeResponse(json).Should().BeNull();
    }

    [Fact]
    public void NormalizeResponse_returns_null_when_description_is_missing()
    {
        const string json =
            """
            {"type":"Policy","title":"Encrypt SQL TDE","rationale":"Findings cited missing encryption."}
            """;

        AgentCuratedEvidenceProposer.NormalizeResponse(json).Should().BeNull();
    }

    [Fact]
    public void NormalizeResponse_returns_null_when_description_is_invisible_unicode_only()
    {
        const string json =
            """
            {"type":"Policy","title":"Encrypt SQL TDE","description":"\u200b","rationale":"Findings cited missing encryption."}
            """;

        AgentCuratedEvidenceProposer.NormalizeResponse(json).Should().BeNull();
    }

    [Fact]
    public void NormalizeResponse_returns_null_when_rationale_is_zero_width_space_only()
    {
        const string json =
            """
            {"type":"Policy","title":"Encrypt SQL TDE","description":"Require TDE on all SQL databases.","rationale":"\u200b"}
            """;

        AgentCuratedEvidenceProposer.NormalizeResponse(json).Should().BeNull();
    }

    [Fact]
    public void NormalizeResponse_trims_surrounding_whitespace_on_text_fields()
    {
        const string json =
            """
            {"type":"Policy","title":" Encrypt SQL TDE ","description":" Require TDE. ","rationale":" Findings cited missing encryption. "}
            """;

        string? normalized = AgentCuratedEvidenceProposer.NormalizeResponse(json);

        normalized.Should().NotBeNull();
        normalized.Should().Contain("\"title\":\"Encrypt SQL TDE\"");
        normalized.Should().Contain("\"description\":\"Require TDE.\"");
    }

    [Fact]
    public void NormalizeResponse_parses_valid_policy_proposal_when_type_has_surrounding_whitespace()
    {
        const string json =
            """
            {"type":" Policy","title":"Encrypt SQL TDE","description":"Require TDE on all SQL databases.","rationale":"Findings cited missing encryption."}
            """;

        string? normalized = AgentCuratedEvidenceProposer.NormalizeResponse(json);

        normalized.Should().NotBeNull();
        normalized.Should().Contain("\"type\":\"Policy\"");
    }

    [Fact]
    public void NormalizeResponse_parses_valid_policy_proposal()
    {
        const string json =
            """
            {"type":"Policy","title":"Encrypt SQL TDE","description":"Require TDE on all SQL databases.","rationale":"Findings cited missing encryption."}
            """;

        string? normalized = AgentCuratedEvidenceProposer.NormalizeResponse(json);

        normalized.Should().NotBeNull();
        normalized.Should().Contain("Encrypt SQL TDE");
    }
}
