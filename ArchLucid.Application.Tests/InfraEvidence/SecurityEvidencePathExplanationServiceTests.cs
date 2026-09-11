using ArchLucid.Application.InfraEvidence;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.Core.Llm;
using ArchLucid.Core.Llm.Redaction;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.InfraEvidence;

using FluentAssertions;

using Microsoft.Extensions.Logging.Abstractions;

using Moq;

namespace ArchLucid.Application.Tests.InfraEvidence;

[Trait("Category", "Unit")]
[Trait("Suite", "Application")]
public sealed class SecurityEvidencePathExplanationServiceTests
{
    private static readonly Guid TenantId = Guid.Parse("11111111-1111-1111-1111-111111111111");
    private static readonly Guid WorkspaceId = Guid.Parse("22222222-2222-2222-2222-222222222222");
    private static readonly Guid ProjectId = Guid.Parse("33333333-3333-3333-3333-333333333333");

    [Fact]
    public async Task TryBuildExplanationAsync_insufficient_evidence_skips_by_default()
    {
        Guid pathId = Guid.NewGuid();
        ScopeContext scope = CreateScope();

        InMemoryPathRepository pathRepository = new();
        pathRepository.StoredPaths.Add(CreatePath(pathId, PathConfidenceBand.InsufficientEvidence));
        pathRepository.StoredHops.Add(CreateHop(pathId, 1, "evidence-1"));

        SecurityEvidencePathExplanationService sut = CreateSut(
            pathRepository,
            new CapturingExplanationRepository(),
            Mock.Of<IAgentCompletionClient>(),
            Mock.Of<IPromptRedactor>());

        SecurityEvidencePathExplanationResult result = await sut.TryBuildExplanationAsync(
            scope,
            pathId,
            useSimulator: true,
            allowInsufficientEvidence: false);

        result.Succeeded.Should().BeFalse();
        result.ErrorMessage.Should().Contain("InsufficientEvidence");
    }

    [Fact]
    public async Task TryBuildExplanationAsync_simulator_citations_are_subset_of_hop_evidence_refs()
    {
        Guid pathId = Guid.NewGuid();
        ScopeContext scope = CreateScope();

        InMemoryPathRepository pathRepository = new();
        pathRepository.StoredPaths.Add(CreatePath(pathId, PathConfidenceBand.Possible));
        pathRepository.StoredHops.Add(CreateHop(pathId, 1, "evidence-allowed"));
        pathRepository.StoredHops.Add(CreateHop(pathId, 2, "evidence-allowed-2"));

        CapturingExplanationRepository explanationRepository = new();

        SecurityEvidencePathExplanationService sut = CreateSut(
            pathRepository,
            explanationRepository,
            Mock.Of<IAgentCompletionClient>(),
            Mock.Of<IPromptRedactor>());

        SecurityEvidencePathExplanationResult result = await sut.TryBuildExplanationAsync(
            scope,
            pathId,
            useSimulator: true,
            allowInsufficientEvidence: false);

        result.Succeeded.Should().BeTrue();
        result.Explanation.Should().NotBeNull();
        result.Explanation!.CitedEvidenceRefs.Should().Contain($"path:{pathId:D}");
        result.Explanation.CitedEvidenceRefs.Should().OnlyContain(
            reference => reference == $"path:{pathId:D}"
                || reference == "evidence-allowed"
                || reference == "evidence-allowed-2");
        result.Explanation.SimulatorLabel.Should().Be(SecurityEvidencePathExplanationBuilder.SimulatorLabel);
    }

