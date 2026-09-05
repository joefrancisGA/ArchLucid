using ArchLucid.Application.InfraEvidence.RemediationPatterns;
using ArchLucid.Contracts.Common;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.InfraEvidence;

using FluentAssertions;

using Microsoft.Extensions.Logging.Abstractions;

namespace ArchLucid.Api.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class RemediationPatternServiceTests
{
    private static readonly Guid TenantId = Guid.Parse("11111111-1111-1111-1111-111111111111");
    private static readonly Guid WorkspaceId = Guid.Parse("22222222-2222-2222-2222-222222222222");
    private static readonly Guid ProjectId = Guid.Parse("33333333-3333-3333-3333-333333333333");

    [Fact]
    public void FactoryGuard_rejects_non_approved_version()
    {
        RemediationPatternVersionRecord draft = CreateVersion(RemediationPatternStatus.Draft);

        bool usable = RemediationPatternFactoryGuard.TryValidateForFactoryUse(draft, out string? reason);

        usable.Should().BeFalse();
        reason.Should().Contain("Approved");
    }

    [Fact]
    public void FactoryGuard_accepts_approved_version()
    {
        RemediationPatternVersionRecord approved = CreateVersion(RemediationPatternStatus.Approved);

        bool usable = RemediationPatternFactoryGuard.TryValidateForFactoryUse(approved, out string? reason);

        usable.Should().BeTrue();
        reason.Should().BeNull();
    }

    [Fact]
    public void Yaml_round_trip_preserves_pattern_key_and_control_objective()
    {
        RemediationPatternDraftRequest original = new()
        {
            PatternKey = "storage.encrypt-at-rest",
            DisplayName = "Encrypt storage at rest",
            Version = "1.0.0",
            Content = new RemediationPatternVersionContent
            {
                ControlObjective = "Ensure storage accounts enforce encryption.",
            },
            MatchCriteria = new RemediationPatternMatchCriteria
            {
                Provider = CloudProvider.Azure,
                ResourceType = "Microsoft.Storage/storageAccounts",
                ControlId = "SC-28",
            },
            AutomationLevel = RemediationAutomationLevel.Guided,
        };

        string yaml = RemediationPatternYamlCodec.SerializeDraftRequest(original);
        RemediationPatternDraftRequest roundTripped = RemediationPatternYamlCodec.DeserializeDraftRequest(yaml);

        roundTripped.PatternKey.Should().Be(original.PatternKey);
        roundTripped.Content.ControlObjective.Should().Be(original.Content.ControlObjective);
        roundTripped.MatchCriteria.ResourceType.Should().Be(original.MatchCriteria.ResourceType);
        roundTripped.AutomationLevel.Should().Be(RemediationAutomationLevel.Guided);
    }

    [Fact]
    public async Task ApproveAsync_blocks_self_approval()
    {
        InMemoryRemediationPatternRepository repository = new();
        RemediationPatternService sut = new(repository, NullLogger<RemediationPatternService>.Instance);
        ScopeContext scope = new() { TenantId = TenantId, WorkspaceId = WorkspaceId, ProjectId = ProjectId };

        const string authorKey = "jwt:tenant:author-oid";

        RemediationPatternOperationResult draft = await sut.CreateDraftAsync(
            scope,
            CreateDraftRequest(),
            authorKey,
            CancellationToken.None);

        draft.Succeeded.Should().BeTrue();

        await sut.SubmitForReviewAsync(scope, draft.PatternId!.Value, draft.Version!, authorKey, CancellationToken.None);

        RemediationPatternOperationResult approve = await sut.ApproveAsync(
            scope,
            draft.PatternId!.Value,
            draft.Version!,
            authorKey,
            CancellationToken.None);

        approve.Succeeded.Should().BeFalse();
        approve.ErrorMessage.Should().Contain("Approver cannot be the same actor");
    }

    [Fact]
    public async Task ApproveAsync_succeeds_when_approver_differs_from_author()
    {
        InMemoryRemediationPatternRepository repository = new();
        RemediationPatternService sut = new(repository, NullLogger<RemediationPatternService>.Instance);
        ScopeContext scope = new() { TenantId = TenantId, WorkspaceId = WorkspaceId, ProjectId = ProjectId };

        const string authorKey = "jwt:tenant:author-oid";
        const string approverKey = "jwt:tenant:approver-oid";

        RemediationPatternOperationResult draft = await sut.CreateDraftAsync(
            scope,
            CreateDraftRequest(),
            authorKey,
            CancellationToken.None);

        await sut.SubmitForReviewAsync(scope, draft.PatternId!.Value, draft.Version!, authorKey, CancellationToken.None);

        RemediationPatternOperationResult approve = await sut.ApproveAsync(
            scope,
            draft.PatternId!.Value,
            draft.Version!,
            approverKey,
            CancellationToken.None);

        approve.Succeeded.Should().BeTrue();
        approve.Status.Should().Be(RemediationPatternStatus.Approved);
    }

