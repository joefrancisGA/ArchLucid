using ArchLucid.Decisioning.Governance.PolicyPacks;
using ArchLucid.Decisioning.Governance.Resolution;
using ArchLucid.Persistence.Governance;

using FluentAssertions;

namespace ArchLucid.Decisioning.Tests;

/// <summary>
/// Tests for Effective Governance Resolver.
/// </summary>

[Trait("Suite", "Core")]
public sealed class EffectiveGovernanceResolverTests
{
    [Fact]
    public async Task Project_scope_wins_over_tenant_for_same_metadata_key_and_records_value_conflict()
    {
        Guid tenantId = Guid.NewGuid();
        Guid workspaceId = Guid.NewGuid();
        Guid projectId = Guid.NewGuid();

        InMemoryPolicyPackRepository packRepo = new();
        InMemoryPolicyPackVersionRepository versionRepo = new();
        InMemoryPolicyPackAssignmentRepository assignmentRepo = new();

        Guid tenantPackId = Guid.NewGuid();
        Guid projectPackId = Guid.NewGuid();

        await packRepo.CreateAsync(
            new PolicyPack
            {
                PolicyPackId = tenantPackId,
                TenantId = tenantId,
                WorkspaceId = workspaceId,
                ProjectId = projectId,
                Name = "Tenant baseline",
                Description = "",
                PackType = PolicyPackType.TenantCustom,
                Status = PolicyPackStatus.Active,
                CurrentVersion = "1.0.0",
            },
            CancellationToken.None);

        await packRepo.CreateAsync(
            new PolicyPack
            {
                PolicyPackId = projectPackId,
                TenantId = tenantId,
                WorkspaceId = workspaceId,
                ProjectId = projectId,
                Name = "Project override",
                Description = "",
                PackType = PolicyPackType.ProjectCustom,
                Status = PolicyPackStatus.Active,
                CurrentVersion = "1.0.0",
            },
            CancellationToken.None);

        await versionRepo.CreateAsync(
            new PolicyPackVersion
            {
                PolicyPackVersionId = Guid.NewGuid(),
                PolicyPackId = tenantPackId,
                Version = "1.0.0",
                ContentJson = """{"metadata":{"tier":"tenant"},"complianceRuleIds":[],"complianceRuleKeys":[],"alertRuleIds":[],"compositeAlertRuleIds":[],"advisoryDefaults":{}}""",
                CreatedUtc = TimeProvider.System.UtcNowDateTime(),
                IsPublished = true,
            },
            CancellationToken.None);

        await versionRepo.CreateAsync(
            new PolicyPackVersion
            {
                PolicyPackVersionId = Guid.NewGuid(),
                PolicyPackId = projectPackId,
                Version = "1.0.0",
                ContentJson = """{"metadata":{"tier":"project"},"complianceRuleIds":[],"complianceRuleKeys":[],"alertRuleIds":[],"compositeAlertRuleIds":[],"advisoryDefaults":{}}""",
                CreatedUtc = TimeProvider.System.UtcNowDateTime(),
                IsPublished = true,
            },
            CancellationToken.None);

        await assignmentRepo.CreateAsync(
            new PolicyPackAssignment
            {
                TenantId = tenantId,
                WorkspaceId = Guid.Empty,
                ProjectId = Guid.Empty,
                PolicyPackId = tenantPackId,
                PolicyPackVersion = "1.0.0",
                ScopeLevel = GovernanceScopeLevel.Tenant,
                AssignedUtc = TimeProvider.System.UtcNowDateTime().AddMinutes(-1),
            },
            CancellationToken.None);

        await assignmentRepo.CreateAsync(
            new PolicyPackAssignment
            {
                TenantId = tenantId,
                WorkspaceId = workspaceId,
                ProjectId = projectId,
                PolicyPackId = projectPackId,
                PolicyPackVersion = "1.0.0",
                ScopeLevel = GovernanceScopeLevel.Project,
                AssignedUtc = TimeProvider.System.UtcNowDateTime(),
            },
            CancellationToken.None);

        EffectiveGovernanceResolver resolver = new(assignmentRepo, packRepo, versionRepo);

        EffectiveGovernanceResolutionResult result = await resolver.ResolveAsync(tenantId, workspaceId, projectId, CancellationToken.None);

        result.EffectiveContent.Metadata["tier"].Should().Be("project");
        result.Conflicts.Should().ContainSingle(c => c.ConflictType == "ValueConflict" && c.ItemKey == "tier");
        result.Decisions.Should().Contain(d => d.ItemType == "Metadata" && d.ItemKey == "tier" && d.WinningPolicyPackId == projectPackId);
    }

