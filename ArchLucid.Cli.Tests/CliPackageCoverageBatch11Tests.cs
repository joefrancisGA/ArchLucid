using System.Net;
using System.Text;

using ArchLucid.Cli;
using ArchLucid.Cli.Commands;
using ArchLucid.Cli.SecondRun;

using FluentAssertions;

namespace ArchLucid.Cli.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class CliPackageCoverageBatch11Tests
{
    [Fact]
    public void SecondRunInputParser_ParseFromFile_reads_valid_toml_file()
    {
        string tempPath = Path.Combine(Path.GetTempPath(), "archlucid-second-run-" + Guid.NewGuid().ToString("N") + ".toml");

        try
        {
            File.WriteAllText(
                tempPath,
                """
                name = "Batch.Eleven"
                description = "At least ten characters here for validation."
                public_endpoints = ["https://api.example.com"]
                request_id = "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee"
                """);

            SecondRunParseOutcome outcome = SecondRunInputParser.ParseFromFile(tempPath);

            outcome.IsSuccess.Should().BeTrue();
            outcome.Request!.SystemName.Should().Be("Batch.Eleven");
            outcome.Request!.RequestId.Should().Be("aaaaaaaabbbbccccddddeeeeeeeeeeee");
            outcome.Request.InlineRequirements.Should().Contain("Public endpoint: https://api.example.com");
        }
        finally
        {
            if (File.Exists(tempPath))
            {
                try
                {
                    File.Delete(tempPath);
                }
                catch (IOException)
                {
                    // Best-effort cleanup for temp probe file.
                }
            }
        }
    }

    [Theory]
    [InlineData(null)]
    [InlineData(" ")]
    public void SecondRunInputParser_ParseFromFile_rejects_blank_path(string? path)
    {
        SecondRunParseOutcome outcome = SecondRunInputParser.ParseFromFile(path!);

        outcome.IsSuccess.Should().BeFalse();
        outcome.FailureCode.Should().Be(SecondRunParseFailureCode.BadRequest);
    }

    [Fact]
    public void SecondRunInputParser_ParseFromFile_returns_not_found_for_missing_file()
    {
        string missing = Path.Combine(Path.GetTempPath(), Guid.NewGuid().ToString("N") + ".toml");

        SecondRunParseOutcome outcome = SecondRunInputParser.ParseFromFile(missing);

        outcome.IsSuccess.Should().BeFalse();
        outcome.Message.Should().Contain("File not found");
    }

    [Fact]
    public void SecondRunInputParser_rejects_short_description_and_overlong_request_id()
    {
        const string shortDescription = """
                                      name = "Svc"
                                      description = "short"
                                      """;

        SecondRunParseOutcome shortOutcome =
            SecondRunInputParser.ParseFromUtf8(Encoding.UTF8.GetBytes(shortDescription), "short.toml");

        shortOutcome.IsSuccess.Should().BeFalse();
        shortOutcome.Message.Should().Contain("at least 10 characters");

        string longRequestId = new string('a', 65);
        string longIdJson = $$"""
                              {"name":"Svc","description":"1234567890abcdefghij","request_id":"{{longRequestId}}"}
                              """;

        SecondRunParseOutcome longOutcome =
            SecondRunInputParser.ParseFromUtf8(Encoding.UTF8.GetBytes(longIdJson), "long-id.json");

        longOutcome.IsSuccess.Should().BeFalse();
        longOutcome.Message.Should().Contain("request_id");
    }

    [Fact]
    public void SecondRunInputParser_toml_scalar_list_coercion_maps_integers_and_booleans()
    {
        const string toml = """
                            name = "Svc"
                            description = "At least ten characters here for validation."
                            components = [1, true, "api"]
                            constraints = "single-value"
                            """;

        SecondRunParseOutcome outcome =
            SecondRunInputParser.ParseFromUtf8(Encoding.UTF8.GetBytes(toml), "scalar.toml");

        outcome.IsSuccess.Should().BeTrue();
        outcome.Request!.RequiredCapabilities.Should().Contain(["1", "True", "api"]);
        outcome.Request.Constraints.Should().ContainSingle("single-value");
    }

    [Fact]
    public void SponsorPacketBuyerDecisionBriefBuilder_BuildFromDirectory_reads_packet_files()
    {
        string packetDir = Path.Combine(Path.GetTempPath(), "archlucid-sponsor-packet-" + Guid.NewGuid().ToString("N"));

        try
        {
            Directory.CreateDirectory(packetDir);

            File.WriteAllText(
                Path.Combine(packetDir, SponsorPacketArtifactCatalog.PackManifestFileName),
                """
                {
                  "formatVersion": "1.0",
                  "generatedUtc": "2026-07-24T00:00:00Z",
                  "runId": "run-batch-11",
                  "demoDataWarning": false,
                  "files": []
                }
                """);

            File.WriteAllText(
                Path.Combine(packetDir, SponsorPacketArtifactCatalog.SponsorReportFileName),
                """
                {
                  "totalEstimatedUsdSavings": 50000,
                  "headlineSavingsScopeDescription": "Committed findings",
                  "systemCount": 2
                }
                """);

            File.WriteAllText(
                Path.Combine(packetDir, "limitations.md"),
                """
                # Limitations

                ## Warn reasons

                - Demo data only
                """);

            File.WriteAllText(
                Path.Combine(packetDir, SponsorPacketArtifactCatalog.FirstValueReportFileName),
                """
                # First value report

                This committed run identified material savings.

                ## Execution provenance

                | Field | Value |
                | --- | --- |
                | Mode | Simulator |
                """);

            string brief = SponsorPacketBuyerDecisionBriefBuilder.BuildFromDirectory(packetDir);

            brief.Should().Contain("run-batch-11");
            brief.Should().Contain("50,000");
            brief.Should().Contain("Demo data only");
            brief.Should().Contain("Simulator");
        }
        finally
        {
            try
            {
                Directory.Delete(packetDir, recursive: true);
            }
            catch (IOException)
            {
                // Best-effort cleanup for temp probe directory.
            }
        }
    }

    [Fact]
    public async Task ArchLucidApiClient_GetBoundedUtf8BodyAsync_truncates_large_response()
    {
        StubHttpMessageHandler handler = new();
        handler.Enqueue(
            new HttpResponseMessage(HttpStatusCode.OK)
            {
                Content = new StringContent(new string('x', 64), Encoding.UTF8, "text/plain"),
            });

        using HttpClient http = new(handler) { BaseAddress = new Uri("https://api.example/") };
        ArchLucidApiClient client = new(http);

        (int statusCode, string preview, bool truncated) =
            await client.GetBoundedUtf8BodyAsync("/health/live", maxBytes: 16, CancellationToken.None);

        statusCode.Should().Be(200);
        preview.Should().HaveLength(16);
        truncated.Should().BeTrue();
    }

    private sealed class StubHttpMessageHandler : HttpMessageHandler
    {
        private readonly Queue<HttpResponseMessage> _responses = new();

        internal void Enqueue(HttpResponseMessage response)
        {
            _responses.Enqueue(response);
        }

        protected override Task<HttpResponseMessage> SendAsync(
            HttpRequestMessage request,
            CancellationToken cancellationToken)
        {
            if (_responses.Count == 0)
            {
                return Task.FromResult(new HttpResponseMessage(HttpStatusCode.NotFound));
            }

            return Task.FromResult(_responses.Dequeue());
        }
    }
}
