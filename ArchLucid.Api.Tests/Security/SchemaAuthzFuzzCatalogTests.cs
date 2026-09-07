using System.Text.Json;

using FluentAssertions;

namespace ArchLucid.Api.Tests.Security;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class SchemaAuthzFuzzCatalogTests
{
    [Fact]
    public void Classify_puts_authenticated_get_by_id_in_the_matrix_and_keeps_marketing_public()
    {
        const string json = """
            {
              "paths": {
                "/v1/marketing/sponsor-brief.pdf": {
                  "get": { "x-archlucid-audience": "buyer" }
                },
                "/v1/architecture/runs/{runId}": {
                  "get": { "x-archlucid-audience": "operator" }
                },
                "/health": {
                  "get": {}
                }
              }
            }
            """;

        using JsonDocument document = JsonDocument.Parse(json);
        IReadOnlyList<SchemaAuthzOperation> operations = SchemaAuthzFuzzCatalog.Classify(document.RootElement);

        operations.Should().HaveCount(3);
        operations.Should().Contain(op =>
            op.Path == "/v1/architecture/runs/{runId}" && op.InAuthzMatrix && !op.IsPublic);
        operations.Should().Contain(op =>
            op.Path == "/v1/marketing/sponsor-brief.pdf" && op.IsPublic && !op.InAuthzMatrix);
        operations.Should().Contain(op =>
            op.Path == "/health" && op.IsPublic && !op.InAuthzMatrix);
    }

    [Fact]
    public void Uncategorized_buyer_path_param_outside_known_prefixes_is_flagged()
    {
        const string json = """
            {
              "paths": {
                "/v1/mystery/{id}": {
                  "get": { "x-archlucid-audience": "buyer" }
                }
              }
            }
            """;

        using JsonDocument document = JsonDocument.Parse(json);
        IReadOnlyList<SchemaAuthzOperation> operations = SchemaAuthzFuzzCatalog.Classify(document.RootElement);
        IReadOnlyList<string> uncategorized = SchemaAuthzFuzzCatalog.UncategorizedPublicPaths(operations);

        uncategorized.Should().Contain("/v1/mystery/{id}");
    }

    [Fact]
    public void Committed_openapi_snapshot_has_in_matrix_get_by_id_operations()
    {
        string snapshotPath = Path.Combine(
            AppContext.BaseDirectory,
            "Contracts",
            "openapi-v1.contract.snapshot.json");

        if (!File.Exists(snapshotPath))
        {
            snapshotPath = Path.GetFullPath(
                Path.Combine(
                    AppContext.BaseDirectory,
                    "..",
                    "..",
                    "..",
                    "Contracts",
                    "openapi-v1.contract.snapshot.json"));
        }

        File.Exists(snapshotPath).Should().BeTrue($"OpenAPI snapshot should copy to output or sit next to tests: {snapshotPath}");
        using FileStream stream = File.OpenRead(snapshotPath);
        using JsonDocument document = JsonDocument.Parse(stream);
        IReadOnlyList<SchemaAuthzOperation> operations = SchemaAuthzFuzzCatalog.Classify(document.RootElement);

        operations.Count(static op => op.InAuthzMatrix && op.Method == "GET").Should().BeGreaterThan(0);
        operations.Should().Contain(op =>
            op.Method == "GET"
            && op.Path == "/v1/architecture/review/{runId}"
            && op.InAuthzMatrix
            && !op.IsPublic);
        SchemaAuthzFuzzCatalog.UncategorizedPublicPaths(operations).Should().BeEmpty();
    }
}
