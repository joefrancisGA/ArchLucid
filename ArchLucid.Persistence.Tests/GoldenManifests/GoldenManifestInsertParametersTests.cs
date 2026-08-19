using System.Reflection;

using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Governance.Resolution;
using ArchLucid.Core.Manifest;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.GoldenManifests;

using FluentAssertions;

namespace ArchLucid.Persistence.Tests.GoldenManifests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class GoldenManifestInsertParametersTests
{
    private static readonly Guid TenantId = Guid.Parse("aaaaaaaa-0000-0000-0000-000000000001");
    private static readonly Guid WorkspaceId = Guid.Parse("aaaaaaaa-0000-0000-0000-000000000002");
    private static readonly Guid ProjectId = Guid.Parse("aaaaaaaa-0000-0000-0000-000000000003");
    private static readonly Guid ManifestId = Guid.Parse("bbbbbbbb-0000-0000-0000-000000000001");

    [Fact]
    public void Create_persists_a_new_manifest_as_active()
    {
        object parameters = CreateParameters();

        Read<string>(parameters, "LifecycleStatus")
            .Should()
            .Be(nameof(GoldenManifestLifecycleStatus.Active));
    }

    [Fact]
    public void Create_carries_the_serialized_payload_slices()
    {
        ManifestDocument manifest = Manifest();
        manifest.Assumptions.Add("single-region deployment");

        GoldenManifestSerializedPayload payload = GoldenManifestSerializedPayload.FromDocument(manifest);
        object parameters = GoldenManifestInsertParameters.Create(manifest, payload, manifestPayloadBlobUri: null);

        Read<string>(parameters, "AssumptionsJson").Should().Be(payload.AssumptionsJson);
        Read<string>(parameters, "AssumptionsJson").Should().Contain("single-region deployment");
    }

    /// <summary>A null blob URI is what tells the read path the payload is in-row rather than offloaded.</summary>
    [Fact]
    public void Create_leaves_the_blob_uri_null_for_an_in_row_payload() =>
        ReadOrNull(CreateParameters(), "ManifestPayloadBlobUri").Should().BeNull();

    [Fact]
    public void Create_records_the_blob_uri_when_the_payload_was_offloaded()
    {
        ManifestDocument manifest = Manifest();

        object parameters = GoldenManifestInsertParameters.Create(
            manifest,
            GoldenManifestSerializedPayload.FromDocument(manifest),
            "https://blobs/golden-manifests/manifest.json");

        Read<string>(parameters, "ManifestPayloadBlobUri")
            .Should()
            .Be("https://blobs/golden-manifests/manifest.json");
    }

    [Fact]
    public void ForSupersede_retires_active_rows_only()
    {
        object parameters = GoldenManifestInsertParameters.ForSupersede(Scope(), ManifestId);

        Read<string>(parameters, "ActiveStatus").Should().Be(nameof(GoldenManifestLifecycleStatus.Active));
        Read<string>(parameters, "SupersededStatus").Should().Be(nameof(GoldenManifestLifecycleStatus.Superseded));
        Read<Guid>(parameters, "NewManifestId").Should().Be(ManifestId);
    }

    [Fact]
    public void ForManifest_carries_the_scope_triple()
    {
        object parameters = GoldenManifestInsertParameters.ForManifest(Scope(), ManifestId);

        Read<Guid>(parameters, "TenantId").Should().Be(TenantId);
        Read<Guid>(parameters, "WorkspaceId").Should().Be(WorkspaceId);
        Read<Guid>(parameters, "ProjectId").Should().Be(ProjectId);
        Read<Guid>(parameters, "ManifestId").Should().Be(ManifestId);
    }

    [Fact]
    public void ForPriorRetrieval_passes_the_excluded_run_and_row_cap()
    {
        Guid excludeRunId = Guid.Parse("cccccccc-0000-0000-0000-000000000001");

        object parameters = GoldenManifestInsertParameters.ForPriorRetrieval(Scope(), excludeRunId, 25);

        Read<Guid>(parameters, "ExcludeRunId").Should().Be(excludeRunId);
        Read<int>(parameters, "MaxManifests").Should().Be(25);
    }

