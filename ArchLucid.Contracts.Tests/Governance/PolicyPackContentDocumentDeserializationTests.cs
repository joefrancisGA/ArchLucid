using System.Text.Json;

using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Governance;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.Governance;

[Trait("Category", "Unit")]
public sealed class PolicyPackContentDocumentDeserializationTests
{
    [Fact]
    public void Deserialize_null_metadata_yields_empty_ordinal_ignore_case_dictionary_not_null()
    {
        const string json = """
            {
              "metadata": null
            }
            """;

        PolicyPackContentDocument document =
            JsonSerializer.Deserialize<PolicyPackContentDocument>(json, ContractJson.Default)!;

        document.Metadata.Should().NotBeNull().And.BeEmpty();
        document.Metadata["PackId"] = "baseline";
        document.Metadata.Should().ContainKey("packid");
    }
}
