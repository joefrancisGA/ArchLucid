using System.Text.Json;

using ArchLucid.Application.Analysis;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Analysis;

[Trait("Category", "Unit")]
public sealed class InventoryResourcesJsonRowReaderTests
{
    [Fact]
    public void TryGetTrimmedString_reads_arn_from_json_api_attributes_on_included_row()
    {
        using JsonDocument document = JsonDocument.Parse(
            """
            {
              "type": "awsResources",
              "id": "1",
              "attributes": {
                "arn": "arn:aws:s3:::bucket-from-attributes"
              }
            }
            """);

        string? arn = InventoryResourcesJsonRowReader.TryGetTrimmedString(
            document.RootElement,
            ["arn", "name"]);

        arn.Should().Be("arn:aws:s3:::bucket-from-attributes");
    }

    [Fact]
    public void EnumerateResourceRows_yields_relationship_data_row_and_included_sidecar_rows()
    {
        using JsonDocument document = JsonDocument.Parse(
            """
            {
              "data": [
                {
                  "type": "inventoryRecords",
                  "relationships": {
                    "cloudResource": {
                      "data": { "type": "awsResources", "id": "1" }
                    }
                  }
                }
              ],
              "included": [
                {
                  "type": "awsResources",
                  "id": "1",
                  "attributes": {
                    "arn": "arn:aws:ec2:us-east-1:1:instance/i"
                  }
                }
              ]
            }
            """);

        List<JsonElement> rows = InventoryResourcesJsonRowReader.EnumerateResourceRows(document.RootElement).ToList();

        rows.Should().HaveCount(2);

        string[] inventoryKeys =
        [
            "name",
            "resourceName",
            "arn",
            "resourceArn",
            "awsResourceId",
            "identifier",
            "id",
            "tf.id",
            "tf.arn",
            "tf.resource_id",
        ];

        HashSet<string> ids = new(StringComparer.OrdinalIgnoreCase);

        foreach (JsonElement row in rows)
        {
            JsonElement effectiveRow = row;

            if (InventoryResourcesJsonRowReader.TryResolveIncludedResourceRow(
                    document.RootElement,
                    row,
                    out JsonElement includedRow))
                effectiveRow = includedRow;

            string? value = InventoryResourcesJsonRowReader.TryGetTrimmedString(effectiveRow, inventoryKeys);

            if (!string.IsNullOrWhiteSpace(value) && value.Trim().StartsWith("arn:", StringComparison.OrdinalIgnoreCase))
                ids.Add(value.Trim().ToLowerInvariant());
        }

        ids.Should().ContainSingle().Which.Should().Be("arn:aws:ec2:us-east-1:1:instance/i");
    }
}
