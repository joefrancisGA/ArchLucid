using ArchLucid.Application.InfraEvidence.SecureNowQuestionDispositions;
using ArchLucid.ArtifactSynthesis.Compilers;
using ArchLucid.Contracts.Governance;
using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.Persistence.InfraEvidence;

using FluentAssertions;

namespace ArchLucid.Application.Tests.InfraEvidence;

[Trait("Category", "Unit")]
[Trait("Suite", "Application")]
public sealed class SecureNowPackQuestionCandidateBuilderTests
{
    private readonly SecureNowPackQuestionCandidateBuilder builder = new();

    [Fact]
    public void Uhg_pack_assigned_and_questionable_vm_emits_one_pack_row()
    {
        GraphNode vm = Node(
            "avd-vm",
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/avd01-nprod-0",
            "Microsoft.Compute/virtualMachines");
        GraphNode registeredHost = Node(
            "host",
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.DesktopVirtualization/hostPools/pool/sessionHosts/other.contoso.com",
            "Microsoft.DesktopVirtualization/hostPools/sessionHosts");
        GraphSnapshot graph = Snapshot(vm, registeredHost);

        PolicyPackContentDocument content = new()
        {
            ComplianceRuleKeys =
            [
                InventoryDiagramQuestionableAttentionResolver.UhgUnregisteredAvdSessionHostRuleKey,
            ],
        };

        IReadOnlyList<SecureNowPackQuestionCandidate> candidates =
            builder.Build(content, graph, "sub");

        candidates.Should().ContainSingle();
        candidates[0].QuestionKey.Should().Be("uhg-avd-vm-not-in-host-pool@v1");
        candidates[0].QuestionText.Should().Be(
            "Is this virtual machine still a session host that should be registered?");
        candidates[0].AnswerCodes.Should().Equal("Register", "Retire", "NotASessionHost");
        candidates[0].ScopeKind.Should().Be(SecureNowQuestionScopeKind.Resource);
    }

    [Fact]
    public void Uhg_rule_absent_from_effective_content_emits_no_pack_row()
    {
        GraphNode vm = Node(
            "avd-vm",
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/avd01-nprod-0",
            "Microsoft.Compute/virtualMachines");
        GraphNode registeredHost = Node(
            "host",
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.DesktopVirtualization/hostPools/pool/sessionHosts/other.contoso.com",
            "Microsoft.DesktopVirtualization/hostPools/sessionHosts");

        IReadOnlyList<SecureNowPackQuestionCandidate> candidates =
            builder.Build(new PolicyPackContentDocument(), Snapshot(vm, registeredHost), "sub");

        candidates.Should().BeEmpty();
    }

    [Fact]
    public void Must_elicitation_without_resource_id_uses_subscription_scope()
    {
        PolicyPackContentDocument content = new()
        {
            ElicitationQuestions =
            [
                new ElicitationQuestion
                {
                    QuestionKey = "logging",
                    Prompt = "Tenant logging?",
                    Tier = ElicitationQuestionTier.Must,
                    AnswerKind = ElicitationAnswerKind.Text,
                },
            ],
        };

        IReadOnlyList<SecureNowPackQuestionCandidate> candidates =
            builder.Build(content, null, "sub");

        candidates.Should().ContainSingle();
        candidates[0].QuestionKey.Should().Be("logging@v1");
        candidates[0].ScopeKind.Should().Be(SecureNowQuestionScopeKind.Subscription);
        candidates[0].ResourceId.Should().BeEmpty();
    }

    [Fact]
    public void Should_elicitation_is_not_emitted()
    {
        PolicyPackContentDocument content = new()
        {
            ElicitationQuestions =
            [
                new ElicitationQuestion
                {
                    QuestionKey = "logging",
                    Prompt = "Tenant logging?",
                    Tier = ElicitationQuestionTier.Should,
                    AnswerKind = ElicitationAnswerKind.Text,
                },
            ],
        };

        builder.Build(content, null, "sub").Should().BeEmpty();
    }

    [Fact]
    public void Resource_group_prompt_uses_resource_group_scope()
    {
        PolicyPackContentDocument content = new()
        {
            ElicitationQuestions =
            [
                new ElicitationQuestion
                {
                    QuestionKey = "rg-scope",
                    Prompt = "Which resource group owns this workload?",
                    Tier = ElicitationQuestionTier.Must,
                    AnswerKind = ElicitationAnswerKind.Text,
                },
            ],
        };

        IReadOnlyList<SecureNowPackQuestionCandidate> candidates =
            builder.Build(content, null, "sub");

        candidates.Should().ContainSingle();
        candidates[0].ScopeKind.Should().Be(SecureNowQuestionScopeKind.ResourceGroup);
    }

    private static GraphSnapshot Snapshot(params GraphNode[] nodes) => new() { Nodes = [.. nodes] };

    private static GraphNode Node(string nodeId, string armId, string armType) => new()
    {
        NodeId = nodeId,
        Label = nodeId,
        Properties = new Dictionary<string, string>
        {
            ["arm.id"] = armId,
            ["arm.type"] = armType,
        },
    };
}
