using ArchLucid.Application.InfraEvidence.RemediationPatterns;
using ArchLucid.Contracts.Common;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.InfraEvidence;

using FluentAssertions;

using Microsoft.Extensions.Logging.Abstractions;

namespace ArchLucid.Application.Tests.InfraEvidence;

[Trait("Category", "Unit")]
[Trait("Suite", "Application")]
public sealed class RemediationPatternMatcherServiceTests
{
    private static readonly Guid TenantId = Guid.Parse("11111111-1111-1111-1111-111111111111");
    private static readonly Guid WorkspaceId = Guid.Parse("22222222-2222-2222-2222-222222222222");
    private static readonly Guid ProjectId = Guid.Parse("33333333-3333-3333-3333-333333333333");

    [Fact]
    public async Task MatchFindingAsync_single_candidate_produces_exact_match()
    {
        Guid findingId = Guid.NewGuid();
        Guid patternId = Guid.NewGuid();

        InMemoryOperationalSecurityFindingRepository findingRepository = new();
        findingRepository.Findings.Add(CreateFinding(findingId));

        InMemoryRemediationPatternRepository patternRepository = new();
        patternRepository.ApprovedVersions.Add(CreateApprovedVersion(patternId, "network.nsg-deny"));

        InMemoryRemediationPatternMatchRepository matchRepository = new();
        RemediationPatternMatcherService sut = CreateSut(findingRepository, patternRepository, matchRepository);
        ScopeContext scope = CreateScope();

        RemediationPatternMatchEvaluationResult result = await sut.MatchFindingAsync(scope, findingId);

        result.Succeeded.Should().BeTrue();
        result.MatchKind.Should().Be(RemediationPatternMatchKind.ExactMatch);
        result.PrimaryMatch.Should().NotBeNull();
        result.PrimaryMatch!.ExplainText.Should().Contain("Pattern network.nsg-deny v1.0.0 matched because");
        matchRepository.ActiveMatches.Should().ContainSingle();
    }

    [Fact]
    public async Task MatchFindingAsync_two_exact_matches_produce_conflict()
    {
        Guid findingId = Guid.NewGuid();

        InMemoryOperationalSecurityFindingRepository findingRepository = new();
        findingRepository.Findings.Add(CreateFinding(findingId));

        InMemoryRemediationPatternRepository patternRepository = new();
        patternRepository.ApprovedVersions.Add(CreateApprovedVersion(Guid.NewGuid(), "pattern.a", automation: RemediationAutomationLevel.Manual));
        patternRepository.ApprovedVersions.Add(CreateApprovedVersion(Guid.NewGuid(), "pattern.b", automation: RemediationAutomationLevel.Automated));

        InMemoryRemediationPatternMatchRepository matchRepository = new();
        RemediationPatternMatcherService sut = CreateSut(findingRepository, patternRepository, matchRepository);

        RemediationPatternMatchEvaluationResult result = await sut.MatchFindingAsync(CreateScope(), findingId);

        result.MatchKind.Should().Be(RemediationPatternMatchKind.Conflict);
        result.Conflict.Should().NotBeNull();
        result.Conflict!.ConflictType.Should().Be(RemediationPatternMatchConflictType.ContradictoryStrategy);
        matchRepository.Conflicts.Should().ContainSingle();
    }

    [Fact]
    public void MatchGuard_rejects_ai_exact_match()
    {
        bool allowed = RemediationPatternMatchGuard.TryValidateRecordedMatch(
            RemediationPatternMatchKind.ExactMatch,
            RemediationPatternMatchSource.AIProposed,
            out string? reason);

        allowed.Should().BeFalse();
        reason.Should().Contain("AI-proposed");
    }

