using ArchLucid.Application.InfraEvidence.SecureNowArchitect;
using ArchLucid.Contracts.InfraEvidence;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.KnowledgeGraph;
using ArchLucid.Persistence.InfraEvidence;

using FluentAssertions;

namespace ArchLucid.Application.Tests.InfraEvidence;

[Trait("Category", "Unit")]
[Trait("Suite", "Application")]
public sealed class SecureNowHypothesisAnalyzerTests
{
    private static readonly Guid TenantId = Guid.Parse("71000000-0000-4000-8000-000000000001");
    private static readonly Guid WorkspaceId = Guid.Parse("71000000-0000-4000-8000-000000000002");
    private static readonly Guid ProjectId = Guid.Parse("71000000-0000-4000-8000-000000000003");
    private static readonly Guid SnapshotId = Guid.Parse("71000000-0000-4000-8000-000000000004");

    [Fact]
    public void External_reachability_without_public_edge_is_eliminated()
    {
        SecurityEvidencePathRecord path = Path(Guid.Parse("71000000-0000-4000-8000-000000000011"), PathKind.IntendedReachability);
        IReadOnlyList<SecureNowHypothesisResponse> hypotheses = Analyze(
            (path, [Hop(path.PathId, "resource:/app", "resource:/sql", GraphEdgeTypes.ConnectsTo)]));

        hypotheses.Should().ContainSingle(hypothesis =>
            hypothesis.Kind == SecureNowHypothesisAnalyzer.ExternalReachability
            && hypothesis.Status == SecureNowHypothesisAnalyzer.Eliminated);
    }

    [Fact]
    public void Public_reachability_is_open_without_finding_and_concluded_with_finding()
    {
        SecurityEvidencePathRecord path = Path(Guid.Parse("71000000-0000-4000-8000-000000000012"), PathKind.IntendedReachability);
        IReadOnlyList<SecureNowHypothesisResponse> open = Analyze(
            (path, [Hop(
                path.PathId,
                SecureNowArchitectConstants.InternetPublicExposureNodeId,
                "resource:/app",
                GraphEdgeTypes.Exposes)]));

        open.Should().ContainSingle(hypothesis =>
            hypothesis.Kind == SecureNowHypothesisAnalyzer.ExternalReachability
            && hypothesis.Status == SecureNowHypothesisAnalyzer.Open);

        IReadOnlyList<SecureNowHypothesisResponse> concluded = Analyze(
            [
                (path, [Hop(
                    path.PathId,
                    SecureNowArchitectConstants.InternetPublicExposureNodeId,
                    "resource:/app",
                    GraphEdgeTypes.Exposes)]),
            ],
            new Dictionary<Guid, IReadOnlyList<Guid>>
            {
                [path.PathId] = [Guid.Parse("71000000-0000-4000-8000-000000000099")],
            });

        concluded.Should().ContainSingle(hypothesis =>
            hypothesis.Kind == SecureNowHypothesisAnalyzer.ExternalReachability
            && hypothesis.Status == SecureNowHypothesisAnalyzer.Concluded);
    }

    [Fact]
    public void Privilege_without_identity_is_eliminated_and_identity_write_path_stays_open()
    {
        SecurityEvidencePathRecord withoutIdentity = Path(
            Guid.Parse("71000000-0000-4000-8000-000000000013"),
            PathKind.Privilege);
        SecurityEvidencePathRecord withIdentity = Path(
            Guid.Parse("71000000-0000-4000-8000-000000000014"),
            PathKind.Privilege);

        IReadOnlyList<SecureNowHypothesisResponse> hypotheses = Analyze(
            (withoutIdentity, [Hop(withoutIdentity.PathId, "principal:/user", "resource:/sql", GraphEdgeTypes.CanWrite)]),
            (withIdentity,
                [
                    Hop(withIdentity.PathId, "principal:/user", "role:/writer", GraphEdgeTypes.HasRole),
                    Hop(withIdentity.PathId, "role:/writer", "resource:/sql", GraphEdgeTypes.CanWrite),
                ]));

        hypotheses.Should().Contain(hypothesis =>
            hypothesis.CitedPathIds.Contains(withoutIdentity.PathId)
            && hypothesis.Kind == SecureNowHypothesisAnalyzer.PrivilegeEscalation
            && hypothesis.Status == SecureNowHypothesisAnalyzer.Eliminated);
        hypotheses.Should().Contain(hypothesis =>
            hypothesis.CitedPathIds.Contains(withIdentity.PathId)
            && hypothesis.Kind == SecureNowHypothesisAnalyzer.PrivilegeEscalation
            && hypothesis.Status == SecureNowHypothesisAnalyzer.Open);
    }

    [Fact]
    public void Public_sensitive_asset_remains_a_hypothesis_without_data_classification()
    {
        SecurityEvidencePathRecord path = Path(
            Guid.Parse("71000000-0000-4000-8000-000000000015"),
            PathKind.IntendedReachability);

        IReadOnlyList<SecureNowHypothesisResponse> hypotheses = Analyze(
            (path,
                [
                    Hop(
                        path.PathId,
                        SecureNowArchitectConstants.InternetPublicExposureNodeId,
                        "resource:/subscriptions/sub/providers/Microsoft.Storage/storageAccounts/data",
                        GraphEdgeTypes.Exposes),
                ]));

        hypotheses.Should().Contain(hypothesis =>
            hypothesis.Kind == SecureNowHypothesisAnalyzer.SensitiveExposure
            && hypothesis.Status == SecureNowHypothesisAnalyzer.Open
            && hypothesis.PathConfidenceBand == PathConfidenceBand.Confirmed.ToString());
    }