    [Fact]
    public async Task Archived_assignments_are_not_visible_to_resolver_lists()
    {
        Guid tenantId = Guid.NewGuid();
        Guid workspaceId = Guid.NewGuid();
        Guid projectId = Guid.NewGuid();
        Guid packId = Guid.NewGuid();

        InMemoryPolicyPackRepository packRepo = new();
        InMemoryPolicyPackVersionRepository versionRepo = new();
        InMemoryPolicyPackAssignmentRepository assignmentRepo = new();

        await packRepo.CreateAsync(
            new PolicyPack
            {
                PolicyPackId = packId,
                TenantId = tenantId,
                WorkspaceId = workspaceId,
                ProjectId = projectId,
                Name = "Only archived assign",
                Description = "",
                PackType = PolicyPackType.ProjectCustom,
                Status = PolicyPackStatus.Active,
                CurrentVersion = "1.0.0",
            },
            CancellationToken.None);

        await versionRepo.CreateAsync(
            new PolicyPackVersion
            {
                PolicyPackVersionId = Guid.NewGuid(),
                PolicyPackId = packId,
                Version = "1.0.0",
                ContentJson = """{"metadata":{"orphan":"x"},"complianceRuleIds":[],"complianceRuleKeys":[],"alertRuleIds":[],"compositeAlertRuleIds":[],"advisoryDefaults":{}}""",
                CreatedUtc = TimeProvider.System.UtcNowDateTime(),
                IsPublished = true,
            },
            CancellationToken.None);

        await assignmentRepo.CreateAsync(
            new PolicyPackAssignment
            {
                TenantId = tenantId,
                WorkspaceId = workspaceId,
                ProjectId = projectId,
                PolicyPackId = packId,
                PolicyPackVersion = "1.0.0",
                ScopeLevel = GovernanceScopeLevel.Project,
                AssignedUtc = TimeProvider.System.UtcNowDateTime(),
                ArchivedUtc = TimeProvider.System.UtcNowDateTime(),
            },
            CancellationToken.None);

        EffectiveGovernanceResolver resolver = new(assignmentRepo, packRepo, versionRepo);

        EffectiveGovernanceResolutionResult result = await resolver.ResolveAsync(tenantId, workspaceId, projectId, CancellationToken.None);

        result.EffectiveContent.Metadata.Should().NotContainKey("orphan");
    }

    [Fact]
    public async Task ResolveAsync_Skips_assignment_when_policy_pack_row_missing()
    {
        Guid tenantId = Guid.NewGuid();
        Guid workspaceId = Guid.NewGuid();
        Guid projectId = Guid.NewGuid();
        Guid missingPackId = Guid.NewGuid();

        InMemoryPolicyPackRepository packRepo = new();
        InMemoryPolicyPackVersionRepository versionRepo = new();
        InMemoryPolicyPackAssignmentRepository assignmentRepo = new();

        await assignmentRepo.CreateAsync(
            new PolicyPackAssignment
            {
                TenantId = tenantId,
                WorkspaceId = workspaceId,
                ProjectId = projectId,
                PolicyPackId = missingPackId,
                PolicyPackVersion = "1.0.0",
                ScopeLevel = GovernanceScopeLevel.Project,
                AssignedUtc = TimeProvider.System.UtcNowDateTime(),
            },
            CancellationToken.None);

        EffectiveGovernanceResolver resolver = new(assignmentRepo, packRepo, versionRepo);
        EffectiveGovernanceResolutionResult result = await resolver.ResolveAsync(tenantId, workspaceId, projectId, CancellationToken.None);

        result.Notes.Should()
            .Contain(n => n.Contains("pack not found", StringComparison.OrdinalIgnoreCase));
    }

