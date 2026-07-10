using System.Net;
using System.Net.Sockets;
using System.Text;

using ArchLucid.Cli.Commands;

using FluentAssertions;

namespace ArchLucid.Cli.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class DataConsistencyCommandTests
{
    [Fact]
    public async Task Usage_error_when_no_args()
    {
        int exit = await DataConsistencyCommand.RunAsync([], CancellationToken.None);

        exit.Should().Be(CliExitCode.UsageError);
    }

    [Fact]
    public async Task Usage_error_for_help_flag()
    {
        int exit = await DataConsistencyCommand.RunAsync(["--help"], CancellationToken.None);

        exit.Should().Be(CliExitCode.UsageError);
    }

    [Fact]
    public async Task Usage_error_for_unknown_subcommand()
    {
        int exit = await DataConsistencyCommand.RunAsync(["unknown"], CancellationToken.None);

        exit.Should().Be(CliExitCode.UsageError);
    }

    [Fact]
    public async Task Usage_error_when_remediate_missing_target()
    {
        int exit = await DataConsistencyCommand.RunAsync(["remediate"], CancellationToken.None);

        exit.Should().Be(CliExitCode.UsageError);
    }

    [Fact]
    public async Task Usage_error_for_unknown_remediate_target()
    {
        int exit = await DataConsistencyCommand.RunAsync(["remediate", "unknown-target"], CancellationToken.None);

        exit.Should().Be(CliExitCode.UsageError);
    }

    [Fact]
    public async Task Orphans_returns_success_when_api_responds_ok()
    {
        await using LocalJsonApiHost host = await LocalJsonApiHost.StartAsync(
            "v1/admin/diagnostics/data-consistency/orphans",
            """{"orphanComparisonRecords":0}""");

        int exit = await DataConsistencyCommand.RunAsync(
            ["orphans", "--api-base-url", host.BaseUrl],
            CancellationToken.None);

        exit.Should().Be(CliExitCode.Success);
    }

    [Fact]
    public async Task Remediate_comparison_records_posts_dry_run_by_default()
    {
        await using LocalJsonApiHost host = await LocalJsonApiHost.StartAsync(
            "v1/admin/diagnostics/data-consistency/orphan-comparison-records",
            """{"dryRun":true,"rows":0}""",
            HttpMethod.Post);

        int exit = await DataConsistencyCommand.RunAsync(
            ["remediate", "comparison-records", "--api-base-url", host.BaseUrl],
            CancellationToken.None);

        exit.Should().Be(CliExitCode.Success);
        host.LastRequestPath.Should().Contain("orphan-comparison-records");
    }

    private sealed class LocalJsonApiHost : IAsyncDisposable
    {
        private readonly HttpListener _listener = new();
        private readonly CancellationTokenSource _cts = new();
        private Task? _loop;

        public string BaseUrl { get; private set; } = string.Empty;

        public string? LastRequestPath { get; private set; }

        public static async Task<LocalJsonApiHost> StartAsync(
            string expectedPathSuffix,
            string responseBody,
            HttpMethod? method = null)
        {
            HttpMethod expectedMethod = method ?? HttpMethod.Get;
            LocalJsonApiHost host = new();
            int port = GetFreeTcpPort();
            host.BaseUrl = $"http://127.0.0.1:{port}";
            host._listener.Prefixes.Add($"{host.BaseUrl}/");
            host._listener.Start();
            host._loop = Task.Run(() => host.ListenLoopAsync(expectedPathSuffix, responseBody, expectedMethod, host._cts.Token));

            await Task.Delay(50);

            return host;
        }

        public async ValueTask DisposeAsync()
        {
            await _cts.CancelAsync();

            if (_loop is not null)
            {
                try
                {
                    await _loop;
                }
                catch (OperationCanceledException)
                {
                }
            }

            _listener.Stop();
            _listener.Close();
        }

        private async Task ListenLoopAsync(
            string expectedPathSuffix,
            string responseBody,
            HttpMethod expectedMethod,
            CancellationToken cancellationToken)
        {
            while (!cancellationToken.IsCancellationRequested)
            {
                HttpListenerContext context;

                try
                {
                    context = await _listener.GetContextAsync().WaitAsync(cancellationToken);
                }
                catch (OperationCanceledException)
                {
                    break;
                }
                catch (HttpListenerException)
                {
                    break;
                }

                await HandleAsync(context, expectedPathSuffix, responseBody, expectedMethod);
            }
        }

        private async Task HandleAsync(
            HttpListenerContext context,
            string expectedPathSuffix,
            string responseBody,
            HttpMethod expectedMethod)
        {
            HttpListenerRequest request = context.Request;
            LastRequestPath = request.Url?.PathAndQuery;

            bool methodOk = string.Equals(request.HttpMethod, expectedMethod.Method, StringComparison.OrdinalIgnoreCase);
            bool pathOk = request.Url?.AbsolutePath.Contains(expectedPathSuffix, StringComparison.OrdinalIgnoreCase) == true;
            byte[] body = Encoding.UTF8.GetBytes(responseBody);
            HttpListenerResponse response = context.Response;

            if (!methodOk || !pathOk)
            {
                response.StatusCode = (int)HttpStatusCode.NotFound;
                response.Close();

                return;
            }

            response.StatusCode = (int)HttpStatusCode.OK;
            response.ContentType = "application/json";
            response.ContentLength64 = body.Length;
            await response.OutputStream.WriteAsync(body);
            response.Close();
        }

        private static int GetFreeTcpPort()
        {
            using TcpListener listener = new(IPAddress.Loopback, 0);
            listener.Start();

            return ((IPEndPoint)listener.LocalEndpoint).Port;
        }
    }
}