    [Fact]
    public void Shared_dependency_across_two_regionally_separated_dependents_is_common_mode()
    {
        SecurityEvidencePathRecord path = Path(
            Guid.Parse("71000000-0000-4000-8000-000000000016"),
            PathKind.SharedControlBlastRadius);
        string sharedIdentity = "identity:/shared-mi";

        IReadOnlyList<SecureNowHypothesisResponse> hypotheses = Analyze(
            (path,
                [
                    Hop(path.PathId, sharedIdentity, "resource:/region/eastus/app-a", SecureNowArchitectConstants.SharedControlFanOutHopEdgeType),
                    Hop(path.PathId, sharedIdentity, "resource:/region/westus/app-b", SecureNowArchitectConstants.SharedControlFanOutHopEdgeType),
                ]));

        hypotheses.Should().ContainSingle(hypothesis =>
            hypothesis.Kind == SecureNowHypothesisAnalyzer.CommonModeDependency
            && hypothesis.Status == SecureNowHypothesisAnalyzer.Open
            && hypothesis.SharedDependencyNodeId == sharedIdentity
            && hypothesis.SeparationDimension == "Region"
            && hypothesis.DependentResourceIds.Count == 2);
    }

    [Fact]
    public void Distinct_identities_do_not_create_common_mode_dependency()
    {
        SecurityEvidencePathRecord first = Path(
            Guid.Parse("71000000-0000-4000-8000-000000000017"),
            PathKind.SharedControlBlastRadius);
        SecurityEvidencePathRecord second = Path(
            Guid.Parse("71000000-0000-4000-8000-000000000018"),
            PathKind.SharedControlBlastRadius);

        IReadOnlyList<SecureNowHypothesisResponse> hypotheses = Analyze(
            (first,
                [
                    Hop(first.PathId, "identity:/mi-a", "resource:/app-a", SecureNowArchitectConstants.SharedControlFanOutHopEdgeType),
                ]),
            (second,
                [
                    Hop(second.PathId, "identity:/mi-b", "resource:/app-b", SecureNowArchitectConstants.SharedControlFanOutHopEdgeType),
                ]));

        hypotheses.Should().NotContain(hypothesis =>
            hypothesis.Kind == SecureNowHypothesisAnalyzer.CommonModeDependency);
    }

    [Fact]
    public void Missing_shared_dependency_evidence_and_single_dependents_are_silent()
    {
        SecurityEvidencePathRecord missing = Path(
            Guid.Parse("71000000-0000-4000-8000-000000000019"),
            PathKind.SharedControlBlastRadius);
        SecurityEvidencePathRecord single = Path(
            Guid.Parse("71000000-0000-4000-8000-000000000020"),
            PathKind.SharedControlBlastRadius);

        IReadOnlyList<SecureNowHypothesisResponse> hypotheses = Analyze(
            (missing, [Hop(missing.PathId, "identity:/mi", "resource:/app", GraphEdgeTypes.UsesIdentity)]),
            (single,
                [
                    Hop(single.PathId, "identity:/mi", "resource:/app", SecureNowArchitectConstants.SharedControlFanOutHopEdgeType),
                ]));

        hypotheses.Should().NotContain(hypothesis =>
            hypothesis.Kind == SecureNowHypothesisAnalyzer.CommonModeDependency);
    }

    private static IReadOnlyList<SecureNowHypothesisResponse> Analyze(
        params (SecurityEvidencePathRecord Path, IReadOnlyList<SecurityEvidencePathHopRecord> Hops)[] paths) =>
        Analyze(paths, new Dictionary<Guid, IReadOnlyList<Guid>>());

    private static IReadOnlyList<SecureNowHypothesisResponse> Analyze(
        (SecurityEvidencePathRecord Path, IReadOnlyList<SecurityEvidencePathHopRecord> Hops)[] paths,
        IReadOnlyDictionary<Guid, IReadOnlyList<Guid>> findings)
    {
        return SecureNowHypothesisAnalyzer.Analyze(paths, findings);
    }

    private static SecurityEvidencePathRecord Path(Guid pathId, PathKind kind) =>
        new()
        {
            PathId = pathId,
            TenantId = TenantId,
            WorkspaceId = WorkspaceId,
            ProjectId = ProjectId,
            SnapshotId = SnapshotId,
            PathKind = kind,
            PathConfidenceBand = PathConfidenceBand.Confirmed,
            WeakestHopOrdinal = 1,
        };

    private static SecurityEvidencePathHopRecord Hop(
        Guid pathId,
        string from,
        string to,
        string edgeType) =>
        new()
        {
            HopRowId = Guid.NewGuid(),
            PathId = pathId,
            TenantId = TenantId,
            HopOrdinal = 1,
            FromNodeId = from,
            ToNodeId = to,
            EdgeType = edgeType,
            ProvenanceKind = ProvenanceKind.ObservedFact,
            HopConfidenceBand = PathConfidenceBand.Confirmed,
            EvidenceReference = $"test:{pathId:D}:{edgeType}",
        };
}