    [Fact]
    public async Task ResolveAsync_Skips_assignment_when_assigned_version_row_missing()
    {
        Guid tenantId = Guid.NewGuid();
        Guid workspaceId = Guid.NewGuid();
        Guid projectId = Guid.NewGuid();
        Guid packId = Guid.NewGuid();

        InMemoryPolicyPackRepository packRepo = new();
        InMemoryPolicyPackVersionRepository versionRepo = new();
        InMemoryPolicyPackAssignmentRepository assignmentRepo = new();

        await packRepo.CreateAsync(
            new PolicyPack
            {
                PolicyPackId = packId,
                TenantId = tenantId,
                WorkspaceId = workspaceId,
                ProjectId = projectId,
                Name = "Has pack",
                Description = "",
                PackType = PolicyPackType.ProjectCustom,
                Status = PolicyPackStatus.Active,
                CurrentVersion = "1.0.0",
            },
            CancellationToken.None);

        await versionRepo.CreateAsync(
            new PolicyPackVersion
            {
                PolicyPackVersionId = Guid.NewGuid(),
                PolicyPackId = packId,
                Version = "1.0.0",
                ContentJson = """{"metadata":{},"complianceRuleIds":[],"complianceRuleKeys":[],"alertRuleIds":[],"compositeAlertRuleIds":[],"advisoryDefaults":{}}""",
                CreatedUtc = TimeProvider.System.UtcNowDateTime(),
                IsPublished = true,
            },
            CancellationToken.None);

        await assignmentRepo.CreateAsync(
            new PolicyPackAssignment
            {
                TenantId = tenantId,
                WorkspaceId = workspaceId,
                ProjectId = projectId,
                PolicyPackId = packId,
                PolicyPackVersion = "9.9.9",
                ScopeLevel = GovernanceScopeLevel.Project,
                AssignedUtc = TimeProvider.System.UtcNowDateTime(),
            },
            CancellationToken.None);

        EffectiveGovernanceResolver resolver = new(assignmentRepo, packRepo, versionRepo);
        EffectiveGovernanceResolutionResult result = await resolver.ResolveAsync(tenantId, workspaceId, projectId, CancellationToken.None);

        result.Notes.Should()
            .Contain(n => n.Contains("version '9.9.9' not found", StringComparison.OrdinalIgnoreCase));
    }

    [Fact]
    public async Task ResolveAsync_Skips_assignment_when_content_json_is_not_valid_json()
    {
        Guid tenantId = Guid.NewGuid();
        Guid workspaceId = Guid.NewGuid();
        Guid projectId = Guid.NewGuid();
        Guid packId = Guid.NewGuid();

        InMemoryPolicyPackRepository packRepo = new();
        InMemoryPolicyPackVersionRepository versionRepo = new();
        InMemoryPolicyPackAssignmentRepository assignmentRepo = new();

        await packRepo.CreateAsync(
            new PolicyPack
            {
                PolicyPackId = packId,
                TenantId = tenantId,
                WorkspaceId = workspaceId,
                ProjectId = projectId,
                Name = "Bad json",
                Description = "",
                PackType = PolicyPackType.ProjectCustom,
                Status = PolicyPackStatus.Active,
                CurrentVersion = "1.0.0",
            },
            CancellationToken.None);

        await versionRepo.CreateAsync(
            new PolicyPackVersion
            {
                PolicyPackVersionId = Guid.NewGuid(),
                PolicyPackId = packId,
                Version = "1.0.0",
                ContentJson = "{ not json",
                CreatedUtc = TimeProvider.System.UtcNowDateTime(),
                IsPublished = true,
            },
            CancellationToken.None);

        await assignmentRepo.CreateAsync(
            new PolicyPackAssignment
            {
                TenantId = tenantId,
                WorkspaceId = workspaceId,
                ProjectId = projectId,
                PolicyPackId = packId,
                PolicyPackVersion = "1.0.0",
                ScopeLevel = GovernanceScopeLevel.Project,
                AssignedUtc = TimeProvider.System.UtcNowDateTime(),
            },
            CancellationToken.None);

        EffectiveGovernanceResolver resolver = new(assignmentRepo, packRepo, versionRepo);
        EffectiveGovernanceResolutionResult result = await resolver.ResolveAsync(tenantId, workspaceId, projectId, CancellationToken.None);

        result.Notes.Should()
            .Contain(n => n.Contains("content JSON is corrupt", StringComparison.OrdinalIgnoreCase));
    }