    [Fact]
    public async Task TryRecordProposedMatchAsync_allows_ai_possible_match()
    {
        Guid findingId = Guid.NewGuid();
        Guid patternId = Guid.NewGuid();

        InMemoryRemediationPatternRepository patternRepository = new();
        patternRepository.Patterns.Add(new RemediationPatternRecord
        {
            PatternId = patternId,
            TenantId = TenantId,
            PatternKey = "storage.encrypt",
            DisplayName = "Encrypt",
            CreatedByActorKey = "author",
            CreatedUtc = DateTime.UtcNow,
            UpdatedUtc = DateTime.UtcNow,
        });

        patternRepository.Versions.Add(CreateApprovedVersionRecord(patternId, "1.0.0"));

        InMemoryRemediationPatternMatchRepository matchRepository = new();
        RemediationPatternMatcherService sut = CreateSut(new InMemoryOperationalSecurityFindingRepository(), patternRepository, matchRepository);

        RemediationPatternMatchEvaluationResult result = await sut.TryRecordProposedMatchAsync(
            CreateScope(),
            findingId,
            patternId,
            "1.0.0",
            RemediationPatternMatchKind.PossibleMatch,
            RemediationPatternMatchSource.AIProposed,
            "Pattern storage.encrypt v1.0.0 matched because keyword overlap detected.");

        result.Succeeded.Should().BeTrue();
        result.MatchKind.Should().Be(RemediationPatternMatchKind.PossibleMatch);
    }

    private static RemediationPatternMatcherService CreateSut(
        InMemoryOperationalSecurityFindingRepository findingRepository,
        InMemoryRemediationPatternRepository patternRepository,
        InMemoryRemediationPatternMatchRepository matchRepository) =>
        new(findingRepository, patternRepository, matchRepository, NullLogger<RemediationPatternMatcherService>.Instance);

    private static ScopeContext CreateScope() =>
        new() { TenantId = TenantId, WorkspaceId = WorkspaceId, ProjectId = ProjectId };

    private static OperationalSecurityFindingRecord CreateFinding(Guid findingId) =>
        new()
        {
            FindingId = findingId,
            TenantId = TenantId,
            WorkspaceId = WorkspaceId,
            ProjectId = ProjectId,
            Provider = CloudProvider.Azure,
            SourceSystem = "Defender",
            SourceFindingId = "def-001",
            ResourceType = "Microsoft.Network/networkSecurityGroups",
            ControlId = "SC-7",
            Severity = "High",
            Title = "NSG allows inbound",
            FirstObservedUtc = DateTime.UtcNow,
            LastObservedUtc = DateTime.UtcNow,
            Status = OperationalSecurityFindingStatus.Open,
            PayloadHashSha256 = [1],
            CreatedUtc = DateTime.UtcNow,
            UpdatedUtc = DateTime.UtcNow,
        };

    private static RemediationPatternApprovedVersionRecord CreateApprovedVersion(
        Guid patternId,
        string patternKey,
        RemediationAutomationLevel automation = RemediationAutomationLevel.Guided) =>
        new()
        {
            Pattern = new RemediationPatternRecord
            {
                PatternId = patternId,
                TenantId = TenantId,
                PatternKey = patternKey,
                DisplayName = patternKey,
                CreatedByActorKey = "author",
                CreatedUtc = DateTime.UtcNow,
                UpdatedUtc = DateTime.UtcNow,
            },
            Version = CreateApprovedVersionRecord(patternId, "1.0.0", automation),
        };

    private static RemediationPatternVersionRecord CreateApprovedVersionRecord(
        Guid patternId,
        string version,
        RemediationAutomationLevel automation = RemediationAutomationLevel.Guided) =>
        new()
        {
            VersionId = Guid.NewGuid(),
            PatternId = patternId,
            TenantId = TenantId,
            Version = version,
            Status = RemediationPatternStatus.Approved,
            ControlObjective = "Restrict inbound access",
            ContentJson = "{}",
            MatchProvider = CloudProvider.Azure,
            MatchResourceType = "Microsoft.Network/networkSecurityGroups",
            MatchControlId = "SC-7",
            MatchSeverityMin = "Medium",
            AutomationLevel = automation,
            AuthorActorKey = "author",
            ApprovedByActorKey = "approver",
            ApprovedUtc = DateTime.UtcNow,
            CreatedUtc = DateTime.UtcNow,
            UpdatedUtc = DateTime.UtcNow,
        };

