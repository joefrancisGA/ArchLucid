using System.Text.Json;
using System.Text.Json.Serialization;

using ArchLucid.Api.Models;
using ArchLucid.Api.Serialization;
using ArchLucid.Contracts.Findings;
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