    [Fact]
    public async Task ResolveAsync_Skips_assignment_when_content_json_is_json_null()
    {
        Guid tenantId = Guid.NewGuid();
        Guid workspaceId = Guid.NewGuid();
        Guid projectId = Guid.NewGuid();
        Guid packId = Guid.NewGuid();

        InMemoryPolicyPackRepository packRepo = new();
        InMemoryPolicyPackVersionRepository versionRepo = new();
        InMemoryPolicyPackAssignmentRepository assignmentRepo = new();

        await packRepo.CreateAsync(
            new PolicyPack
            {
                PolicyPackId = packId,
                TenantId = tenantId,
                WorkspaceId = workspaceId,
                ProjectId = projectId,
                Name = "Null content",
                Description = "",
                PackType = PolicyPackType.ProjectCustom,
                Status = PolicyPackStatus.Active,
                CurrentVersion = "1.0.0",
            },
            CancellationToken.None);

        await versionRepo.CreateAsync(
            new PolicyPackVersion
            {
                PolicyPackVersionId = Guid.NewGuid(),
                PolicyPackId = packId,
                Version = "1.0.0",
                ContentJson = "null",
                CreatedUtc = TimeProvider.System.UtcNowDateTime(),
                IsPublished = true,
            },
            CancellationToken.None);

        await assignmentRepo.CreateAsync(
            new PolicyPackAssignment
            {
                TenantId = tenantId,
                WorkspaceId = workspaceId,
                ProjectId = projectId,
                PolicyPackId = packId,
                PolicyPackVersion = "1.0.0",
                ScopeLevel = GovernanceScopeLevel.Project,
                AssignedUtc = TimeProvider.System.UtcNowDateTime(),
            },
            CancellationToken.None);

        EffectiveGovernanceResolver resolver = new(assignmentRepo, packRepo, versionRepo);
        EffectiveGovernanceResolutionResult result = await resolver.ResolveAsync(tenantId, workspaceId, projectId, CancellationToken.None);

        result.Notes.Should()
            .Contain(n => n.Contains("deserialized to null", StringComparison.OrdinalIgnoreCase));
    }

