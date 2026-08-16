using ArchLucid.Application.Runs.Finalization;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Requests;
using ArchLucid.Core.Governance.PolicyPacks;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Runs.Finalization;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class FinalizeAssumptionGateEvaluatorTests
{
    [Fact]
    public void GetBlockingReasons_blocks_when_existential_request_assumption_is_unacknowledged()
    {
        ArchitectureRequest request = new()
        {
            Assumptions = ["Recovery RTO is 4 hours for tier-1 workloads"]
        };
        FindingsSnapshot findings = new();

        IReadOnlyList<string> reasons = FinalizeAssumptionGateEvaluator.GetBlockingReasons(request, findings, null);

        reasons.Should().ContainSingle()
            .Which.Should().Contain("existential assumption");
    }

    [Fact]
    public void GetBlockingReasons_allows_when_existential_assumption_is_acknowledged()
    {
        string assumption = "Customer data class includes regulated PHI";
        ArchitectureRequest request = new()
        {
            Assumptions = [assumption]
        };
        FindingsSnapshot findings = new();
        string assumptionId = FinalizeAssumptionGateEvaluator.StableAssumptionIdFromText(assumption);

        IReadOnlyList<string> reasons = FinalizeAssumptionGateEvaluator.GetBlockingReasons(
            request,
            findings,
            new HashSet<string>([assumptionId], StringComparer.Ordinal));

        reasons.Should().BeEmpty();
    }

    [Fact]
    public void GetBlockingReasons_ignores_muted_or_finalize_resolved_findings()
    {
        ArchitectureRequest request = new();
        FindingsSnapshot findings = new()
        {
            Findings = [
                new Finding
                {
                    Title = "Assumption: trust boundary spans public internet",
                    IsMuted = true
                },
                new Finding
                {
                    Title = "Assumption: regulated PII in scope",
                    HumanReviewStatus = FindingHumanReviewStatus.Approved
                }
            ]
        };

        IReadOnlyList<string> reasons = FinalizeAssumptionGateEvaluator.GetBlockingReasons(request, findings, null);

        reasons.Should().BeEmpty();
    }

    [Fact]
    public void StableAssumptionIdFromText_matches_client_fnv1a_shape()
    {
        string id = FinalizeAssumptionGateEvaluator.StableAssumptionIdFromText("Recovery RTO is 4 hours");

        id.Should().StartWith("assumption-");
        id.Length.Should().BeGreaterThan("assumption-".Length);
    }
}
