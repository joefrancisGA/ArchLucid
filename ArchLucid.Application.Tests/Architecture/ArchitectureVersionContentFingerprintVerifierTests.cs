using ArchLucid.Application.Architecture;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.ArchitectureIntelligence;
using ArchLucid.Contracts.Requests;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Architecture;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class ArchitectureVersionContentFingerprintVerifierTests
{
    [Fact]
    public void GetViolations_reports_kappa_drift_when_commit_knowledge_model_differs_from_intake_pin()
    {
        ArchitectureRequest request = new()
        {
            RequestId = "req-1",
            Description = "Intake description",
            SystemName = "GoldenCohort_gc-001",
        };
        ArchitectureKnowledgeModel knowledgeModel = new()
        {
            ModelId = "model-1",
            TenantId = Guid.NewGuid().ToString("D"),
            SchemaVersion = 1,
            Elements =
            [
                new ArchitectureModelElement
                {
                    ElementId = "el-1",
                    Kind = ArchitectureElementKind.Component,
                    Name = "API",
                },
            ],
        };

        ArchitectureVersionRecord version = new()
        {
            ArchitectureVersionId = Guid.NewGuid(),
            ContentHashSha256 = ArchitectureVersionContentFingerprint.ComputeArtifactHash(request, knowledgeModel: null),
        };

        IReadOnlyList<string> violations = ArchitectureVersionContentFingerprintVerifier.GetViolations(
            version,
            request,
            knowledgeModel);

        violations.Should().ContainSingle()
            .Which.Should().Contain("κ drift");
    }

    [Fact]
    public void GetViolations_is_empty_when_pinned_hash_matches_knowledge_model()
    {
        ArchitectureRequest request = new()
        {
            RequestId = "req-1",
            Description = "Intake description",
            SystemName = "GoldenCohort_gc-001",
        };
        ArchitectureKnowledgeModel knowledgeModel = new()
        {
            ModelId = "model-1",
            TenantId = Guid.NewGuid().ToString("D"),
            SchemaVersion = 1,
            Elements =
            [
                new ArchitectureModelElement
                {
                    ElementId = "el-1",
                    Kind = ArchitectureElementKind.Component,
                    Name = "API",
                },
            ],
        };

        ArchitectureVersionRecord version = new()
        {
            ArchitectureVersionId = Guid.NewGuid(),
            ContentHashSha256 = ArchitectureVersionContentFingerprint.ComputeArtifactHash(request, knowledgeModel),
        };

        ArchitectureVersionContentFingerprintVerifier.GetViolations(version, request, knowledgeModel)
            .Should()
            .BeEmpty();
    }
}