    [Fact]
    public async Task Pinned_tenant_assignment_outranks_unpinned_tenant_for_duplicate_compliance_rule_id()
    {
        Guid tenantId = Guid.NewGuid();
        Guid workspaceId = Guid.NewGuid();
        Guid projectId = Guid.NewGuid();
        Guid ruleId = Guid.NewGuid();

        InMemoryPolicyPackRepository packRepo = new();
        InMemoryPolicyPackVersionRepository versionRepo = new();
        InMemoryPolicyPackAssignmentRepository assignmentRepo = new();

        Guid unpinnedPackId = Guid.NewGuid();
        Guid pinnedPackId = Guid.NewGuid();

        await packRepo.CreateAsync(
            new PolicyPack
            {
                PolicyPackId = unpinnedPackId,
                TenantId = tenantId,
                WorkspaceId = workspaceId,
                ProjectId = projectId,
                Name = "Unpinned tenant baseline",
                Description = "",
                PackType = PolicyPackType.TenantCustom,
                Status = PolicyPackStatus.Active,
                CurrentVersion = "1.0.0",
            },
            CancellationToken.None);

        await packRepo.CreateAsync(
            new PolicyPack
            {
                PolicyPackId = pinnedPackId,
                TenantId = tenantId,
                WorkspaceId = workspaceId,
                ProjectId = projectId,
                Name = "Pinned tenant override",
                Description = "",
                PackType = PolicyPackType.TenantCustom,
                Status = PolicyPackStatus.Active,
                CurrentVersion = "1.0.0",
            },
            CancellationToken.None);

        string ruleLiteral = ruleId.ToString("D");
        string unpinnedJson =
            "{\"metadata\":{},\"complianceRuleIds\":[\"" + ruleLiteral +
            "\"],\"complianceRuleKeys\":[],\"alertRuleIds\":[],\"compositeAlertRuleIds\":[],\"advisoryDefaults\":{}}";

        string pinnedJson =
            "{\"metadata\":{},\"complianceRuleIds\":[\"" + ruleLiteral +
            "\"],\"complianceRuleKeys\":[],\"alertRuleIds\":[],\"compositeAlertRuleIds\":[],\"advisoryDefaults\":{}}";

        await versionRepo.CreateAsync(
            new PolicyPackVersion
            {
                PolicyPackVersionId = Guid.NewGuid(),
                PolicyPackId = unpinnedPackId,
                Version = "1.0.0",
                ContentJson = unpinnedJson,
                CreatedUtc = TimeProvider.System.UtcNowDateTime(),
                IsPublished = true,
            },
            CancellationToken.None);

        await versionRepo.CreateAsync(
            new PolicyPackVersion
            {
                PolicyPackVersionId = Guid.NewGuid(),
                PolicyPackId = pinnedPackId,
                Version = "1.0.0",
                ContentJson = pinnedJson,
                CreatedUtc = TimeProvider.System.UtcNowDateTime(),
                IsPublished = true,
            },
            CancellationToken.None);

        DateTime utc = TimeProvider.System.UtcNowDateTime();

        await assignmentRepo.CreateAsync(
            new PolicyPackAssignment
            {
                TenantId = tenantId,
                WorkspaceId = Guid.Empty,
                ProjectId = Guid.Empty,
                PolicyPackId = unpinnedPackId,
                PolicyPackVersion = "1.0.0",
                ScopeLevel = GovernanceScopeLevel.Tenant,
                AssignedUtc = utc.AddMinutes(-10),
                IsPinned = false,
            },
            CancellationToken.None);

        await assignmentRepo.CreateAsync(
            new PolicyPackAssignment
            {
                TenantId = tenantId,
                WorkspaceId = Guid.Empty,
                ProjectId = Guid.Empty,
                PolicyPackId = pinnedPackId,
                PolicyPackVersion = "1.0.0",
                ScopeLevel = GovernanceScopeLevel.Tenant,
                AssignedUtc = utc.AddMinutes(-5),
                IsPinned = true,
            },
            CancellationToken.None);

        EffectiveGovernanceResolver resolver = new(assignmentRepo, packRepo, versionRepo);

        EffectiveGovernanceResolutionResult result = await resolver.ResolveAsync(tenantId, workspaceId, projectId, CancellationToken.None);

        result.EffectiveContent.ComplianceRuleIds.Should().ContainSingle(id => id == ruleId);
        result.Decisions.Should().ContainSingle(d =>
            d.ItemType == "ComplianceRule"
            && d.ItemKey == ruleId.ToString("D")
            && d.WinningPolicyPackId == pinnedPackId);

        result.Conflicts.Should().ContainSingle(c =>
            c.ConflictType == "DuplicateDefinition"
            && c.ItemKey == ruleId.ToString("D"));
    }

