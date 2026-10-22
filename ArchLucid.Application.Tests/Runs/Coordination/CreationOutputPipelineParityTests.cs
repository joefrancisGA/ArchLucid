using ArchLucid.Application.Drafts;
using ArchLucid.Application.Runs.Coordination;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Drafts;
using ArchLucid.Contracts.Requests;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Runs.Coordination;

/// <summary>TB-741: draft-intake creation runs share the same starter agent quad (incl. Critic) as review paths.</summary>
[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class CreationOutputPipelineParityTests
{
    private static readonly AgentType[] ExpectedStarterAgents =
        [AgentType.Topology, AgentType.Cost, AgentType.Compliance, AgentType.Critic];

    [Fact]
    public void BuildStarterTasks_for_draft_intake_request_includes_critic_and_intake_transparency_trail()
    {
        ArchitectureRequest draftIntakeRequest = CreateDraftIntakeRequest();

        List<AgentTask> tasks = BuildTasks(draftIntakeRequest);

        AssertStarterAgentParity(tasks);
        draftIntakeRequest.RequestSource.Should().Be("draft-intake");
        draftIntakeRequest.IntakeTransparencyTrail.Should().NotBeNull();
        draftIntakeRequest.IntakeTransparencyTrail!.Inferred.Should().ContainSingle(i => i.Confidence < 70);
    }

    [Fact]
    public void BuildStarterTasks_for_wizard_review_request_matches_draft_intake_starter_agent_types()
    {
        ArchitectureRequest wizardRequest = CreateWizardReviewRequest();
        ArchitectureRequest draftIntakeRequest = CreateDraftIntakeRequest();

        List<AgentTask> wizardTasks = BuildTasks(wizardRequest);
        List<AgentTask> draftTasks = BuildTasks(draftIntakeRequest);

        wizardTasks.Select(t => t.AgentType).Should().BeEquivalentTo(draftTasks.Select(t => t.AgentType));
        AssertStarterAgentParity(wizardTasks);
    }

    private static ArchitectureRequest CreateDraftIntakeRequest()
    {
        DraftRequestProjector projector = new();
        DraftRequestDocument document = new()
        {
            FreeTextIntent = "Modernize claims intake with governed API boundaries and nightly reconciliation.",
            TransparencyTrail = new TransparencyTrail
            {
                Inferred =
                [
                    new InferredTrailEntry
                    {
                        Key = "integration.pattern",
                        Value = "batch-api",
                        Confidence = 55,
                    },
                ],
            },
        };

        return projector.Project(document, Guid.NewGuid());
    }

    private static ArchitectureRequest CreateWizardReviewRequest() => new()
    {
        Description = "Review an existing Azure retail API with PCI-sensitive payment isolation.",
        SystemName = "RetailApi",
        Environment = "Production",
        CloudProvider = CloudProvider.Azure,
        RequiredCapabilities = ["web", "sql"],
        RequestSource = "wizard",
    };

    private static List<AgentTask> BuildTasks(ArchitectureRequest request)
    {
        EvidenceBundle bundle = RunStarterTaskFactory.BuildEvidenceBundle(request);

        return RunStarterTaskFactory.BuildStarterTasks("run-tb741", bundle, request, []);
    }

    private static void AssertStarterAgentParity(List<AgentTask> tasks)
    {
        tasks.Should().HaveCount(4);
        tasks.Select(t => t.AgentType).Should().BeEquivalentTo(ExpectedStarterAgents);
        tasks.Should().ContainSingle(t => t.AgentType == AgentType.Critic);
    }
}
