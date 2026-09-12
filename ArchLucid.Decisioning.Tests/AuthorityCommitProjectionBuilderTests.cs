using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Common;
using ArchLucid.Core.Manifest;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Decisioning.Manifest;

using FluentAssertions;

using Cm = ArchLucid.Contracts.Manifest;
using DmSec = ArchLucid.Core.Manifest.Sections;

namespace ArchLucid.Decisioning.Tests;
[Trait("Category", "Unit")]

public sealed class AuthorityCommitProjectionBuilderTests
{
    [Fact]
    public async Task Build_projects_topology_services_datastores_and_relationships()
    {
        IAuthorityCommitProjectionBuilder sut = new AuthorityCommitProjectionBuilder();
        ManifestDocument model = new()
        {
            RunId = Guid.NewGuid(),
            ContextSnapshotId = Guid.NewGuid(),
            GraphSnapshotId = Guid.NewGuid(),
            FindingsSnapshotId = Guid.NewGuid(),
            DecisionTraceId = Guid.NewGuid(),
            CreatedUtc = TimeProvider.System.UtcNowDateTime(),
            ManifestHash = "x",
            RuleSetId = "r",
            RuleSetVersion = "1",
            RuleSetHash = "h",
            Metadata = { Version = "v1", Summary = "S", Name = "N" }
        };
        model.Topology.Services.Add(
            new Cm.ManifestService
            {
                ServiceId = "a",
                ServiceName = "Api",
                ServiceType = ServiceType.Api,
                RuntimePlatform = RuntimePlatform.AppService,
            });
        model.Topology.Relationships.Add(
            new Cm.ManifestRelationship
            {
                SourceId = "a",
                TargetId = "b",
                RelationshipType = RelationshipType.ReadsFrom
            });

        Cm.GoldenManifest c = await sut.BuildAsync(
            model,
            new()
            {
                SystemName = "Contoso"
            },
            CancellationToken.None);
        c.Services.Should().HaveCount(1);
        c.Datastores.Should().BeEmpty();
        c.Relationships.Should().HaveCount(1, "ADR 0030 PR A3 — TopologySection.Relationships now round-trips through the authority FK chain");
        c.Relationships[0].SourceId.Should().Be("a");
        c.Relationships[0].TargetId.Should().Be("b");
        c.RunId.Should().Be(model.RunId.ToString("N"), "ADR 0030 PR A3 — RunId projects as no-dashes (N) for API path consistency");
        c.SystemName.Should().Be("Contoso");
    }

    [Fact]
    public async Task Build_projects_diagram_semantics_from_manifest_and_request_actors()
    {
        IAuthorityCommitProjectionBuilder sut = new AuthorityCommitProjectionBuilder();
        ManifestDocument model = new()
        {
            RunId = Guid.NewGuid(),
            ContextSnapshotId = Guid.NewGuid(),
            GraphSnapshotId = Guid.NewGuid(),
            FindingsSnapshotId = Guid.NewGuid(),
            DecisionTraceId = Guid.NewGuid(),
            CreatedUtc = TimeProvider.System.UtcNowDateTime(),
            ManifestHash = "x",
            RuleSetId = "r",
            RuleSetVersion = "1",
            RuleSetHash = "h",
            Metadata = { Version = "v1", Summary = "S", Name = "N" },
        };
        model.Constraints.MandatoryConstraints.Add("EU data residency");
        model.Requirements.Covered.Add(new DmSec.RequirementCoverageItem
        {
            RequirementName = "encryption-at-rest",
            RequirementText = "Encrypt data at rest",
            IsMandatory = true,
            CoverageStatus = "Covered",
        });
        model.Decisions.Add(new ResolvedArchitectureDecision
        {
            DecisionId = "dec-1",
            Title = "Use private endpoints",
            Category = "network",
            SelectedOption = "private-link",
            Rationale = "Prior review",
        });
        model.Security.Controls.Add(new DmSec.SecurityPostureItem
        {
            ControlName = "External trust boundary",
            Status = "stated",
            ControlId = "trust-1",
            Impact = string.Empty,
        });

        Cm.GoldenManifest c = await sut.BuildAsync(
            model,
            new()
            {
                SystemName = "Contoso",
                DraftActors =
                [
                    new ActorDescriptor
                    {
                        Label = "Partner user",
                        Kind = ActorKind.Human,
                        TrustOrigin = TrustOrigin.External,
                        Contract = InteractionContract.Sync,
                    },
                ],
            },
            CancellationToken.None);

        c.DiagramSemantics.Actors.Should().ContainSingle();
        c.DiagramSemantics.TrustBoundaryLabels.Should().Contain("Partner user (External)");
        c.DiagramSemantics.TrustBoundaryLabels.Should().Contain("External trust boundary");
        c.DiagramSemantics.RequirementLabels.Should().Contain("EU data residency");
        c.DiagramSemantics.RequirementLabels.Should().Contain("Encrypt data at rest");
        c.DiagramSemantics.DecisionLabels.Should().ContainSingle(label => label.Contains("Use private endpoints", StringComparison.Ordinal));
    }
}