    [Fact]
    public async Task Same_scope_tier_newer_AssignedUtc_wins_when_duplicate_metadata_values_are_identical()
    {
        Guid tenantId = Guid.NewGuid();
        Guid workspaceId = Guid.NewGuid();
        Guid projectId = Guid.NewGuid();

        InMemoryPolicyPackRepository packRepo = new();
        InMemoryPolicyPackVersionRepository versionRepo = new();
        InMemoryPolicyPackAssignmentRepository assignmentRepo = new();

        Guid olderPackId = Guid.NewGuid();
        Guid newerPackId = Guid.NewGuid();

        await packRepo.CreateAsync(
            new PolicyPack
            {
                PolicyPackId = olderPackId,
                TenantId = tenantId,
                WorkspaceId = workspaceId,
                ProjectId = projectId,
                Name = "Older project pack",
                Description = "",
                PackType = PolicyPackType.ProjectCustom,
                Status = PolicyPackStatus.Active,
                CurrentVersion = "1.0.0",
            },
            CancellationToken.None);

        await packRepo.CreateAsync(
            new PolicyPack
            {
                PolicyPackId = newerPackId,
                TenantId = tenantId,
                WorkspaceId = workspaceId,
                ProjectId = projectId,
                Name = "Newer project pack",
                Description = "",
                PackType = PolicyPackType.ProjectCustom,
                Status = PolicyPackStatus.Active,
                CurrentVersion = "1.0.0",
            },
            CancellationToken.None);

        const string sharedMetadataJson =
            """{"metadata":{"tier":"same"},"complianceRuleIds":[],"complianceRuleKeys":[],"alertRuleIds":[],"compositeAlertRuleIds":[],"advisoryDefaults":{}}""";

        await versionRepo.CreateAsync(
            new PolicyPackVersion
            {
                PolicyPackVersionId = Guid.NewGuid(),
                PolicyPackId = olderPackId,
                Version = "1.0.0",
                ContentJson = sharedMetadataJson,
                CreatedUtc = TimeProvider.System.UtcNowDateTime(),
                IsPublished = true,
            },
            CancellationToken.None);

        await versionRepo.CreateAsync(
            new PolicyPackVersion
            {
                PolicyPackVersionId = Guid.NewGuid(),
                PolicyPackId = newerPackId,
                Version = "1.0.0",
                ContentJson = sharedMetadataJson,
                CreatedUtc = TimeProvider.System.UtcNowDateTime(),
                IsPublished = true,
            },
            CancellationToken.None);

        DateTime utc = TimeProvider.System.UtcNowDateTime();

        await assignmentRepo.CreateAsync(
            new PolicyPackAssignment
            {
                TenantId = tenantId,
                WorkspaceId = workspaceId,
                ProjectId = projectId,
                PolicyPackId = olderPackId,
                PolicyPackVersion = "1.0.0",
                ScopeLevel = GovernanceScopeLevel.Project,
                AssignedUtc = utc.AddMinutes(-20),
            },
            CancellationToken.None);

        await assignmentRepo.CreateAsync(
            new PolicyPackAssignment
            {
                TenantId = tenantId,
                WorkspaceId = workspaceId,
                ProjectId = projectId,
                PolicyPackId = newerPackId,
                PolicyPackVersion = "1.0.0",
                ScopeLevel = GovernanceScopeLevel.Project,
                AssignedUtc = utc.AddMinutes(-10),
            },
            CancellationToken.None);

        EffectiveGovernanceResolver resolver = new(assignmentRepo, packRepo, versionRepo);

        EffectiveGovernanceResolutionResult result = await resolver.ResolveAsync(tenantId, workspaceId, projectId, CancellationToken.None);

        result.EffectiveContent.Metadata["tier"].Should().Be("same");
        result.Decisions.Should().ContainSingle(d =>
            d.ItemType == "Metadata"
            && d.ItemKey == "tier"
            && d.WinningPolicyPackId == newerPackId);

        result.Conflicts.Should().NotContain(c =>
            string.Equals(c.ConflictType, "ValueConflict", StringComparison.Ordinal)
            && string.Equals(c.ItemKey, "tier", StringComparison.Ordinal));
    }

