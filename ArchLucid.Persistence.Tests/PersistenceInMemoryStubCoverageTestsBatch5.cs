using ArchLucid.Contracts.Operator;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.CustomerSuccess;
using ArchLucid.Core.Persistence.ApplicationPorts.FineTuning;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Authorization;
using ArchLucid.Persistence.CustomerSuccess;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.FineTuning;
using ArchLucid.Persistence.Findings;
using ArchLucid.Persistence.Integrations;
using ArchLucid.Persistence.Models;
using ArchLucid.Persistence.Repositories;
using ArchLucid.Persistence.Tenancy.Diagnostics;

using FluentAssertions;

namespace ArchLucid.Persistence.Tests;

[Trait("Category", "Unit")]
public sealed class PersistenceInMemoryStubCoverageTestsBatch5
{
    [Fact]
    public async Task InMemoryCustomRoleRepository_seeds_builtin_roles_and_supports_crud()
    {
        InMemoryCustomRoleRepository sut = new();
        Guid tenantId = Guid.NewGuid();
        Guid userId = Guid.NewGuid();

        await sut.EnsureBuiltInRolesSeededAsync(tenantId, CancellationToken.None);

        IReadOnlyList<CustomRoleRecord> seeded = await sut.ListByTenantAsync(tenantId, CancellationToken.None);

        seeded.Should().HaveCount(4);
        seeded.Should().OnlyContain(r => r.IsSystem);

        CustomRoleRecord custom = await sut.CreateAsync(
            new CustomRoleRecord
            {
                TenantId = tenantId,
                Name = "Reviewer",
                Description = "Custom reviewer",
                Permissions = ["findings.read"],
            },
            CancellationToken.None);

        custom.Id.Should().NotBe(Guid.Empty);

        CustomRoleRecord updated = await sut.UpdateAsync(
            new CustomRoleRecord
            {
                Id = custom.Id,
                TenantId = custom.TenantId,
                Name = "Reviewer+",
                Description = "Updated",
                Permissions = custom.Permissions,
            },
            CancellationToken.None);

        updated.Name.Should().Be("Reviewer+");

        await sut.AssignAsync(
            new UserCustomRoleAssignmentRecord
            {
                UserId = userId,
                CustomRoleId = custom.Id,
                AssignedUtc = DateTimeOffset.UtcNow,
            },
            CancellationToken.None);

        IReadOnlyList<CustomRoleAssignmentWithRole> assignments =
            await sut.ListAssignmentsForUserAsync(tenantId, userId, CancellationToken.None);

        assignments.Should().ContainSingle(a => a.Role.Id == custom.Id);

        await sut.RemoveAssignmentAsync(tenantId, userId, custom.Id, CancellationToken.None);
        await sut.DeleteAsync(tenantId, custom.Id, CancellationToken.None);

        (await sut.TryGetAsync(tenantId, custom.Id, CancellationToken.None)).Should().BeNull();
    }

    [Fact]
    public async Task InMemoryCustomRoleRepository_rejects_system_role_mutations()
    {
        InMemoryCustomRoleRepository sut = new();
        Guid tenantId = Guid.NewGuid();

        await sut.EnsureBuiltInRolesSeededAsync(tenantId, CancellationToken.None);
        CustomRoleRecord admin = (await sut.ListByTenantAsync(tenantId, CancellationToken.None)).First(r => r.Name == "Admin");

        Func<Task> update = () => sut.UpdateAsync(
            new CustomRoleRecord
            {
                Id = admin.Id,
                TenantId = admin.TenantId,
                Name = "Hacked",
                Description = admin.Description,
                Permissions = admin.Permissions,
            },
            CancellationToken.None);
        Func<Task> delete = () => sut.DeleteAsync(tenantId, admin.Id, CancellationToken.None);

        await update.Should().ThrowAsync<InvalidOperationException>();
        await delete.Should().ThrowAsync<InvalidOperationException>();
    }

    [Fact]
    public async Task InMemoryOperatorSavedViewRepository_lists_creates_and_deletes_views()
    {
        InMemoryOperatorSavedViewRepository sut = new();
        Guid tenantId = Guid.NewGuid();
        const string userId = "user-1";

        OperatorSavedViewResponse? created = await sut.CreateAsync(
            tenantId,
            userId,
            surface: "runs",
            name: "My view",
            payloadJson: """{"filters":[]}""",
            sortKey: "name",
            isShared: false,
            CancellationToken.None);

        created.Should().NotBeNull();
        created!.IsOwnedByCurrentUser.Should().BeTrue();

        IReadOnlyList<OperatorSavedViewResponse> listed =
            await sut.ListAsync(tenantId, userId, surface: "runs", CancellationToken.None);

        listed.Should().ContainSingle(v => v.Name == "My view");

        (await sut.DeleteAsync(tenantId, userId, created.Id, CancellationToken.None)).Should().BeTrue();
        (await sut.DeleteAsync(tenantId, userId, created.Id, CancellationToken.None)).Should().BeFalse();
    }

    [Fact]
    public async Task InMemoryOperatorSavedViewRepository_rejects_duplicate_names_per_surface()
    {
        InMemoryOperatorSavedViewRepository sut = new();
        Guid tenantId = Guid.NewGuid();

        await sut.CreateAsync(
            tenantId,
            "user-1",
            surface: "runs",
            name: "Dup",
            payloadJson: "{}",
            sortKey: null,
            isShared: false,
            CancellationToken.None);

        Func<Task> duplicate = () => sut.CreateAsync(
            tenantId,
            "user-1",
            surface: "runs",
            name: "Dup",
            payloadJson: "{}",
            sortKey: null,
            isShared: false,
            CancellationToken.None);

        await duplicate.Should().ThrowAsync<InvalidOperationException>();
    }

