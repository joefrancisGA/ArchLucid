using ArchLucid.Api.Models;
using ArchLucid.Api.Models.Coverage;
using ArchLucid.Api.Validation;
using ArchLucid.Core.Configuration.Summary;

using FluentAssertions;

namespace ArchLucid.Api.Tests.Validation;

[Trait("Category", "Unit")]
[Trait("Suite", "Api")]
public sealed class ApiRequestNullCollectionElementsGuardTests
{
    [Fact]
    public void ContainsNullCollectionElement_returns_false_for_null_root()
    {
        ApiRequestNullCollectionElementsGuard.ContainsNullCollectionElement(null).Should().BeFalse();
    }

    [Fact]
    public void ContainsNullCollectionElement_returns_false_for_empty_entries()
    {
        PutRunCoverageAcknowledgementRequest request = new() { Entries = [] };

        ApiRequestNullCollectionElementsGuard.ContainsNullCollectionElement(request).Should().BeFalse();
    }

    [Fact]
    public void ContainsNullCollectionElement_returns_true_for_null_entry_element()
    {
        PutRunCoverageAcknowledgementRequest request = new()
        {
            Entries = new RunCoverageAcknowledgementEntryRequest[] { null! },
        };

        ApiRequestNullCollectionElementsGuard.ContainsNullCollectionElement(request).Should().BeTrue();
    }

    [Fact]
    public void ContainsNullCollectionElement_ignores_byte_arrays()
    {
        byte[] payload = [0x01, 0x00];

        ApiRequestNullCollectionElementsGuard.ContainsNullCollectionElement(payload).Should().BeFalse();
    }

    [Fact]
    public void ContainsNullCollectionElement_allows_null_elements_when_property_annotated_nullable()
    {
        NullableStringListRequest request = new()
        {
            Tags = new List<string?> { "ok", null },
        };

        ApiRequestNullCollectionElementsGuard.ContainsNullCollectionElement(request).Should().BeFalse();
    }

    [Fact]
    public void ContainsNullCollectionElement_rejects_null_elements_when_property_annotated_non_nullable()
    {
        NonNullableStringListRequest request = new()
        {
            Tags = new List<string> { "ok", null! },
        };

        ApiRequestNullCollectionElementsGuard.ContainsNullCollectionElement(request).Should().BeTrue();
    }

    [Fact]
    public void ContainsNullCollectionElement_allows_null_elements_in_nullable_value_type_array()
    {
        NullableIntArrayRequest request = new()
        {
            Values = new int?[] { 1, null },
        };

        ApiRequestNullCollectionElementsGuard.ContainsNullCollectionElement(request).Should().BeFalse();
    }

    [Fact]
    public void ContainsNullCollectionElement_returns_true_for_null_non_nullable_collection_property()
    {
        WorkspaceAllowedEngineSetUpdateRequest request = new()
        {
            AllowedAliasIds = null!,
            DefaultAliasId = "gpt-4",
        };

        ApiRequestNullCollectionElementsGuard.ContainsNullCollectionElement(request).Should().BeTrue();
    }

    [Fact]
    public void ContainsNullCollectionElement_allows_null_nullable_collection_property()
    {
        NullableCollectionPropertyRequest request = new()
        {
            Tags = null,
        };

        ApiRequestNullCollectionElementsGuard.ContainsNullCollectionElement(request).Should().BeFalse();
    }

    [Fact]
    public void ContainsNullCollectionElement_returns_true_for_null_dictionary_value_on_non_nullable_value_type()
    {
        PolicyPackDryRunRequest request = new();
        request.ProposedThresholds["threshold"] = null!;

        ApiRequestNullCollectionElementsGuard.ContainsNullCollectionElement(request).Should().BeTrue();
    }

    [Fact]
    public void ContainsNullCollectionElement_allows_null_dictionary_value_when_value_type_is_nullable()
    {
        NullableDictionaryValueRequest request = new()
        {
            Metadata = new Dictionary<string, string?> { ["k"] = null },
        };

        ApiRequestNullCollectionElementsGuard.ContainsNullCollectionElement(request).Should().BeFalse();
    }

    private sealed class NullableStringListRequest
    {
        public List<string?> Tags { get; set; } = [];
    }

    private sealed class NonNullableStringListRequest
    {
        public List<string> Tags { get; set; } = [];
    }

    private sealed class NullableIntArrayRequest
    {
        public int?[] Values { get; set; } = [];
    }

    private sealed class NullableCollectionPropertyRequest
    {
        public List<string>? Tags { get; set; }
    }

    private sealed class NullableDictionaryValueRequest
    {
        public Dictionary<string, string?> Metadata { get; set; } = new();
    }
}