    [Fact]
    public async Task Same_scope_pin_and_AssignedUtc_higher_AssignmentId_breaks_tie_for_compliance_rule_key()
    {
        Guid tenantId = Guid.NewGuid();
        Guid workspaceId = Guid.NewGuid();
        Guid projectId = Guid.NewGuid();

        InMemoryPolicyPackRepository packRepo = new();
        InMemoryPolicyPackVersionRepository versionRepo = new();
        InMemoryPolicyPackAssignmentRepository assignmentRepo = new();

        Guid lowerAssignmentPackId = Guid.NewGuid();
        Guid higherAssignmentPackId = Guid.NewGuid();

        await packRepo.CreateAsync(
            new PolicyPack
            {
                PolicyPackId = lowerAssignmentPackId,
                TenantId = tenantId,
                WorkspaceId = workspaceId,
                ProjectId = projectId,
                Name = "Lower assignment id pack",
                Description = "",
                PackType = PolicyPackType.WorkspaceCustom,
                Status = PolicyPackStatus.Active,
                CurrentVersion = "1.0.0",
            },
            CancellationToken.None);

        await packRepo.CreateAsync(
            new PolicyPack
            {
                PolicyPackId = higherAssignmentPackId,
                TenantId = tenantId,
                WorkspaceId = workspaceId,
                ProjectId = projectId,
                Name = "Higher assignment id pack",
                Description = "",
                PackType = PolicyPackType.WorkspaceCustom,
                Status = PolicyPackStatus.Active,
                CurrentVersion = "1.0.0",
            },
            CancellationToken.None);

        string lowerKeysJson =
            """{"metadata":{},"complianceRuleIds":[],"complianceRuleKeys":["RULE-A"],"alertRuleIds":[],"compositeAlertRuleIds":[],"advisoryDefaults":{}}""";

        string upperKeysJson =
            """{"metadata":{},"complianceRuleIds":[],"complianceRuleKeys":["rule-a"],"alertRuleIds":[],"compositeAlertRuleIds":[],"advisoryDefaults":{}}""";

        await versionRepo.CreateAsync(
            new PolicyPackVersion
            {
                PolicyPackVersionId = Guid.NewGuid(),
                PolicyPackId = lowerAssignmentPackId,
                Version = "1.0.0",
                ContentJson = lowerKeysJson,
                CreatedUtc = TimeProvider.System.UtcNowDateTime(),
                IsPublished = true,
            },
            CancellationToken.None);

        await versionRepo.CreateAsync(
            new PolicyPackVersion
            {
                PolicyPackVersionId = Guid.NewGuid(),
                PolicyPackId = higherAssignmentPackId,
                Version = "1.0.0",
                ContentJson = upperKeysJson,
                CreatedUtc = TimeProvider.System.UtcNowDateTime(),
                IsPublished = true,
            },
            CancellationToken.None);

        DateTime stamp = new(2026, 3, 1, 12, 0, 0, DateTimeKind.Utc);
        Guid lowerAssignmentId = Guid.Parse("11111111-1111-1111-1111-111111111111");
        Guid higherAssignmentId = Guid.Parse("22222222-2222-2222-2222-222222222222");

        await assignmentRepo.CreateAsync(
            new PolicyPackAssignment
            {
                AssignmentId = lowerAssignmentId,
                TenantId = tenantId,
                WorkspaceId = workspaceId,
                ProjectId = Guid.Empty,
                PolicyPackId = lowerAssignmentPackId,
                PolicyPackVersion = "1.0.0",
                ScopeLevel = GovernanceScopeLevel.Workspace,
                AssignedUtc = stamp,
            },
            CancellationToken.None);

        await assignmentRepo.CreateAsync(
            new PolicyPackAssignment
            {
                AssignmentId = higherAssignmentId,
                TenantId = tenantId,
                WorkspaceId = workspaceId,
                ProjectId = Guid.Empty,
                PolicyPackId = higherAssignmentPackId,
                PolicyPackVersion = "1.0.0",
                ScopeLevel = GovernanceScopeLevel.Workspace,
                AssignedUtc = stamp,
            },
            CancellationToken.None);

        EffectiveGovernanceResolver resolver = new(assignmentRepo, packRepo, versionRepo);

        EffectiveGovernanceResolutionResult result = await resolver.ResolveAsync(tenantId, workspaceId, projectId, CancellationToken.None);

        result.EffectiveContent.ComplianceRuleKeys.Should().ContainSingle(k => string.Equals(k, "RULE-A", StringComparison.Ordinal));

        result.Decisions.Should().ContainSingle(d =>
            d.ItemType == "ComplianceRuleKey"
            && string.Equals(d.ItemKey, "RULE-A", StringComparison.Ordinal)
            && d.WinningPolicyPackId == higherAssignmentPackId);

        result.Conflicts.Should().ContainSingle(c =>
            c.ConflictType == "DuplicateDefinition"
            && string.Equals(c.ItemKey, "RULE-A", StringComparison.Ordinal));
    }
}
