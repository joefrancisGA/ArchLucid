using ArchLucid.Contracts.Findings;
using ArchLucid.Decisioning.DecisionTraces;

using FluentAssertions;

namespace ArchLucid.Decisioning.Tests;

[Trait("Suite", "Core")]
public sealed class RuleAuditTracePromptRefAggregatorTests
{
    [Fact]
    public void FromAcceptedFindings_collects_distinct_prompt_templates()
    {
        FindingsSnapshot snapshot = new()
        {
            FindingsSnapshotId = Guid.NewGuid(),
            Findings =
            [
                new Finding
                {
                    FindingId = "finding-1",
                    PromptTemplateId = "topology-v2",
                    PromptTemplateVersion = "3",
                    EngineType = "Topology",
                },
                new Finding
                {
                    FindingId = "finding-2",
                    PromptTemplateId = "topology-v2",
                    PromptTemplateVersion = "3",
                    EngineType = "Topology",
                },
                new Finding
                {
                    FindingId = "finding-3",
                    PromptTemplateId = "security-v1",
                    PromptTemplateVersion = "1",
                    EngineType = "Security",
                },
            ],
        };

        List<RuleAuditTracePromptRef> refs = RuleAuditTracePromptRefAggregator.FromAcceptedFindings(
            snapshot,
            ["finding-1", "finding-2", "finding-3"]);

        refs.Should().HaveCount(2);
        refs.Should().ContainSingle(reference => reference.TemplateId == "topology-v2");
        refs.Should().ContainSingle(reference => reference.TemplateId == "security-v1");
    }
}
