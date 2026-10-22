using System.Net;
using System.Net.Http.Headers;
using System.Text.Json;

using ArchLucid.Cli.Commands;

using FluentAssertions;

namespace ArchLucid.Cli.Tests;

/// <summary>SN-036 — CLI clone-snapshot honesty and clone-snapshot API wiring.</summary>
[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class DraftCloneSnapshotCommandTests
{
    private static readonly Guid SourceDraftId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");

    private static readonly Guid CloneDraftId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");

    private static readonly Guid ArchitectureId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc");

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
    };

    [Fact]
    public async Task RunAsync_missing_draft_id_returns_usage_error()
    {
        StringWriter capturedErr = new();
        TextWriter prevErr = Console.Error;

        try
        {
            Console.SetError(capturedErr);
            int exit = await DraftCloneSnapshotCommand.RunAsync([]);

            exit.Should().Be(CliExitCode.UsageError);
            capturedErr.ToString().Should().Contain("draftId is required");
        }
        finally
        {
            Console.SetError(prevErr);
        }
    }

    [Fact]
    public async Task RunCoreAsync_prints_career_rehearsal_honesty_and_clone_ids()
    {
        ArchLucidApiClient client = CreateCloneClient();
        StringWriter output = new();
        StringWriter error = new();

        int exit = await DraftCloneSnapshotCommand.RunCoreAsync(
            SourceDraftId,
            client,
            null,
            output,
            error);

        exit.Should().Be(CliExitCode.Success);
        string stdout = output.ToString();
        stdout.Should().Contain("Career/Rehearsal");
        stdout.Should().Contain("CG-062");
        stdout.Should().Contain("CG-021");
        stdout.Should().Contain("ExpectedUpdatedUtc");
        stdout.Should().Contain($"CloneDraftId: {CloneDraftId:D}");
        stdout.Should().Contain($"SourceDraftId: {SourceDraftId:D}");
        error.ToString().Should().BeEmpty();
    }

    [Fact]
    public async Task RunCoreAsync_json_output_includes_honesty_fields()
    {
        bool previousJson = CliExecutionContext.JsonOutput;

        try
        {
            CliExecutionContext.JsonOutput = true;
            ArchLucidApiClient client = CreateCloneClient();
            StringWriter output = new();
            StringWriter error = new();

            int exit = await DraftCloneSnapshotCommand.RunCoreAsync(
                SourceDraftId,
                client,
                null,
                output,
                error);

            exit.Should().Be(CliExitCode.Success);
            string jsonLine = output.ToString()
                .Split('\n', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
                .Single(line => line.StartsWith('{'));

            using JsonDocument document = JsonDocument.Parse(jsonLine);
            document.RootElement.GetProperty("ok").GetBoolean().Should().BeTrue();
            document.RootElement.GetProperty("cloneDraftId").GetString().Should().Be(CloneDraftId.ToString("D"));
            document.RootElement.GetProperty("honesty").GetProperty("simulatorCareerBlock").GetString()
                .Should().Contain("CG-021");
        }
        finally
        {
            CliExecutionContext.JsonOutput = previousJson;
        }
    }

    private static ArchLucidApiClient CreateCloneClient()
    {
        HttpClient http = new(new CloneSnapshotHandler())
        {
            BaseAddress = new Uri("http://127.0.0.1:9/"),
        };

        return new ArchLucidApiClient(http);
    }

    private sealed class CloneSnapshotHandler : HttpMessageHandler
    {
        protected override Task<HttpResponseMessage> SendAsync(
            HttpRequestMessage request,
            CancellationToken cancellationToken)
        {
            _ = cancellationToken;
            string path = request.RequestUri!.AbsolutePath.TrimEnd('/');

            if (request.Method == HttpMethod.Post
                && path.EndsWith($"/v1/architecture/draft/{SourceDraftId:D}/clone-snapshot", StringComparison.OrdinalIgnoreCase))
            {
                return Task.FromResult(Json(HttpStatusCode.Created, new
                {
                    sourceDraftId = SourceDraftId,
                    sourceSpawnedRunId = "run-spawn-001",
                    clone = new
                    {
                        draftId = CloneDraftId,
                        architectureId = ArchitectureId,
                        tenantId = Guid.Parse("22222222-2222-2222-2222-222222222222"),
                        workspaceId = Guid.Parse("33333333-3333-3333-3333-333333333333"),
                        projectId = Guid.Parse("44444444-4444-4444-4444-444444444444"),
                        status = "Drafting",
                        document = new
                        {
                            schemaVersion = 1,
                            freeTextIntent = string.Empty,
                            actorSet = new { actors = Array.Empty<object>() },
                            transparencyTrail = new { entries = Array.Empty<object>() },
                            questionAnswers = new { },
                            requiredMustQuestionKeys = Array.Empty<string>(),
                        },
                        createdUtc = "2026-06-15T12:00:00Z",
                        updatedUtc = "2026-06-15T12:00:00Z",
                    },
                }));
            }

            return Task.FromResult(new HttpResponseMessage(HttpStatusCode.NotFound)
            {
                Content = new StringContent($"Unexpected route: {request.Method} {path}"),
            });
        }

        private static HttpResponseMessage Json(HttpStatusCode status, object body)
        {
            HttpResponseMessage response = new(status)
            {
                Content = new StringContent(JsonSerializer.Serialize(body, JsonOptions)),
            };

            response.Content.Headers.ContentType = new MediaTypeHeaderValue("application/json");

            return response;
        }
    }
}
