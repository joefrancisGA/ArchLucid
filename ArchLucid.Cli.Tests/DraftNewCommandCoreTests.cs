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

    [Fact]
    public async Task RunCoreAsync_draft_scope_mismatch_after_create_returns_operation_failed()
    {
        Guid configuredTenantId = Guid.Parse("55555555-5555-5555-5555-555555555555");
        string? previousTenant = Environment.GetEnvironmentVariable("ARCHLUCID_TENANT_ID");

        try
        {
            Environment.SetEnvironmentVariable("ARCHLUCID_TENANT_ID", configuredTenantId.ToString("D"));

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

            exit.Should().Be(CliExitCode.OperationFailed);
            error.ToString().Should().Contain("does not match configured CLI scope");
            error.ToString().Should().Contain("x-tenant-id");
        }
        finally
        {
            Environment.SetEnvironmentVariable("ARCHLUCID_TENANT_ID", previousTenant);
        }
    }

    [Fact]
    public async Task RunCoreAsync_draft_scope_mismatch_after_patch_returns_operation_failed()
    {
        Guid configuredTenantId = Guid.Parse("55555555-5555-5555-5555-555555555555");
        string? previousTenant = Environment.GetEnvironmentVariable("ARCHLUCID_TENANT_ID");

        try
        {
            Environment.SetEnvironmentVariable("ARCHLUCID_TENANT_ID", configuredTenantId.ToString("D"));

            DraftNewCommandOptions options = new()
            {
                IntentText = ValidDraftIntent,
                SystemName = "Contoso API",
                BusinessOutcome = "Ship a governed review package for the architecture board.",
                SkipMustQuestions = true,
            };

            ArchLucidApiClient client = CreateDraftFlowClient(new PatchScopeMismatchHandler());
            DraftNewCommandHooks hooks = ConnectedHooks(client);
            StringWriter output = new();
            StringWriter error = new();

            int exit = await DraftNewCommand.RunCoreAsync(options, hooks, output, error);

            exit.Should().Be(CliExitCode.OperationFailed);
            error.ToString().Should().Contain("Error patching draft");
            error.ToString().Should().Contain("does not match configured CLI scope");
        }
        finally
        {
            Environment.SetEnvironmentVariable("ARCHLUCID_TENANT_ID", previousTenant);
        }
    }

    [Fact]
    public async Task RunCoreAsync_submit_without_run_id_returns_operation_failed()
    {
        DraftNewCommandOptions options = new()
        {
            IntentText = ValidDraftIntent,
            SystemName = "Contoso API",
            BusinessOutcome = "Ship a governed review package for the architecture board.",
            SkipMustQuestions = true,
            NoAutoExecute = true,
        };

        ArchLucidApiClient client = CreateDraftFlowClient(new SubmitWithoutRunIdHandler());
        DraftNewCommandHooks hooks = ConnectedHooks(client);
        StringWriter output = new();
        StringWriter error = new();

        int exit = await DraftNewCommand.RunCoreAsync(options, hooks, output, error);

        exit.Should().Be(CliExitCode.OperationFailed);
        error.ToString().Should().Contain("no runId");
    }

    [Fact]
    public async Task RunCoreAsync_questions_load_failure_writes_operator_hint()
    {
        DraftNewCommandOptions options = new()
        {
            IntentText = ValidDraftIntent,
            SystemName = "Contoso API",
            BusinessOutcome = "Ship a governed review package for the architecture board.",
            SkipMustQuestions = false,
        };

        ArchLucidApiClient client = CreateDraftFlowClient(new QuestionsForbiddenHandler());
        DraftNewCommandHooks hooks = ConnectedHooks(client);
        StringWriter output = new();
        StringWriter error = new();

        int exit = await DraftNewCommand.RunCoreAsync(options, hooks, output, error);

        exit.Should().Be(CliExitCode.OperationFailed);
        error.ToString().Should().Contain("Error loading draft questions");
        error.ToString().Should().Contain("Reader, Operator, or Admin");
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

    private static ArchLucidApiClient CreateDraftFlowClient(DraftFlowHandler? handler = null)
    {
        DraftFlowHandler flowHandler = handler ?? new DraftFlowHandler();
        HttpClient http = new(flowHandler)
        {
            BaseAddress = new Uri("http://127.0.0.1:9/"),
        };

        return new ArchLucidApiClient(http);
    }

    private sealed class PatchScopeMismatchHandler : DraftFlowHandler
    {
        protected override HttpResponseMessage? TryHandle(
            HttpRequestMessage request,
            string path)
        {
            if (request.Method == HttpMethod.Post && path.EndsWith("/v1/architecture/draft", StringComparison.OrdinalIgnoreCase))
            {
                Guid configuredTenantId = Guid.Parse("55555555-5555-5555-5555-555555555555");

                return Json(HttpStatusCode.Created, DraftBody("Drafting", configuredTenantId));
            }

            if (request.Method == HttpMethod.Patch && path.Contains("/v1/architecture/draft/", StringComparison.OrdinalIgnoreCase))
            {
                Guid mismatchedTenantId = Guid.Parse("66666666-6666-6666-6666-666666666666");

                return Json(HttpStatusCode.OK, DraftBody("Drafting", mismatchedTenantId));
            }

            return null;
        }
    }

    private sealed class SubmitWithoutRunIdHandler : DraftFlowHandler
    {
        protected override HttpResponseMessage? TryHandle(
            HttpRequestMessage request,
            string path)
        {
            if (request.Method == HttpMethod.Post && path.EndsWith("/submit", StringComparison.OrdinalIgnoreCase))
            {
                return Json(HttpStatusCode.OK, new
                {
                    draftId = DraftId,
                    status = "RunSpawned",
                    runId = string.Empty,
                    requestId = "req-draft-cli-001",
                });
            }

            return null;
        }
    }

    private sealed class QuestionsForbiddenHandler : DraftFlowHandler
    {
        protected override HttpResponseMessage? TryHandle(
            HttpRequestMessage request,
            string path)
        {
            if (request.Method == HttpMethod.Get && path.EndsWith("/questions", StringComparison.OrdinalIgnoreCase))
            {
                return new HttpResponseMessage(HttpStatusCode.Forbidden)
                {
                    Content = new StringContent("{\"title\":\"Forbidden\"}", System.Text.Encoding.UTF8, "application/json"),
                };
            }

            return null;
        }
    }

    private class DraftFlowHandler : HttpMessageHandler
    {
        protected static readonly Guid TenantId = Guid.Parse("22222222-2222-2222-2222-222222222222");

        protected static readonly Guid WorkspaceId = Guid.Parse("33333333-3333-3333-3333-333333333333");

        protected static readonly Guid ProjectId = Guid.Parse("44444444-4444-4444-4444-444444444444");

        protected override Task<HttpResponseMessage> SendAsync(
            HttpRequestMessage request,
            CancellationToken cancellationToken)
        {
            _ = cancellationToken;
            string path = request.RequestUri!.AbsolutePath.TrimEnd('/');
            HttpResponseMessage? handled = TryHandle(request, path);

            if (handled is not null)
                return Task.FromResult(handled);

            return Task.FromResult(HandleDefault(request, path));
        }

        protected virtual HttpResponseMessage? TryHandle(HttpRequestMessage request, string path) => null;

        private HttpResponseMessage HandleDefault(HttpRequestMessage request, string path)
        {
            if (request.Method == HttpMethod.Post && path.EndsWith("/v1/architecture/draft", StringComparison.OrdinalIgnoreCase))
            {
                return Json(HttpStatusCode.Created, DraftBody("Drafting"));
            }

            if (request.Method == HttpMethod.Patch && path.Contains("/v1/architecture/draft/", StringComparison.OrdinalIgnoreCase))
            {
                return Json(HttpStatusCode.OK, DraftBody("Drafting"));
            }

            if (request.Method == HttpMethod.Post && path.EndsWith("/admit", StringComparison.OrdinalIgnoreCase))
            {
                return Json(HttpStatusCode.OK, new
                {
                    admitted = true,
                    status = "Admitted",
                    draft = DraftBody("Admitted"),
                    pendingMustQuestions = Array.Empty<object>(),
                });
            }

            if (request.Method == HttpMethod.Get && path.EndsWith("/questions", StringComparison.OrdinalIgnoreCase))
            {
                return Json(HttpStatusCode.OK, new
                {
                    draftId = DraftId,
                    status = "Admitted",
                    selection = new { pendingMustQuestions = Array.Empty<object>() },
                });
            }

            if (request.Method == HttpMethod.Post && path.EndsWith("/submit", StringComparison.OrdinalIgnoreCase))
            {
                return Json(HttpStatusCode.OK, new
                {
                    draftId = DraftId,
                    status = "RunSpawned",
                    runId = "run-draft-cli-001",
                    requestId = "req-draft-cli-001",
                });
            }

            if (request.Method == HttpMethod.Post && path.EndsWith("/execute", StringComparison.OrdinalIgnoreCase))
            {
                return Json(HttpStatusCode.OK, new { accepted = true });
            }

            return new HttpResponseMessage(HttpStatusCode.NotFound)
            {
                Content = new StringContent($"Unexpected route: {request.Method} {path}"),
            };
        }

        protected static object DraftBody(string status, Guid? tenantIdOverride = null)
        {
            return new
            {
                draftId = DraftId,
                tenantId = tenantIdOverride ?? TenantId,
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

        protected static HttpResponseMessage Json(HttpStatusCode status, object body)
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