    [Fact]
    public async Task InMemoryTenantItsmOutboundSettingsRepository_round_trips_settings()
    {
        InMemoryTenantItsmOutboundSettingsRepository sut = new();
        Guid tenantId = Guid.NewGuid();
        TenantItsmOutboundSettings settings = new()
        {
            JiraProjectKeyOverride = "AL",
            JiraSendInfoSeverity = true,
        };

        (await sut.TryGetAsync(tenantId, CancellationToken.None)).Should().BeNull();

        TenantItsmOutboundSettings saved = await sut.UpsertAsync(tenantId, settings, CancellationToken.None);

        saved.JiraProjectKeyOverride.Should().Be("AL");
        (await sut.TryGetAsync(tenantId, CancellationToken.None)).Should().BeEquivalentTo(settings);
    }

    [Fact]
    public async Task InMemoryTenantItsmOutboundSettingsRepository_rejects_empty_tenant_id()
    {
        InMemoryTenantItsmOutboundSettingsRepository sut = new();

        Func<Task> get = () => sut.TryGetAsync(Guid.Empty, CancellationToken.None);
        Func<Task> upsert = () => sut.UpsertAsync(Guid.Empty, new TenantItsmOutboundSettings(), CancellationToken.None);

        await get.Should().ThrowAsync<ArgumentException>();
        await upsert.Should().ThrowAsync<ArgumentException>();
    }

    [Fact]
    public async Task InMemoryCorePilotTeamChecklistRepository_lists_and_upserts_steps()
    {
        InMemoryCorePilotTeamChecklistRepository sut = new();
        Guid tenantId = Guid.NewGuid();
        Guid workspaceId = Guid.NewGuid();
        Guid projectId = Guid.NewGuid();

        await sut.UpsertAsync(tenantId, workspaceId, projectId, stepIndex: 1, isCompleted: true, "owner", CancellationToken.None);

        IReadOnlyList<CorePilotChecklistStepRow> rows =
            await sut.ListAsync(tenantId, workspaceId, projectId, CancellationToken.None);

        rows.Should().ContainSingle(r => r.StepIndex == 1 && r.IsCompleted);
    }

    [Fact]
    public async Task InMemoryFineTuningTrainingExportAuditRepository_records_inserts()
    {
        InMemoryFineTuningTrainingExportAuditRepository sut = new();
        FineTuningTrainingExportAuditRecord record = new()
        {
            TenantId = Guid.NewGuid(),
            WorkspaceId = Guid.NewGuid(),
            ProjectId = Guid.NewGuid(),
            ManifestCount = 1,
            RecordCount = 2,
            BundleContentHash = "hash",
            ConsentSnapshot = "consent",
            CreatedUtc = DateTime.UtcNow,
        };

        await sut.InsertAsync(record, CancellationToken.None);

        sut.Records.Should().ContainSingle(r => r.ExportAuditId == record.ExportAuditId);
    }

    [Fact]
    public async Task InMemoryTrialFunnelOperationalMetricsReader_returns_zero_metrics()
    {
        InMemoryTrialFunnelOperationalMetricsReader sut = new();

        (await sut.CountActiveSelfServiceTrialsAsync(CancellationToken.None)).Should().Be(0);
        (await sut.GetOperationalSummaryAsync(cancellationToken: CancellationToken.None)).ActiveSelfServiceTrials.Should().Be(0);
    }

    [Fact]
    public void LlmCostEstimationUsdRateOverrideCache_stores_and_returns_rates()
    {
        LlmCostEstimationUsdRateOverrideCache sut = new();

        sut.TryGetUsdPerMillionRates(out decimal input, out decimal output).Should().BeFalse();
        input.Should().Be(0);
        output.Should().Be(0);

        sut.Set(new LlmCostEstimationUsdRateOverrideRow
        {
            InputUsdPerMillionTokens = 3.5m,
            OutputUsdPerMillionTokens = 10.5m,
        });

        sut.TryGetUsdPerMillionRates(out input, out output).Should().BeTrue();
        input.Should().Be(3.5m);
        output.Should().Be(10.5m);
    }

    [Fact]
    public async Task InMemoryFindingRecordMuteRepository_returns_empty_flags_and_false_mute()
    {
        InMemoryFindingRecordMuteRepository sut = new();
        ScopeContext scope = new()
        {
            TenantId = Guid.NewGuid(),
            WorkspaceId = Guid.NewGuid(),
            ProjectId = Guid.NewGuid(),
        };

        (await sut.GetMuteFlagsAsync(Guid.NewGuid(), scope, CancellationToken.None)).Should().BeEmpty();
        (await sut.TryMuteAsync(Guid.NewGuid(), "f-1", "reason", scope, CancellationToken.None)).Should().BeFalse();
    }

    [Fact]
    public async Task InMemoryFindingRecordRemediationAssignmentRepository_returns_false()
    {
        InMemoryFindingRecordRemediationAssignmentRepository sut = new();
        ScopeContext scope = new()
        {
            TenantId = Guid.NewGuid(),
            WorkspaceId = Guid.NewGuid(),
            ProjectId = Guid.NewGuid(),
        };

        (await sut.TryUpdateAssignmentAsync(
                Guid.NewGuid(),
                "f-1",
                scope,
                assignedToUserId: "user",
                remediationDueUtc: DateTimeOffset.UtcNow,
                CancellationToken.None))
            .Should()
            .BeFalse();
    }
}