    private sealed class InMemoryOperationalSecurityFindingRepository : IOperationalSecurityFindingRepository
    {
        public List<OperationalSecurityFindingRecord> Findings { get; } = [];

        public Task<OperationalSecurityFindingRecord?> TryGetByIdAsync(
            Guid tenantId,
            Guid findingId,
            CancellationToken cancellationToken = default) =>
            Task.FromResult(Findings.FirstOrDefault(row => row.TenantId == tenantId && row.FindingId == findingId));

        public Task<OperationalSecurityFindingRecord?> TryGetByNaturalKeyAsync(
            Guid tenantId,
            CloudProvider provider,
            string sourceSystem,
            string sourceFindingId,
            CancellationToken cancellationToken = default) =>
            Task.FromResult<OperationalSecurityFindingRecord?>(null);

        public Task<IReadOnlyList<OperationalSecurityFindingRecord>> ListByTenantAsync(
            Guid tenantId,
            OperationalSecurityFindingStatus? status,
            CancellationToken cancellationToken = default) =>
            Task.FromResult<IReadOnlyList<OperationalSecurityFindingRecord>>([]);

        public Task<(IReadOnlyList<OperationalSecurityFindingRecord> Items, int TotalCount)> ListByCloudResourceIdPagedAsync(
            Guid tenantId,
            Guid cloudResourceId,
            int page,
            int pageSize,
            CancellationToken cancellationToken = default) =>
            Task.FromResult<(IReadOnlyList<OperationalSecurityFindingRecord> Items, int TotalCount)>(([], 0));

        public Task<IReadOnlyList<OperationalSecurityFindingMetadataRecord>> ListMetadataByFindingAsync(
            Guid tenantId,
            Guid findingId,
            CancellationToken cancellationToken = default) =>
            Task.FromResult<IReadOnlyList<OperationalSecurityFindingMetadataRecord>>([]);

        public Task<IReadOnlyList<OperationalSecurityFindingObservationRecord>> ListObservationsByFindingAsync(
            Guid tenantId,
            Guid findingId,
            CancellationToken cancellationToken = default) =>
            Task.FromResult<IReadOnlyList<OperationalSecurityFindingObservationRecord>>([]);

        public Task InsertAsync(
            OperationalSecurityFindingRecord finding,
            IReadOnlyList<OperationalSecurityFindingMetadataRecord> metadata,
            OperationalSecurityFindingObservationRecord observation,
            CancellationToken cancellationToken = default) =>
            Task.CompletedTask;

        public Task UpdateAsync(
            OperationalSecurityFindingRecord finding,
            IReadOnlyList<OperationalSecurityFindingMetadataRecord> metadata,
            OperationalSecurityFindingObservationRecord? observation,
            CancellationToken cancellationToken = default) =>
            Task.CompletedTask;
    }

    private sealed class InMemoryRemediationPatternRepository : IRemediationPatternRepository
    {
        public List<RemediationPatternRecord> Patterns { get; } = [];

        public List<RemediationPatternVersionRecord> Versions { get; } = [];

        public List<RemediationPatternApprovedVersionRecord> ApprovedVersions { get; } = [];

        public Task<RemediationPatternRecord?> TryGetPatternByIdAsync(Guid tenantId, Guid patternId, CancellationToken cancellationToken = default) =>
            Task.FromResult(Patterns.FirstOrDefault(row => row.TenantId == tenantId && row.PatternId == patternId));

        public Task<RemediationPatternVersionRecord?> TryGetVersionAsync(Guid tenantId, Guid patternId, string version, CancellationToken cancellationToken = default) =>
            Task.FromResult(Versions.FirstOrDefault(row => row.TenantId == tenantId && row.PatternId == patternId && row.Version == version));

