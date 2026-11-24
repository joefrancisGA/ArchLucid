using System.Text.Json;
using System.Text.Json.Serialization;

using ArchLucid.Api.Models;
using ArchLucid.Api.Serialization;
using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Governance;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Pagination;

using FluentAssertions;

using Microsoft.AspNetCore.Mvc;

namespace ArchLucid.Architecture.Tests;

[Trait("Category", "Unit")]
public sealed class ArchLucidApiJsonSourceGenerationTests
{
    private static readonly JsonSerializerOptions ReflectionBaselineOptions = CreateReflectionBaselineOptions();

    [Fact]
    public void CallerIdentityResponse_serializes_identically_to_reflection_baseline()
    {
        CallerIdentityResponse sample = new()
        {
            Name = "Pat Operator",
            Claims =
            [
                new CallerClaimResponse { Type = "role", Value = "Architect" },
                new CallerClaimResponse { Type = "sub", Value = "user-42" },
            ],
            HasCommittedArchitectureReview = true,
        };

        AssertWireParity(sample);
    }

    [Fact]
    public void Run_list_page_serializes_identically_to_reflection_baseline()
    {
        CursorPagedResponse<RunListItemResponse> sample = new()
        {
            Items =
            [
                new RunListItemResponse
                {
                    RunId = "abc",
                    RequestId = "req-1",
                    Status = "Committed",
                    CreatedUtc = new DateTime(2026, 8, 10, 12, 0, 0, DateTimeKind.Utc),
                    CompletedUtc = new DateTime(2026, 8, 10, 12, 5, 0, DateTimeKind.Utc),
                    CurrentManifestVersion = "v3",
                    SystemName = "Payments",
                    PackageOrigin = "Reviewed",
                },
            ],
            NextCursor = "cursor-1",
            HasMore = true,
            RequestedTake = 25,
        };

        AssertWireParity(sample);
    }

    [Fact]
    public void Finding_metadata_page_serializes_identically_to_reflection_baseline()
    {
        FindingRecordMetadataPage sample = new(
            [
                new FindingRecordMetadataRow(
                    Guid.Parse("aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee"),
                    1,
                    "F-001",
                    "PolicyViolation",
                    "Security",
                    "DeterministicRule",
                    "High",
                    "Missing encryption",
                    2),
            ],
            HasMore: false);

        AssertWireParity(sample);
    }

    [Fact]
    public void Audit_keyset_page_serializes_identically_to_reflection_baseline()
    {
        CursorPagedResponse<AuditEvent> sample = new()
        {
            Items =
            [
                new AuditEvent
                {
                    EventId = Guid.Parse("bbbbbbbb-cccc-dddd-eeee-ffffffffffff"),
                    OccurredUtc = new DateTime(2026, 8, 10, 11, 0, 0, DateTimeKind.Utc),
                    EventType = "RunCreated",
                    ActorUserId = "actor-1",
                    ActorUserName = "Actor",
                    TenantId = Guid.Parse("cccccccc-dddd-eeee-ffff-000000000001"),
                    WorkspaceId = Guid.Parse("dddddddd-eeee-ffff-0000-111111111111"),
                    ProjectId = Guid.Parse("eeeeeeee-ffff-0000-1111-222222222222"),
                    DataJson = "{}",
                },
            ],
            HasMore = false,
            RequestedTake = 50,
        };

        AssertWireParity(sample);
    }

    [Fact]
    public void ValidationProblemDetails_serializes_identically_to_reflection_baseline()
    {
        ValidationProblemDetails sample = new(
            new Dictionary<string, string[]>
            {
                ["field"] = ["required"],
            })
        {
            Type = "https://example.com/validation",
            Title = "Validation failed",
            Status = 400,
            Detail = "One or more fields are invalid.",
        };

        AssertWireParity(sample);
    }

    public enum SampleEnum { First = 1, Second = 2, Third = 3 }

    [Flags]
    public enum SampleFlags { None = 0, Read = 1, Write = 2 }