    [Fact]
    public void ForContractManifestVersion_passes_the_requested_version() =>
        Read<string>(
                GoldenManifestInsertParameters.ForContractManifestVersion(Scope(), "2026.08.1"),
                "ManifestVersion")
            .Should()
            .Be("2026.08.1");

    [Fact]
    public void SliceScope_keys_slice_counts_by_manifest_and_scope()
    {
        object parameters = GoldenManifestInsertParameters.SliceScope(Manifest());

        Read<Guid>(parameters, "ManifestId").Should().Be(ManifestId);
        Read<Guid>(parameters, "TenantId").Should().Be(TenantId);
        Read<Guid>(parameters, "WorkspaceId").Should().Be(WorkspaceId);
        Read<Guid>(parameters, "ProjectId").Should().Be(ProjectId);
    }

    [Fact]
    public void DecisionRow_projects_the_decision_and_its_confidence_source()
    {
        ResolvedArchitectureDecision decision = new()
        {
            DecisionId = "d-1",
            Category = "Networking",
            Title = "Private endpoints",
            SelectedOption = "Private endpoint per service",
            Rationale = "Deny-by-default networking",
            Confidence = 0.8,
        };

        object parameters = GoldenManifestInsertParameters.DecisionRow(Manifest(), 3, decision);

        Read<int>(parameters, "SortOrder").Should().Be(3);
        Read<string>(parameters, "DecisionId").Should().Be("d-1");
        Read<string>(parameters, "ConfidenceSource").Should().Be(decision.ConfidenceSource.ToString());
    }

    [Theory]
    [InlineData(null, null)]
    [InlineData("", null)]
    [InlineData("   ", null)]
    [InlineData("1.2.3", "1.2.3")]
    [InlineData("  1.2.3  ", "1.2.3")]
    public void ResolveContractManifestVersion_normalizes_the_metadata_version(string? version, string? expected)
    {
        ManifestDocument manifest = Manifest();
        manifest.Metadata.Version = version!;

        GoldenManifestInsertParameters.ResolveContractManifestVersion(manifest).Should().Be(expected);
    }

    /// <summary>The typed column is NVARCHAR(128), so a longer metadata version is truncated rather than rejected.</summary>
    [Fact]
    public void ResolveContractManifestVersion_truncates_to_the_column_width()
    {
        ManifestDocument manifest = Manifest();
        manifest.Metadata.Version = new string('v', 200);

        GoldenManifestInsertParameters.ResolveContractManifestVersion(manifest)!.Should().HaveLength(128);
    }

    private static object CreateParameters()
    {
        ManifestDocument manifest = Manifest();

        return GoldenManifestInsertParameters.Create(
            manifest,
            GoldenManifestSerializedPayload.FromDocument(manifest),
            manifestPayloadBlobUri: null);
    }

    private static ManifestDocument Manifest() =>
        new()
        {
            TenantId = TenantId,
            WorkspaceId = WorkspaceId,
            ProjectId = ProjectId,
            ManifestId = ManifestId,
            ManifestHash = "hash",
            RuleSetId = "rules",
            RuleSetVersion = "1",
            RuleSetHash = "rules-hash",
        };

    private static ScopeContext Scope() =>
        new()
        {
            TenantId = TenantId,
            WorkspaceId = WorkspaceId,
            ProjectId = ProjectId,
        };

    /// <summary>
    ///     Parameter objects are anonymous types shaped for Dapper, so tests read them by name via reflection rather than
    ///     forcing a named DTO the production path does not need.
    /// </summary>
    private static T Read<T>(object parameters, string propertyName)
    {
        object? value = ReadOrNull(parameters, propertyName);

        value.Should().NotBeNull($"parameter '{propertyName}' must be supplied to Dapper");

        return (T)value!;
    }

    private static object? ReadOrNull(object parameters, string propertyName)
    {
        PropertyInfo? property = parameters.GetType().GetProperty(propertyName);

        property.Should().NotBeNull($"parameter '{propertyName}' must be supplied to Dapper");

        return property!.GetValue(parameters);
    }
}
