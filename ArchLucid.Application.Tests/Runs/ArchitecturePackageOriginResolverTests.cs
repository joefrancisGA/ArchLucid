using ArchLucid.Application.Runs;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Requests;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Runs;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class ArchitecturePackageOriginResolverTests
{
    [Fact]
    public void Resolve_returns_Created_when_workflow_intent_is_create_architecture()
    {
        ArchitectureRequest request = new()
        {
            RequestSource = "draft-intake",
            WorkflowIntent = ArchitectureWorkflowIntent.CreateArchitecture,
        };

        ArchitecturePackageOriginResolver.Resolve(request).Should().Be(ArchitecturePackageOrigin.Created);
    }

    [Fact]
    public void Resolve_returns_Reviewed_for_wizard_and_legacy_draft_intake_without_intent()
    {
        ArchitecturePackageOriginResolver.Resolve(new ArchitectureRequest { RequestSource = "wizard" })
            .Should()
            .Be(ArchitecturePackageOrigin.Reviewed);

        ArchitecturePackageOriginResolver.Resolve(new ArchitectureRequest { RequestSource = "draft-intake" })
            .Should()
            .Be(ArchitecturePackageOrigin.Reviewed);
    }
}
