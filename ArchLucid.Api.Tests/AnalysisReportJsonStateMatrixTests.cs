using System.Text.Json;

using ArchLucid.Api.Models;
using ArchLucid.Api.Serialization;
using ArchLucid.Application.Tests.Exports;

using FluentAssertions;

using static ArchLucid.Application.Tests.Exports.ReportEvidenceStateMatrixTests;

namespace ArchLucid.Api.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class AnalysisReportJsonStateMatrixTests
{
    [Theory]
    [InlineData(StoredTraces.Missing, null)]
    [InlineData(StoredTraces.Empty, 0)]
    [InlineData(StoredTraces.Populated, 1)]
    public void Analysis_report_wire_json_preserves_execution_trace_presence(StoredTraces state, int? expectedCount)
    {
        using JsonDocument payload = SerializeAnalysisResponse(parent: null, state);
        JsonElement traces = payload.RootElement.GetProperty("report").GetProperty("executionTraces");

        if (expectedCount is int count)
        {
            traces.GetArrayLength().Should().Be(count);
            if (count > 0)
            {
                traces[0].GetProperty("traceId").GetString().Should().Be("order-trace-1");
            }
        }
        else
        {
            traces.ValueKind.Should().Be(JsonValueKind.Null);
        }
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("  ")]
    [InlineData("version-17")]
    public void Analysis_report_wire_json_preserves_parent_manifest_version(string? storedParent)
    {
        using JsonDocument payload = SerializeAnalysisResponse(storedParent, StoredTraces.Missing);
        JsonElement parent = payload.RootElement.GetProperty("report").GetProperty("manifest")
            .GetProperty("metadata").GetProperty("parentManifestVersion");

        if (storedParent is null)
        {
            parent.ValueKind.Should().Be(JsonValueKind.Null);
        }
        else
        {
            parent.GetString().Should().Be(storedParent);
        }
    }

    private static JsonDocument SerializeAnalysisResponse(string? parent, StoredTraces traceState) =>
        JsonDocument.Parse(JsonSerializer.SerializeToUtf8Bytes(
            new ArchLucid.Api.Models.ArchitectureAnalysisReportResponse { Report = ReportEvidenceStateMatrixTests.Report(parent, traceState) },
            ArchLucidApiJsonSerializerOptions.Web));
}
