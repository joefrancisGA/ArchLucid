using System.Reflection;

using ArchLucid.Contracts.Common;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Models;
using ArchLucid.Persistence.Repositories;

using FluentAssertions;

namespace ArchLucid.Persistence.Tests.Repositories;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class RunRecordParametersTests
{
    private static readonly Guid TenantId = Guid.Parse("bbbbbbbb-0000-0000-0000-000000000001");
    private static readonly Guid WorkspaceId = Guid.Parse("bbbbbbbb-0000-0000-0000-000000000002");
    private static readonly Guid ProjectId = Guid.Parse("bbbbbbbb-0000-0000-0000-000000000003");
    private static readonly Guid RunId = Guid.Parse("bbbbbbbb-0000-0000-0000-000000000004");

    /// <summary>
    ///     The mode column is NVARCHAR with a check constraint on the label; binding the enum itself would send the
    ///     underlying integer and fail the constraint.
    /// </summary>
    [Fact]
    public void Insert_binds_the_structural_execution_mode_as_its_label() =>
        Read<string>(RunRecordParameters.Insert(Run()), "StructuralExecutionMode")
            .Should()
            .Be(nameof(StructuralExecutionMode.Real));

    [Fact]
    public void Update_binds_the_structural_execution_mode_as_its_label() =>
        Read<string>(RunRecordParameters.Update(Run()), "StructuralExecutionMode")
            .Should()
            .Be(nameof(StructuralExecutionMode.Real));

    [Fact]
    public void Insert_carries_the_scope_triple_and_run_identity()
    {
        object parameters = RunRecordParameters.Insert(Run());

        Read<Guid>(parameters, "RunId").Should().Be(RunId);
        Read<Guid>(parameters, "TenantId").Should().Be(TenantId);
        Read<Guid>(parameters, "WorkspaceId").Should().Be(WorkspaceId);
        Read<Guid>(parameters, "ScopeProjectId").Should().Be(ProjectId);
    }

    /// <summary>The row version drives the optimistic-concurrency predicate, so the update must carry it.</summary>
    [Fact]
    public void Update_carries_the_row_version()
    {
        RunRecord run = Run();
        run.RowVersion = [1, 2, 3, 4, 5, 6, 7, 8];

        Read<byte[]>(RunRecordParameters.Update(run), "RowVersion").Should().Equal(run.RowVersion);
    }

    /// <summary>CreatedUtc is set once on insert; the update path must not be able to rewrite it.</summary>
    [Fact]
    public void Update_omits_the_created_timestamp() =>
        HasProperty(RunRecordParameters.Update(Run()), "CreatedUtc").Should().BeFalse();

    [Fact]
    public void AnchorGuardKey_carries_only_the_row_identity()
    {
        object parameters = RunRecordParameters.AnchorGuardKey(Run());

        parameters.GetType()
            .GetProperties()
            .Select(static property => property.Name)
            .Should()
            .BeEquivalentTo("RunId", "TenantId", "WorkspaceId", "ScopeProjectId");
    }

    [Fact]
    public void ForRun_maps_the_scope_project_id_from_the_scope()
    {
        object parameters = RunRecordParameters.ForRun(Scope(), RunId);

        Read<Guid>(parameters, "RunId").Should().Be(RunId);
        Read<Guid>(parameters, "ScopeProjectId").Should().Be(ProjectId);
    }

    [Fact]
    public void ForOperatorGovernanceDisposition_trims_the_decision_and_actor()
    {
        DateTime occurredUtc = new(2026, 8, 11, 12, 0, 0, DateTimeKind.Utc);

        object parameters = RunRecordParameters.ForOperatorGovernanceDisposition(
            Scope(),
            RunId,
            "  Approved  ",
            "  rationale kept verbatim  ",
            "  user-1  ",
            occurredUtc);

        Read<string>(parameters, "Decision").Should().Be("Approved");
        Read<string>(parameters, "ActorUserId").Should().Be("user-1");
        Read<DateTime>(parameters, "OccurredUtc").Should().Be(occurredUtc);
    }

    /// <summary>Operator rationale is buyer-visible prose, so it is stored exactly as typed.</summary>
    [Fact]
    public void ForOperatorGovernanceDisposition_stores_the_rationale_verbatim() =>
        Read<string>(
                RunRecordParameters.ForOperatorGovernanceDisposition(
                    Scope(),
                    RunId,
                    "Approved",
                    "  spacing matters  ",
                    "user-1",
                    DateTime.UtcNow),
                "Rationale")
            .Should()
            .Be("  spacing matters  ");

    [Fact]
    public void Insert_rejects_a_null_run()
    {
        Action build = static () => RunRecordParameters.Insert(null!);

        build.Should().Throw<ArgumentNullException>();
    }

    [Fact]
    public void Update_rejects_a_null_run()
    {
        Action build = static () => RunRecordParameters.Update(null!);

        build.Should().Throw<ArgumentNullException>();
    }

    [Fact]
    public void AnchorGuardKey_rejects_a_null_run()
    {
        Action build = static () => RunRecordParameters.AnchorGuardKey(null!);

        build.Should().Throw<ArgumentNullException>();
    }

    private static RunRecord Run() =>
        new()
        {
            RunId = RunId,
            TenantId = TenantId,
            WorkspaceId = WorkspaceId,
            ScopeProjectId = ProjectId,
            ProjectId = "billing-platform",
            CreatedUtc = new DateTime(2026, 8, 11, 10, 0, 0, DateTimeKind.Utc),
            StructuralExecutionMode = StructuralExecutionMode.Real,
        };

    private static ScopeContext Scope() =>
        new()
        {
            TenantId = TenantId,
            WorkspaceId = WorkspaceId,
            ProjectId = ProjectId,
        };

    private static bool HasProperty(object parameters, string propertyName) =>
        parameters.GetType().GetProperty(propertyName) is not null;

    /// <summary>
    ///     Parameter objects are anonymous types shaped for Dapper, so tests read them by name via reflection rather than
    ///     forcing a named DTO the production path does not need.
    /// </summary>
    private static T Read<T>(object parameters, string propertyName)
    {
        PropertyInfo? property = parameters.GetType().GetProperty(propertyName);

        property.Should().NotBeNull($"parameter '{propertyName}' must be supplied to Dapper");

        object? value = property!.GetValue(parameters);

        value.Should().NotBeNull($"parameter '{propertyName}' must have a value");

        return (T)value!;
    }
}
