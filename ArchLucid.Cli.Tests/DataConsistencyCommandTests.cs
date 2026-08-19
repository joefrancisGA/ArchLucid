using System.Globalization;
using System.Net;
using System.Net.Sockets;
using System.Text;

using ArchLucid.Cli.Commands;

using FluentAssertions;

namespace ArchLucid.Cli.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class DataConsistencyCommandTests : IDisposable
{
    private readonly string? _prevApiKey;

    public DataConsistencyCommandTests()
    {
        _prevApiKey = Environment.GetEnvironmentVariable("ARCHLUCID_API_KEY");
    }

    public void Dispose()
    {
        Environment.SetEnvironmentVariable("ARCHLUCID_API_KEY", _prevApiKey);
    }

    [Fact]
    public async Task RunAsync_help_lists_orphans_and_remediate_subcommands()
    {
        StringWriter output = new(CultureInfo.InvariantCulture);
        TextWriter prevOut = Console.Out;

        try
        {
            Console.SetOut(output);

            int exit = await DataConsistencyCommand.RunAsync(["--help"]);

            exit.Should().Be(CliExitCode.UsageError);
            string text = output.ToString();
            text.Should().Contain("data-consistency orphans");
            text.Should().Contain("remediate");
            text.Should().Contain("golden-manifests");
        }
        finally
        {
            Console.SetOut(prevOut);
        }
    }

    [Fact]
    public async Task RunAsync_orphans_prints_success_body()
    {
        using CancellationTokenSource listenCts = new(TimeSpan.FromSeconds(30));
        await using DataConsistencyLoopbackApi api = await DataConsistencyLoopbackApi.StartAsync(listenCts.Token);
        Environment.SetEnvironmentVariable("ARCHLUCID_API_KEY", "test-admin-key");

        StringWriter output = new(CultureInfo.InvariantCulture);
        TextWriter prevOut = Console.Out;

        try
        {
            Console.SetOut(output);

            int exit = await DataConsistencyCommand.RunAsync(
                ["orphans", "--api-base-url", api.BaseUrl.TrimEnd('/')],
                listenCts.Token);

            exit.Should().Be(CliExitCode.Success);
            output.ToString().Should().Contain("goldenManifests");
        }
        finally
        {
            Console.SetOut(prevOut);
        }
    }

    [Fact]
    public async Task RunAsync_remediate_golden_manifests_posts_dry_run_path()
    {
        using CancellationTokenSource listenCts = new(TimeSpan.FromSeconds(30));
        await using DataConsistencyLoopbackApi api = await DataConsistencyLoopbackApi.StartAsync(listenCts.Token);
        Environment.SetEnvironmentVariable("ARCHLUCID_API_KEY", "test-admin-key");

        StringWriter output = new(CultureInfo.InvariantCulture);
        TextWriter prevOut = Console.Out;

        try
        {
            Console.SetOut(output);

            int exit = await DataConsistencyCommand.RunAsync(
                ["remediate", "golden-manifests", "--api-base-url", api.BaseUrl.TrimEnd('/')],
                listenCts.Token);

            exit.Should().Be(CliExitCode.Success);
            api.LastRemediatePath.Should().Be("/v1/admin/diagnostics/data-consistency/orphan-golden-manifests?dryRun=true&maxRows=50");
            output.ToString().Should().Contain("dryRun");
        }
        finally
        {
            Console.SetOut(prevOut);
        }
    }

    private sealed class DataConsistencyLoopbackApi : IAsyncDisposable
    {
        private readonly HttpListener _listener = new();
        private readonly CancellationTokenSource _runnerCts = new();
        private Task _loop = Task.CompletedTask;

        private DataConsistencyLoopbackApi(string baseUrl) => BaseUrl = baseUrl;

        public string BaseUrl { get; }

        public string? LastRemediatePath { get; private set; }

        public static async Task<DataConsistencyLoopbackApi> StartAsync(CancellationToken cancellationToken)
        {
            int port = ReserveFreeTcpPort();
            DataConsistencyLoopbackApi api = new($"http://127.0.0.1:{port}/");
            api._listener.Prefixes.Add(api.BaseUrl);
            api._listener.Start();
            api._loop = Task.Run(() => api.AcceptLoopAsync(api._runnerCts.Token), CancellationToken.None);
            await Task.Yield();
            cancellationToken.ThrowIfCancellationRequested();

            return api;
        }

        private static int ReserveFreeTcpPort()
        {
            TcpListener tcp = new(IPAddress.Loopback, 0);
            tcp.Start();

            try
            {
                return ((IPEndPoint)tcp.LocalEndpoint).Port;
            }
            finally
            {
                tcp.Stop();
            }
        }

        private async Task AcceptLoopAsync(CancellationToken cancellationToken)
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
                catch (ObjectDisposedException)
                {
                    break;
                }

                try
                {
                    await HandleAsync(context);
                }
                catch
                {
                    try
                    {
                        context.Response.StatusCode = 500;
                    }
                    catch (ObjectDisposedException)
                    {
                        // Client may have aborted.
                    }
                }
            }
        }

        private async Task HandleAsync(HttpListenerContext context)
        {
            string path = context.Request.Url!.AbsolutePath;
            string method = context.Request.HttpMethod.ToUpperInvariant();

            if (string.Equals(path, "/v1/admin/diagnostics/data-consistency/orphans", StringComparison.OrdinalIgnoreCase)
                && string.Equals(method, "GET", StringComparison.Ordinal))
            {
                await WriteJsonAsync(
                    context.Response,
                    200,
                    """{"goldenManifests":0,"findingsSnapshots":0,"contextSnapshots":0,"graphSnapshots":0}""");

                return;
            }

            if (path.StartsWith("/v1/admin/diagnostics/data-consistency/orphan-", StringComparison.OrdinalIgnoreCase)
                && string.Equals(method, "POST", StringComparison.Ordinal))
            {
                LastRemediatePath = path + context.Request.Url.Query;
                await WriteJsonAsync(context.Response, 200, """{"dryRun":true,"rowsAffected":0}""");

                return;
            }

            await WriteTextAsync(context.Response, 404, "not found");
        }

        private static async Task WriteTextAsync(HttpListenerResponse response, int status, string body)
        {
            response.StatusCode = status;
            response.ContentType = "text/plain; charset=utf-8";
            byte[] bytes = Encoding.UTF8.GetBytes(body);
            response.ContentLength64 = bytes.Length;
            await response.OutputStream.WriteAsync(bytes);
            response.Close();
        }

        private static async Task WriteJsonAsync(HttpListenerResponse response, int status, string json)
        {
            response.StatusCode = status;
            response.ContentType = "application/json; charset=utf-8";
            byte[] bytes = Encoding.UTF8.GetBytes(json);
            response.ContentLength64 = bytes.Length;
            await response.OutputStream.WriteAsync(bytes);
            response.Close();
        }

        public async ValueTask DisposeAsync()
        {
            await _runnerCts.CancelAsync();

            try
            {
                _listener.Stop();
            }
            catch (HttpListenerException)
            {
                // Ignore shutdown races.
            }
            catch (ObjectDisposedException)
            {
                // Ignore shutdown races.
            }

            _listener.Close();

            try
            {
                await _loop;
            }
            catch (OperationCanceledException)
            {
                // Expected on shutdown.
            }

            _runnerCts.Dispose();
        }
    }
}
