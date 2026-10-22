using System.Text.Json;

using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Governance.PolicyPacks;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests;

/// <summary>
///     RC28f package-coverage batch: JSON enum converters, policy-pack distribution rules, and idempotent execute skip arms.
/// </summary>
[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class ContractsPackageCoverageBatchRc28fTests
{
    private static readonly JsonSerializerOptions RuntimePlatformOptions = new()
    {
        Converters = { new RuntimePlatformJsonConverter() },
    };

    private static readonly JsonSerializerOptions ServiceTypeOptions = new()
    {
        Converters = { new ServiceTypeJsonConverter() },
    };

    private static readonly JsonSerializerOptions DatastoreTypeOptions = new()
    {
        Converters = { new DatastoreTypeJsonConverter() },
    };

    private static readonly JsonSerializerOptions AgentTypeOptions = new()
    {
        Converters = { new AgentTypeJsonConverter() },
    };

    [Theory]
    [InlineData("\"azure-functions\"", RuntimePlatform.Functions)]
    [InlineData("\"Azure Kubernetes\"", RuntimePlatform.Aks)]
    [InlineData("\"azure-openai\"", RuntimePlatform.AzureOpenAi)]
    [InlineData("\"aws-s3\"", RuntimePlatform.S3)]
    [InlineData("\"gcp-compute\"", RuntimePlatform.ComputeEngine)]
    [InlineData("3", RuntimePlatform.Aks)]
    public void RuntimePlatformJsonConverter_Read_maps_aliases_numbers_and_enum_names(string json, RuntimePlatform expected)
    {
        RuntimePlatform value = JsonSerializer.Deserialize<RuntimePlatform>(json, RuntimePlatformOptions);

        value.Should().Be(expected);
    }

    [Theory]
    [InlineData("\"   \"")]
    [InlineData("\"not-a-real-platform-alias\"")]
    public void RuntimePlatformJsonConverter_Read_blank_or_unknown_returns_Unknown(string json)
    {
        RuntimePlatform value = JsonSerializer.Deserialize<RuntimePlatform>(json, RuntimePlatformOptions);

        value.Should().Be(RuntimePlatform.Unknown);
    }

    [Fact]
    public void RuntimePlatformJsonConverter_Read_throws_for_non_string_non_number_token()
    {
        FluentActions
            .Invoking(() => JsonSerializer.Deserialize<RuntimePlatform>("true", RuntimePlatformOptions))
            .Should()
            .Throw<JsonException>()
            .WithMessage("*Expected string or number*");
    }

    [Fact]
    public void RuntimePlatformJsonConverter_Write_emits_enum_name()
    {
        string json = JsonSerializer.Serialize(RuntimePlatform.Redis, RuntimePlatformOptions);

        json.Should().Be("\"Redis\"");
    }

    [Theory]
    [InlineData("\"micro-service\"", ServiceType.Api)]
    [InlineData("\"front-end\"", ServiceType.Ui)]
    [InlineData("\"retrieval\"", ServiceType.SearchService)]
    [InlineData("\"inference\"", ServiceType.AiService)]
    [InlineData("\"nosuchalias\"", ServiceType.Unknown)]
    [InlineData("2", ServiceType.Worker)]
    public void ServiceTypeJsonConverter_Read_maps_alias_matrix_and_integers(string json, ServiceType expected)
    {
        ServiceType value = JsonSerializer.Deserialize<ServiceType>(json, ServiceTypeOptions);

        value.Should().Be(expected);
    }

    [Fact]
    public void ServiceTypeJsonConverter_Read_throws_for_invalid_token()
    {
        FluentActions
            .Invoking(() => JsonSerializer.Deserialize<ServiceType>("[]", ServiceTypeOptions))
            .Should()
            .Throw<JsonException>()
            .WithMessage("*Expected string or number*");
    }

    [Theory]
    [InlineData("\"cosmosdb\"", DatastoreType.NoSql)]
    [InlineData("\"azure sql database\"", DatastoreType.Sql)]
    [InlineData("\"in-memory\"", DatastoreType.Cache)]
    [InlineData("\"vector\"", DatastoreType.Search)]
    [InlineData("\"blob storage\"", DatastoreType.Object)]
    [InlineData("1", DatastoreType.Sql)]
    public void DatastoreTypeJsonConverter_Read_maps_aliases_and_integers(string json, DatastoreType expected)
    {
        DatastoreType value = JsonSerializer.Deserialize<DatastoreType>(json, DatastoreTypeOptions);

        value.Should().Be(expected);
    }

    [Theory]
    [InlineData("1", AgentType.Topology)]
    [InlineData("2", AgentType.Cost)]
    public void AgentTypeJsonConverter_Read_maps_integer_values(string json, AgentType expected)
    {
        AgentType value = JsonSerializer.Deserialize<AgentType>(json, AgentTypeOptions);

        value.Should().Be(expected);
    }

    [Theory]
    [InlineData("\"   \"")]
    [InlineData("\"unknown-agent\"")]
    public void AgentTypeJsonConverter_Read_blank_or_unknown_throws(string json)
    {
        FluentActions
            .Invoking(() => JsonSerializer.Deserialize<AgentType>(json, AgentTypeOptions))
            .Should()
            .Throw<JsonException>();
    }

    [Fact]
    public void AgentTypeJsonConverter_Write_emits_dispatch_key()
    {
        string json = JsonSerializer.Serialize(AgentType.Compliance, AgentTypeOptions);

        json.Should().Be("\"compliance\"");
    }

    [Fact]
    public void PolicyPackDistributionScopeRules_ResolveForPackType_throws_for_unknown_pack_type()
    {
        FluentActions
            .Invoking(() => PolicyPackDistributionScopeRules.ResolveForPackType("VendorPack"))
            .Should()
            .Throw<ArgumentException>()
            .WithParameterName("packType");
    }

    [Fact]
    public void PolicyPackDistributionScopeRules_RejectReservedScope_throws_for_organization_shared()
    {
        FluentActions
            .Invoking(() => PolicyPackDistributionScopeRules.RejectReservedScope(PolicyPackDistributionScope.OrganizationShared))
            .Should()
            .Throw<ArgumentException>()
            .WithParameterName("distributionScope");
    }

    [Fact]
    public void AgentExecuteIdempotentResultPolicy_ShouldSkipRetry_returns_true_when_findings_present()
    {
        AgentResult result = new()
        {
            TaskId = "task-findings",
            RunId = "run-1",
            AgentType = AgentType.Topology,
            Findings =
            [
                new ArchitectureFinding
                {
                    Category = "Security",
                    Message = "Public endpoint exposed.",
                },
            ],
        };

        bool skip = AgentExecuteIdempotentResultPolicy.ShouldSkipRetry(result, out string? reason);

        skip.Should().BeTrue();
        reason.Should().Be(AgentExecuteIdempotentSkipReasonCodes.PersistedSuccessfulResult);
    }

    [Fact]
    public void AgentExecuteIdempotentResultPolicy_ShouldSkipRetry_returns_true_when_confidence_positive()
    {
        AgentResult result = new()
        {
            TaskId = "task-confidence",
            RunId = "run-1",
            AgentType = AgentType.Cost,
            Confidence = 0.42,
        };

        bool skip = AgentExecuteIdempotentResultPolicy.ShouldSkipRetry(result, out string? reason);

        skip.Should().BeTrue();
        reason.Should().Be(AgentExecuteIdempotentSkipReasonCodes.PersistedSuccessfulResult);
    }

    [Fact]
    public void AgentExecuteIdempotentResultPolicy_ShouldSkipRetry_returns_false_when_existing_null()
    {
        AgentExecuteIdempotentResultPolicy.ShouldSkipRetry(null, out string? reason).Should().BeFalse();
        reason.Should().BeNull();
    }
}
