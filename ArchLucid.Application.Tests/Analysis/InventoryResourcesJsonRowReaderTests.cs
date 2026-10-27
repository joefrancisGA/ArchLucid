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
    public void TryGetTrimmedString_reads_parent_under_configuration_properties_in_related_events_shape()
    {
        using JsonDocument document = JsonDocument.Parse(
            """
            {
              "attributes": {
                "supplementaryConfiguration": {
                  "configuration": {
                    "properties": {
                      "parent": "//compute.googleapis.com/projects/demo-project/zones/us-central1-a"
                    }
                  }
                }
              }
            }
            """);

        string? parent = InventoryResourcesJsonRowReader.TryGetTrimmedString(document.RootElement, ["parent"]);

        parent.Should().Be("//compute.googleapis.com/projects/demo-project/zones/us-central1-a");
    }

    [Fact]
    public void TryGetTrimmedString_reads_parent_from_full_related_events_wrapper_json()
    {
        using JsonDocument document = JsonDocument.Parse(
            """
            {
              "relatedEvents": [
                {
                  "attributes": {
                    "supplementaryConfiguration": {
                      "configuration": {
                        "properties": {
                          "parent": "//compute.googleapis.com/projects/demo-project/zones/us-central1-a"
                        }
                      }
                    }
                  }
                }
              ]
            }
            """);

        JsonElement root = document.RootElement;
        JsonElement unwrapped = root.GetProperty("relatedEvents")[0];

        string? parent = InventoryResourcesJsonRowReader.TryGetTrimmedString(unwrapped, ["parent"]);

        parent.Should().Be("//compute.googleapis.com/projects/demo-project/zones/us-central1-a");
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