    private static RemediationPatternDraftRequest CreateDraftRequest() =>
        new()
        {
            PatternKey = "network.nsg-deny-all",
            DisplayName = "Deny all inbound NSG",
            Version = "1.0.0",
            Content = new RemediationPatternVersionContent
            {
                ControlObjective = "Block unrestricted inbound network access.",
            },
            MatchCriteria = new RemediationPatternMatchCriteria
            {
                Provider = CloudProvider.Azure,
                ResourceType = "Microsoft.Network/networkSecurityGroups",
            },
        };

    private static RemediationPatternVersionRecord CreateVersion(RemediationPatternStatus status) =>
        new()
        {
            VersionId = Guid.NewGuid(),
            PatternId = Guid.NewGuid(),
            TenantId = TenantId,
            Version = "1.0.0",
            Status = status,
            ControlObjective = "Test objective",
            ContentJson = "{}",
            AutomationLevel = RemediationAutomationLevel.Manual,
            AuthorActorKey = "jwt:tenant:author",
            CreatedUtc = DateTime.UtcNow,
            UpdatedUtc = DateTime.UtcNow,
        };

    private sealed class InMemoryRemediationPatternRepository : IRemediationPatternRepository
    {
        public List<RemediationPatternRecord> Patterns { get; } = [];

        public List<RemediationPatternVersionRecord> Versions { get; } = [];

        public Task InsertPatternAsync(RemediationPatternRecord pattern, CancellationToken cancellationToken = default)
        {
            Patterns.Add(pattern);
            return Task.CompletedTask;
        }

        public Task InsertVersionAsync(RemediationPatternVersionRecord version, CancellationToken cancellationToken = default)
        {
            Versions.Add(version);
            return Task.CompletedTask;
        }

        public Task UpdateVersionAsync(RemediationPatternVersionRecord version, CancellationToken cancellationToken = default)
        {
            int index = Versions.FindIndex(row => row.VersionId == version.VersionId);

            if (index >= 0)
                Versions[index] = version;

            return Task.CompletedTask;
        }

        public Task UpdatePatternAsync(RemediationPatternRecord pattern, CancellationToken cancellationToken = default)
        {
            int index = Patterns.FindIndex(row => row.PatternId == pattern.PatternId);

            if (index >= 0)
                Patterns[index] = pattern;

            return Task.CompletedTask;
        }

        public Task<RemediationPatternRecord?> TryGetPatternByIdAsync(
            Guid tenantId,
            Guid patternId,
            CancellationToken cancellationToken = default) =>
            Task.FromResult(Patterns.FirstOrDefault(row => row.TenantId == tenantId && row.PatternId == patternId));

        public Task<RemediationPatternRecord?> TryGetPatternByKeyAsync(
            Guid tenantId,
            string patternKey,
            CancellationToken cancellationToken = default) =>
            Task.FromResult(Patterns.FirstOrDefault(row => row.TenantId == tenantId && row.PatternKey == patternKey));

        public Task<RemediationPatternVersionRecord?> TryGetVersionAsync(
            Guid tenantId,
            Guid patternId,
            string version,
            CancellationToken cancellationToken = default) =>
            Task.FromResult(Versions.FirstOrDefault(row =>
                row.TenantId == tenantId && row.PatternId == patternId && row.Version == version));

        public Task<IReadOnlyList<RemediationPatternRecord>> ListPatternsAsync(
            Guid tenantId,
            CancellationToken cancellationToken = default) =>
            Task.FromResult<IReadOnlyList<RemediationPatternRecord>>(Patterns.Where(row => row.TenantId == tenantId).ToList());

        public Task<IReadOnlyList<RemediationPatternVersionRecord>> ListVersionsByPatternAsync(
            Guid tenantId,
            Guid patternId,
            CancellationToken cancellationToken = default) =>
            Task.FromResult<IReadOnlyList<RemediationPatternVersionRecord>>(
                Versions.Where(row => row.TenantId == tenantId && row.PatternId == patternId).ToList());

        public Task<IReadOnlyList<RemediationPatternApprovedVersionRecord>> ListApprovedVersionsForTenantAsync(
            Guid tenantId,
            CancellationToken cancellationToken = default)
        {
            List<RemediationPatternApprovedVersionRecord> approved = Versions
                .Where(version => version.TenantId == tenantId && version.Status == RemediationPatternStatus.Approved)
                .Select(version =>
                {
                    RemediationPatternRecord? pattern = Patterns.FirstOrDefault(row =>
                        row.TenantId == tenantId && row.PatternId == version.PatternId);

                    if (pattern is null)
                        return null;

                    return new RemediationPatternApprovedVersionRecord
                    {
                        Pattern = pattern,
                        Version = version,
                    };
                })
                .Where(row => row is not null)
                .Select(row => row!)
                .ToList();

            return Task.FromResult<IReadOnlyList<RemediationPatternApprovedVersionRecord>>(approved);
        }
    }
}
