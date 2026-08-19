using System.Net;
using System.Net.Http.Headers;
using System.Text.Json;

using ArchLucid.Cli.Commands;

using FluentAssertions;

namespace ArchLucid.Cli.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class DraftNewCommandCoreTests
{
    private const string ValidDraftIntent =
        "Review our Azure platform for production readiness with private networking, Entra ID authentication, and governed evidence export for architecture board approval.";

    private static readonly Guid DraftId = Guid.Parse("11111111-1111-1111-1111-111111111111");

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
    };

    [Fact]
    public async Task RunAsync_unknown_flag_returns_usage_error()
    {
        StringWriter capturedOut = new();
        TextWriter prevOut = Console.Out;

        try
        {
            Console.SetOut(capturedOut);
            int exit = await DraftNewCommand.RunAsync(["--unknown-flag"]);

            exit.Should().Be(CliExitCode.UsageError);
            capturedOut.ToString().Should().Contain("Unknown argument for 'draft new'");
        }
        finally
        {
            Console.SetOut(prevOut);
        }
    }

    [Fact]
    public async Task RunCoreAsync_short_intent_text_returns_usage_error()
    {
        DraftNewCommandOptions options = new() { IntentText = "short" };
        DraftNewCommandHooks hooks = ConnectedHooks();
        StringWriter output = new();
        StringWriter error = new();

        int exit = await DraftNewCommand.RunCoreAsync(options, hooks, output, error);

        exit.Should().Be(CliExitCode.UsageError);
        error.ToString().Should().Contain("at least 100 characters");
    }

    [Fact]
    public async Task RunCoreAsync_connection_failure_returns_operation_failed()
    {
        DraftNewCommandOptions options = new()
        {
            IntentText = ValidDraftIntent,
            SystemName = "Contoso API",
            BusinessOutcome = "Ship a governed review package for the architecture board.",
        };

        DraftNewCommandHooks hooks = new()
        {
            ConnectAsync = (_, _) => Task.FromResult(ApiConnectionOutcome.Unreachable),
        };

        StringWriter output = new();
        StringWriter error = new();

        int exit = await DraftNewCommand.RunCoreAsync(options, hooks, output, error);

        exit.Should().Be(CliExitCode.ApiUnavailable);
    }

    [Fact]
    public async Task RunCoreAsync_happy_path_submits_and_executes_run()
    {
        DraftNewCommandOptions options = new()
        {
            IntentText = ValidDraftIntent,
            SystemName = "Contoso API",
            BusinessOutcome = "Ship a governed review package for the architecture board.",
            SkipMustQuestions = true,
        };

        ArchLucidApiClient client = CreateDraftFlowClient();
        DraftNewCommandHooks hooks = ConnectedHooks(client);
        StringWriter output = new();
        StringWriter error = new();

        int exit = await DraftNewCommand.RunCoreAsync(options, hooks, output, error);

        exit.Should().Be(CliExitCode.Success);
        output.ToString().Should().Contain("RunId: run-draft-cli-001");
        output.ToString().Should().Contain("archlucid status run-draft-cli-001");
        error.ToString().Should().BeEmpty();
    }

    [Fact]
    public async Task RunCoreAsync_no_auto_execute_skips_execute_banner()
    {
        DraftNewCommandOptions options = new()
        {
            IntentText = ValidDraftIntent,
            SystemName = "Contoso API",
            BusinessOutcome = "Ship a governed review package for the architecture board.",
            SkipMustQuestions = true,
            NoAutoExecute = true,
        };

        ArchLucidApiClient client = CreateDraftFlowClient();
        DraftNewCommandHooks hooks = ConnectedHooks(client);
        StringWriter output = new();
        StringWriter error = new();

        int exit = await DraftNewCommand.RunCoreAsync(options, hooks, output, error);

        exit.Should().Be(CliExitCode.Success);
        output.ToString().Should().Contain("execute the review");
        output.ToString().Should().NotContain("Execution started");
    }

    private static DraftNewCommandHooks ConnectedHooks(ArchLucidApiClient? client = null)
    {
        ArchLucidApiClient sharedClient = client ?? CreateDraftFlowClient();

        return new DraftNewCommandHooks
        {
            ConnectAsync = (_, _) => Task.FromResult(ApiConnectionOutcome.Connected),
            CreateApiClient = (_, _) => sharedClient,
        };
    }

    private static ArchLucidApiClient CreateDraftFlowClient()
    {
        DraftFlowHandler handler = new();
        HttpClient http = new(handler)
        {
            BaseAddress = new Uri("http://127.0.0.1:9/"),
        };

        return new ArchLucidApiClient(http);
    }

    private sealed class DraftFlowHandler : HttpMessageHandler
    {
        private static readonly Guid TenantId = Guid.Parse("22222222-2222-2222-2222-222222222222");

        private static readonly Guid WorkspaceId = Guid.Parse("33333333-3333-3333-3333-333333333333");

        private static readonly Guid ProjectId = Guid.Parse("44444444-4444-4444-4444-444444444444");

        protected override Task<HttpResponseMessage> SendAsync(
            HttpRequestMessage request,
            CancellationToken cancellationToken)
        {
            _ = cancellationToken;
            string path = request.RequestUri!.AbsolutePath.TrimEnd('/');

            if (request.Method == HttpMethod.Post && path.EndsWith("/v1/architecture/draft", StringComparison.OrdinalIgnoreCase))
            {
                return Task.FromResult(Json(HttpStatusCode.Created, DraftBody("Drafting")));
            }

            if (request.Method == HttpMethod.Patch && path.Contains("/v1/architecture/draft/", StringComparison.OrdinalIgnoreCase))
            {
                return Task.FromResult(Json(HttpStatusCode.OK, DraftBody("Drafting")));
            }

            if (request.Method == HttpMethod.Post && path.EndsWith("/admit", StringComparison.OrdinalIgnoreCase))
            {
                return Task.FromResult(Json(HttpStatusCode.OK, new
                {
                    admitted = true,
                    status = "Admitted",
                    draft = DraftBody("Admitted"),
                    pendingMustQuestions = Array.Empty<object>(),
                }));
            }

            if (request.Method == HttpMethod.Get && path.EndsWith("/questions", StringComparison.OrdinalIgnoreCase))
            {
                return Task.FromResult(Json(HttpStatusCode.OK, new
                {
                    draftId = DraftId,
                    status = "Admitted",
                    selection = new { pendingMustQuestions = Array.Empty<object>() },
                }));
            }

            if (request.Method == HttpMethod.Post && path.EndsWith("/submit", StringComparison.OrdinalIgnoreCase))
            {
                return Task.FromResult(Json(HttpStatusCode.OK, new
                {
                    draftId = DraftId,
                    status = "RunSpawned",
                    runId = "run-draft-cli-001",
                    requestId = "req-draft-cli-001",
                }));
            }

            if (request.Method == HttpMethod.Post && path.EndsWith("/execute", StringComparison.OrdinalIgnoreCase))
            {
                return Task.FromResult(Json(HttpStatusCode.OK, new { accepted = true }));
            }

            return Task.FromResult(new HttpResponseMessage(HttpStatusCode.NotFound)
            {
                Content = new StringContent($"Unexpected route: {request.Method} {path}"),
            });
        }

        private static object DraftBody(string status)
        {
            return new
            {
                draftId = DraftId,
                tenantId = TenantId,
                workspaceId = WorkspaceId,
                projectId = ProjectId,
                status,
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
            };
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