    [Theory]
    [InlineData("2147483647")]
    [InlineData("\"2147483647\"")]
    [InlineData("\"First,Second\"")]
    [InlineData("0")]
    public void Undefined_or_composite_ordinary_enum_json_is_rejected(string json)
    {
        Action read = () => JsonSerializer.Deserialize<SampleEnum>(json, ArchLucidApiJsonSerializerOptions.Web);
        read.Should().Throw<JsonException>();
    }

    [Theory]
    [InlineData("1", SampleEnum.First)]
    [InlineData("\"second\"", SampleEnum.Second)]
    [InlineData("\"3\"", SampleEnum.Third)]
    public void Defined_enum_wire_forms_remain_compatible(string json, SampleEnum expected)
    {
        JsonSerializer.Deserialize<SampleEnum>(json, ArchLucidApiJsonSerializerOptions.Web).Should().Be(expected);
        JsonSerializer.Serialize(expected, ArchLucidApiJsonSerializerOptions.Web)
            .Should().Be(JsonSerializer.Serialize(expected, ReflectionBaselineOptions));
    }

    [Fact]
    public void Nullable_and_dictionary_key_enums_are_validated()
    {
        JsonSerializer.Deserialize<SampleEnum?>("null", ArchLucidApiJsonSerializerOptions.Web).Should().BeNull();
        Action nullable = () => JsonSerializer.Deserialize<SampleEnum?>("99", ArchLucidApiJsonSerializerOptions.Web);
        Action dictionary = () => JsonSerializer.Deserialize<Dictionary<SampleEnum, int>>(
            """{"99":1}""", ArchLucidApiJsonSerializerOptions.Web);
        nullable.Should().Throw<JsonException>();
        dictionary.Should().Throw<JsonException>();
    }

    [Fact]
    public void Flags_accept_declared_bit_combinations_but_reject_unknown_bits()
    {
        JsonSerializer.Deserialize<SampleFlags>("3", ArchLucidApiJsonSerializerOptions.Web)
            .Should().Be(SampleFlags.Read | SampleFlags.Write);
        Action read = () => JsonSerializer.Deserialize<SampleFlags>("4", ArchLucidApiJsonSerializerOptions.Web);
        read.Should().Throw<JsonException>();
    }

    [Fact]
    public void Source_generated_run_summary_rejects_undefined_lifecycle_phase()
    {
        Action read = () => JsonSerializer.Deserialize<RunSummary>(
            """{"authorityLifecyclePhase":2147483647}""", ArchLucidApiJsonSerializerOptions.Web);
        read.Should().Throw<JsonException>();
    }

    [Fact]
    public void Operator_disposition_requires_explicit_decision()
    {
        Action missing = () => JsonSerializer.Deserialize<RecordRunOperatorGovernanceDispositionRequest>(
            """{"rationale":"reason"}""", ArchLucidApiJsonSerializerOptions.Web);
        missing.Should().Throw<JsonException>();

        JsonSerializer.Deserialize<RecordRunOperatorGovernanceDispositionRequest>(
                """{"decision":0,"rationale":"reason"}""", ArchLucidApiJsonSerializerOptions.Web)!
            .Decision.Should().Be(RunOperatorGovernanceDecision.Approved);
    }

    private static void AssertWireParity<T>(T sample)
    {
        byte[] reflectionBytes = JsonSerializer.SerializeToUtf8Bytes(sample, ReflectionBaselineOptions);
        byte[] sourceGenBytes = JsonSerializer.SerializeToUtf8Bytes(sample, ArchLucidApiJsonSerializerOptions.Web);

        sourceGenBytes.Should().Equal(reflectionBytes);
    }

    private static JsonSerializerOptions CreateReflectionBaselineOptions()
    {
        JsonSerializerOptions options = new(JsonSerializerDefaults.Web)
        {
            DictionaryKeyPolicy = JsonNamingPolicy.CamelCase,
            PropertyNameCaseInsensitive = true,
        };
        options.Converters.Add(new JsonStringEnumConverter(null, allowIntegerValues: true));

        return options;
    }
}