    [Fact]
    public async Task TryBuildExplanationAsync_llm_path_invokes_redactor()
    {
        Guid pathId = Guid.NewGuid();
        ScopeContext scope = CreateScope();

        InMemoryPathRepository pathRepository = new();
        pathRepository.StoredPaths.Add(CreatePath(pathId, PathConfidenceBand.Probable));
        pathRepository.StoredHops.Add(CreateHop(pathId, 1, "evidence-1"));

        Mock<IAgentCompletionClient> llm = new();
        llm
            .Setup(client => client.CompleteJsonAsync(
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<int?>(),
                It.IsAny<float?>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(
                """
                {
                  "executiveSummary": "Executive summary for cited path.",
                  "businessImpactHypotheses": ["AiInference hypothesis: outage risk if identity hop remains."],
                  "proposedRemediation": {
                    "recommendedChange": "Remove weakest hop control gap.",
                    "recommendedChangeSource": "WeakestHop",
                    "verificationQueries": ["path:hash-absent=abc"],
                    "preconditions": ["Confirm with owners."]
                  },
                  "citedEvidenceRefs": ["evidence-1", "path:00000000-0000-0000-0000-000000000000"]
                }
                """.Replace(
                    "00000000-0000-0000-0000-000000000000",
                    pathId.ToString("D"),
                    StringComparison.Ordinal));

        Mock<IPromptRedactor> redactor = new();
        redactor
            .Setup(item => item.Redact(It.IsAny<string?>()))
            .Returns((string? input) => new PromptRedactionOutcome(input ?? string.Empty, new Dictionary<string, int>()));

        SecurityEvidencePathExplanationService sut = CreateSut(
            pathRepository,
            new CapturingExplanationRepository(),
            llm.Object,
            redactor.Object);

        SecurityEvidencePathExplanationResult result = await sut.TryBuildExplanationAsync(
            scope,
            pathId,
            useSimulator: false,
            allowInsufficientEvidence: false);

        result.Succeeded.Should().BeTrue();
        redactor.Verify(item => item.Redact(It.IsAny<string?>()), Times.Once);
        llm.Verify(
            client => client.CompleteJsonAsync(
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<int?>(),
                It.IsAny<float?>(),
                It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public void TryParseLlmResponse_rejects_unknown_arm_ids()
    {
        const string KnownArm =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/sa1";
        const string UnknownArm =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/unknown";

        HashSet<string> allowedArmIds = new(StringComparer.OrdinalIgnoreCase)
        {
            ArmResourceIdNormalizer.Normalize(KnownArm),
        };

        string llmJson =
            $$"""
              {
                "executiveSummary": "Path reaches {{KnownArm}} and also {{UnknownArm}}.",
                "businessImpactHypotheses": [],
                "proposedRemediation": {
                  "recommendedChange": "Fix exposure",
                  "recommendedChangeSource": "WeakestHop",
                  "verificationQueries": [],
                  "preconditions": []
                },
                "citedEvidenceRefs": ["evidence-1"]
              }
              """;

        bool parsed = SecurityEvidencePathExplanationBuilder.TryParseLlmResponse(
            llmJson,
            ["evidence-1"],
            allowedArmIds,
            out _,
            out string? rejectionReason);

        parsed.Should().BeFalse();
        rejectionReason.Should().Contain("uncited ARM");
    }

    [Fact]
    public void TrySanitizeArmReferences_strips_unknown_arm_ids()
    {
        const string KnownArm =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/sa1";
        const string UnknownArm =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/unknown";

        HashSet<string> allowedArmIds = new(StringComparer.OrdinalIgnoreCase)
        {
            ArmResourceIdNormalizer.Normalize(KnownArm),
        };

        bool clean = SecurityEvidencePathExplanationValidator.TrySanitizeArmReferences(
            $"Route through {KnownArm} and {UnknownArm}",
            allowedArmIds,
            out string sanitizedText,
            out IReadOnlyList<string> removedArmIds);

        clean.Should().BeFalse();
        removedArmIds.Should().ContainSingle(item => item == UnknownArm);
        sanitizedText.Should().Contain(KnownArm);
        sanitizedText.Should().Contain("[uncited-resource]");
        sanitizedText.Should().NotContain(UnknownArm);
    }

    private static SecurityEvidencePathExplanationService CreateSut(
        ISecurityEvidencePathRepository pathRepository,
        ISecurityEvidencePathExplanationRepository explanationRepository,
        IAgentCompletionClient llm,
        IPromptRedactor promptRedactor) =>
        new(
            pathRepository,
            new NoOpCutPointRepository(),
            explanationRepository,
            llm,
            promptRedactor,
            NullLogger<SecurityEvidencePathExplanationService>.Instance);

    private static ScopeContext CreateScope() =>
        new()
        {
            TenantId = TenantId,
            WorkspaceId = WorkspaceId,
            ProjectId = ProjectId,
        };

    private static SecurityEvidencePathRecord CreatePath(Guid pathId, PathConfidenceBand band) =>
        new()
        {
            PathId = pathId,
            TenantId = TenantId,
            WorkspaceId = WorkspaceId,
            ProjectId = ProjectId,
            SnapshotId = Guid.NewGuid(),
            PathKind = PathKind.Privilege,
            PathConfidenceBand = band,
            CanonicalHopHashSha256 = [1, 2, 3],
            WeakestHopOrdinal = 1,
            WeakestHopReason = "Role assignment inferred from tag metadata.",
            CreatedUtc = DateTime.UtcNow,
            UpdatedUtc = DateTime.UtcNow,
        };

    private static SecurityEvidencePathHopRecord CreateHop(Guid pathId, int hopOrdinal, string evidenceReference) =>
        new()
        {
            HopRowId = Guid.NewGuid(),
            PathId = pathId,
            TenantId = TenantId,
            HopOrdinal = hopOrdinal,
            FromNodeId = "Internet",
            ToNodeId = "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/sa1",
            EdgeType = "RoleAssignment",
            ProvenanceKind = ProvenanceKind.DerivedFact,
            HopConfidenceBand = PathConfidenceBand.Possible,
            EvidenceReference = evidenceReference,
        };

    private sealed class CapturingExplanationRepository : ISecurityEvidencePathExplanationRepository
    {
        public SecurityEvidencePathExplanationRecord? LastInserted
        {
            get;
            private set;
        }

        public Task InsertAsync(SecurityEvidencePathExplanationRecord record, CancellationToken cancellationToken = default)
        {
            LastInserted = record;
            return Task.CompletedTask;
        }

        public Task<IReadOnlyList<SecurityEvidencePathExplanationRecord>> ListByPathIdAsync(
            ScopeContext scope,
            Guid pathId,
            CancellationToken cancellationToken = default)
            => Task.FromResult<IReadOnlyList<SecurityEvidencePathExplanationRecord>>([]);
    }

    private sealed class InMemoryPathRepository : ISecurityEvidencePathRepository
    {
        public List<SecurityEvidencePathRecord> StoredPaths { get; } = [];

        public List<SecurityEvidencePathHopRecord> StoredHops { get; } = [];

        public Task<SecurityEvidencePathRecord?> TryGetByIdAsync(
            Guid tenantId,
            Guid pathId,
            CancellationToken cancellationToken = default) =>
            Task.FromResult(StoredPaths.FirstOrDefault(path => path.PathId == pathId && path.TenantId == tenantId));

        public Task<SecurityEvidencePathRecord?> TryGetByCanonicalHashAsync(
            Guid tenantId,
            Guid snapshotId,
            byte[] canonicalHopHashSha256,
            CancellationToken cancellationToken = default) =>
            Task.FromResult<SecurityEvidencePathRecord?>(null);

        public Task<IReadOnlyList<SecurityEvidencePathHopRecord>> ListHopsByPathAsync(
            Guid tenantId,
            Guid pathId,
            CancellationToken cancellationToken = default) =>
            Task.FromResult<IReadOnlyList<SecurityEvidencePathHopRecord>>(
                StoredHops.Where(hop => hop.PathId == pathId && hop.TenantId == tenantId).ToList());

        public Task<SecurityEvidencePathInsertResult> InsertIfNotExistsAsync(
            SecurityEvidencePathRecord pathHeader,
            IReadOnlyList<SecurityEvidencePathHopRecord> hops,
            CancellationToken cancellationToken = default) =>
            throw new NotSupportedException();

        public Task<(IReadOnlyList<SecurityEvidencePathRecord> Items, int TotalCount)> ListPagedAsync(
            Guid tenantId,
            Guid workspaceId,
            Guid projectId,
            SecurityEvidencePathListFilter filter,
            int page,
            int pageSize,
            CancellationToken cancellationToken = default) =>
            throw new NotSupportedException();

        public Task<IReadOnlyList<SecurityEvidencePathRecord>> ListBySnapshotAsync(
            Guid tenantId,
            Guid workspaceId,
            Guid projectId,
            Guid snapshotId,
            CancellationToken cancellationToken = default) =>
            throw new NotSupportedException();
    }

    private sealed class NoOpCutPointRepository : ISecurityEvidenceCutPointRepository
    {
        public Task<IReadOnlyList<SecurityEvidenceCutPointRecord>> ListBySnapshotAsync(
            Guid tenantId,
            Guid workspaceId,
            Guid projectId,
            Guid snapshotId,
            CancellationToken cancellationToken = default) =>
            Task.FromResult<IReadOnlyList<SecurityEvidenceCutPointRecord>>([]);

        public Task<IReadOnlyList<SecurityEvidenceCutPointRecord>> ListByPathIdAsync(
            Guid tenantId,
            Guid pathId,
            CancellationToken cancellationToken = default) =>
            Task.FromResult<IReadOnlyList<SecurityEvidenceCutPointRecord>>([]);

        public Task ReplaceCutPointsForSnapshotAsync(
            Guid tenantId,
            Guid snapshotId,
            IReadOnlyList<SecurityEvidenceCutPointRecord> cutPoints,
            CancellationToken cancellationToken = default) =>
            Task.CompletedTask;
    }
}
