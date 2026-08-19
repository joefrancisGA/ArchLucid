using ArchLucid.Application.Diffs;
using ArchLucid.Application.Evidence;
using ArchLucid.Application.Identity;
using ArchLucid.Application.Notifications.Email;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Requests;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Identity;
using ArchLucid.Decisioning.Interfaces;

using FluentAssertions;

using Microsoft.Extensions.Options;

using Moq;

namespace ArchLucid.Application.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class ApplicationPackageCoverageBatch3Tests
{
    [Fact]
    public void TrialEmailNormalizer_uppercases_trimmed_email()
    {
        TrialEmailNormalizer.Normalize("  User@Example.com ").Should().Be("USER@EXAMPLE.COM");
    }

    [Fact]
    public void TrialEmailNormalizer_rejects_blank_email()
    {
        Action act = () => TrialEmailNormalizer.Normalize("   ");

        act.Should().Throw<ArgumentException>();
    }

    [Fact]
    public async Task TrialBootstrapEmailVerificationPolicy_allows_when_local_identity_disabled()
    {
        Mock<ITrialIdentityUserRepository> users = new();
        TrialBootstrapEmailVerificationPolicy sut = new(
            Options.Create(new TrialAuthOptions { Modes = [TrialAuthModeConstants.MsaExternalId] }),
            users.Object);

        bool allowed = await sut.CanProvisionTrialForRegisteredEmailAsync("user@example.com", CancellationToken.None);

        allowed.Should().BeTrue();
    }

    [Fact]
    public async Task TrialBootstrapEmailVerificationPolicy_requires_verified_email_when_row_exists()
    {
        Mock<ITrialIdentityUserRepository> users = new();
        users.Setup(u => u.GetByNormalizedEmailAsync("USER@EXAMPLE.COM", It.IsAny<CancellationToken>()))
            .ReturnsAsync(new TrialIdentityUserRecord { EmailVerifiedUtc = null });
        TrialBootstrapEmailVerificationPolicy sut = new(
            Options.Create(new TrialAuthOptions { Modes = [TrialAuthModeConstants.LocalIdentity] }),
            users.Object);

        bool allowed = await sut.CanProvisionTrialForRegisteredEmailAsync("user@example.com", CancellationToken.None);

        allowed.Should().BeFalse();
    }

    [Fact]
    public void MarkdownAgentResultDiffSummaryFormatter_emits_agent_sections()
    {
        MarkdownAgentResultDiffSummaryFormatter sut = new();
        AgentResultDiffResult diff = new()
        {
            LeftRunId = "left",
            RightRunId = "right",
            AgentDeltas =
            [
                new AgentResultDelta
                {
                    AgentType = AgentType.Topology,
                    LeftExists = true,
                    RightExists = true,
                    AddedFindings = ["finding-1"],
                },
            ],
            Warnings = ["warn"],
        };

        string markdown = sut.FormatMarkdown(diff);

        markdown.Should().Contain("Topology");
        markdown.Should().Contain("finding-1");
        markdown.Should().Contain("warn");
    }

    [Fact]
    public void MarkdownManifestDiffSummaryFormatter_emits_summary_sections()
    {
        MarkdownManifestDiffSummaryFormatter sut = new();
        ManifestDiffResult diff = new()
        {
            AddedServices = ["api"],
            RemovedServices = ["legacy"],
            Warnings = ["warning"],
        };

        string markdown = sut.FormatMarkdown(diff);

        markdown.Should().Contain("api");
        markdown.Should().Contain("legacy");
        markdown.Should().Contain("warning");
    }

    [Fact]
    public void TrialLifecycleEmailIntegrationEnvelope_exposes_defaults()
    {
        TrialLifecycleEmailIntegrationEnvelope envelope = new()
        {
            Trigger = TrialLifecycleEmailTrigger.Converted,
            TenantId = Guid.NewGuid(),
            WorkspaceId = Guid.NewGuid(),
            ProjectId = Guid.NewGuid(),
            TargetTier = "Professional",
        };

        envelope.SchemaVersion.Should().Be(1);
        envelope.TargetTier.Should().Be("Professional");
    }

    [Fact]
    public async Task DefaultEvidenceBuilder_builds_stub_package_without_prior_manifest()
    {
        Mock<IUnifiedGoldenManifestReader> reader = new();
        DefaultEvidenceBuilder sut = new(reader.Object);
        ArchitectureRequest request = new()
        {
            RequestId = "req-1",
            SystemName = "Payments",
            Environment = "prod",
            CloudProvider = CloudProvider.Azure,
            Description = new string('b', 20),
        };

        AgentEvidencePackage package = await sut.BuildAsync("run-1", request, CancellationToken.None);

        package.RunId.Should().Be("run-1");
        package.SystemName.Should().Be("Payments");
        package.Policies.Should().NotBeEmpty();
    }
}
