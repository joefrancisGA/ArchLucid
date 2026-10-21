using ArchLucid.Api.Models.Coverage;
using ArchLucid.Api.Validation;

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
}