        public Task<IReadOnlyList<RemediationPatternApprovedVersionRecord>> ListApprovedVersionsForTenantAsync(Guid tenantId, CancellationToken cancellationToken = default) =>
            Task.FromResult<IReadOnlyList<RemediationPatternApprovedVersionRecord>>(ApprovedVersions.Where(row => row.Pattern.TenantId == tenantId).ToList());

        public Task InsertPatternAsync(RemediationPatternRecord pattern, CancellationToken cancellationToken = default) => Task.CompletedTask;

        public Task InsertVersionAsync(RemediationPatternVersionRecord version, CancellationToken cancellationToken = default) => Task.CompletedTask;

        public Task UpdateVersionAsync(RemediationPatternVersionRecord version, CancellationToken cancellationToken = default) => Task.CompletedTask;

        public Task UpdatePatternAsync(RemediationPatternRecord pattern, CancellationToken cancellationToken = default) => Task.CompletedTask;

        public Task<RemediationPatternRecord?> TryGetPatternByKeyAsync(Guid tenantId, string patternKey, CancellationToken cancellationToken = default) =>
            Task.FromResult<RemediationPatternRecord?>(null);

        public Task<IReadOnlyList<RemediationPatternRecord>> ListPatternsAsync(Guid tenantId, CancellationToken cancellationToken = default) =>
            Task.FromResult<IReadOnlyList<RemediationPatternRecord>>([]);

        public Task<IReadOnlyList<RemediationPatternVersionRecord>> ListVersionsByPatternAsync(Guid tenantId, Guid patternId, CancellationToken cancellationToken = default) =>
            Task.FromResult<IReadOnlyList<RemediationPatternVersionRecord>>([]);
    }

    private sealed class InMemoryRemediationPatternMatchRepository : IRemediationPatternMatchRepository
    {
        public List<RemediationPatternMatchResultRecord> ActiveMatches { get; } = [];

        public List<RemediationPatternMatchConflictRecord> Conflicts { get; } = [];

        public Task DeactivateMatchesForFindingAsync(Guid tenantId, Guid findingId, CancellationToken cancellationToken = default)
        {
            foreach (RemediationPatternMatchResultRecord match in ActiveMatches.Where(row => row.TenantId == tenantId && row.FindingId == findingId))
            {
                ActiveMatches.Remove(match);
            }

            return Task.CompletedTask;
        }

        public Task InsertMatchResultAsync(RemediationPatternMatchResultRecord matchResult, CancellationToken cancellationToken = default)
        {
            if (matchResult.IsActive)
                ActiveMatches.Add(matchResult);

            return Task.CompletedTask;
        }

        public Task InsertConflictAsync(RemediationPatternMatchConflictRecord conflict, CancellationToken cancellationToken = default)
        {
            Conflicts.Add(conflict);
            return Task.CompletedTask;
        }

        public Task<RemediationPatternMatchResultRecord?> TryGetActiveMatchAsync(Guid tenantId, Guid findingId, CancellationToken cancellationToken = default) =>
            Task.FromResult(ActiveMatches.FirstOrDefault(row => row.TenantId == tenantId && row.FindingId == findingId));

        public Task<IReadOnlyList<RemediationPatternMatchResultRecord>> ListByFindingAsync(Guid tenantId, Guid findingId, CancellationToken cancellationToken = default) =>
            Task.FromResult<IReadOnlyList<RemediationPatternMatchResultRecord>>(ActiveMatches.Where(row => row.TenantId == tenantId && row.FindingId == findingId).ToList());

        public Task<IReadOnlyList<RemediationPatternMatchConflictRecord>> ListConflictsByFindingAsync(Guid tenantId, Guid findingId, CancellationToken cancellationToken = default) =>
            Task.FromResult<IReadOnlyList<RemediationPatternMatchConflictRecord>>(Conflicts.Where(row => row.TenantId == tenantId && row.FindingId == findingId).ToList());
    }
}
