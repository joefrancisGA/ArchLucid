using System.Globalization;
using System.IO.Compression;
using System.Net;
using System.Net.Sockets;
using System.Text;

using ArchLucid.Cli.Commands;

using FluentAssertions;

namespace ArchLucid.Cli.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class ProofPacketCommandTests : IDisposable
{
    private readonly string _emptyCwd;
    private readonly string? _prevApiUrl;

    public ProofPacketCommandTests()
    {
        _emptyCwd = Path.Combine(Path.GetTempPath(), "ArchLucidCliProofPacketTests." + Guid.NewGuid().ToString("N"));
        Directory.CreateDirectory(_emptyCwd);
        CliTestWorkingDirectory.EnsureReadableUsingExistingDirectory(_emptyCwd);
        _prevApiUrl = Environment.GetEnvironmentVariable("ARCHLUCID_API_URL");
    }

    public void Dispose()
    {
        try
        {
            if (Directory.Exists(_emptyCwd))
                Directory.Delete(_emptyCwd, true);
        }
        catch (IOException)
        {
            // Best-effort cleanup on locked temp dirs (Windows AV/indexers).
        }

        Environment.SetEnvironmentVariable("ARCHLUCID_API_URL", _prevApiUrl ?? null);
    }

    [Fact]
    public void TryParse_requires_runId_and_out()
    {
        ProofPacketCommandOptions? options = ProofPacketCommandOptions.TryParse(
            ["--runId", "run-1"],
            out string? error);

        options.Should().BeNull();
        error.Should().Contain("Both --runId and --out are required.");
    }

    [Fact]
    public async Task RunAsync_help_documents_data_policy()
    {
        StringWriter output = new(CultureInfo.InvariantCulture);
        TextWriter prevOut = Console.Out;

        try
        {
            Console.SetOut(output);

            int exit = await ProofPacketCommand.RunAsync(["--help"]);

            exit.Should().Be(CliExitCode.Success);
            output.ToString().Should().Contain("Data policy:");
            output.ToString().Should().Contain("SOURCE-LABELS.txt");
        }
        finally
        {
            Console.SetOut(prevOut);
        }
    }

    [Fact]
    public async Task RunAsync_writes_zip_with_source_labels_and_run_evidence()
    {
        using CancellationTokenSource listenCts = new(TimeSpan.FromSeconds(30));
        await using ProofPacketLoopbackApi api = await ProofPacketLoopbackApi.StartAsync(listenCts.Token);
        Environment.SetEnvironmentVariable("ARCHLUCID_API_URL", api.BaseUrl.TrimEnd('/'));

        string runId = "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee";
        string zipPath = Path.Combine(_emptyCwd, "proof-packet.zip");
        StringWriter errWriter = new(CultureInfo.InvariantCulture);
        TextWriter prevErr = Console.Error;
        string prevCwd = Directory.GetCurrentDirectory();

        try
        {
            Directory.SetCurrentDirectory(_emptyCwd);
            Console.SetError(errWriter);

            int exit = await ProofPacketCommand.RunAsync(
                ["--runId", runId, "--out", zipPath],
                listenCts.Token);

            exit.Should().Be(CliExitCode.Success, $"stderr: {errWriter}");
            File.Exists(zipPath).Should().BeTrue();

            await using FileStream zipFs = new(zipPath, FileMode.Open, FileAccess.Read, FileShare.Read);
            await using ZipArchive zip = new(zipFs, ZipArchiveMode.Read);

            string[] names = zip.Entries.Select(entry => entry.FullName.Replace('\\', '/')).ToArray();

            names.Should().Contain(ProofPacketSourceLabelsBuilder.FileName);
            names.Should().Contain("run-evidence.json");
            names.Should().Contain("limitations.md");
            names.Should().Contain("sponsor-proof-packet-index.json");

            ZipArchiveEntry labelsEntry = zip.GetEntry(ProofPacketSourceLabelsBuilder.FileName)!;
            await using Stream labelsStream = await labelsEntry.OpenAsync(listenCts.Token);
            using StreamReader reader = new(labelsStream, Encoding.UTF8);
            string labels = await reader.ReadToEndAsync(listenCts.Token);

            labels.Should().Contain(runId);
            labels.Should().Contain("buyer-safe");
        }
        finally
        {
            Directory.SetCurrentDirectory(prevCwd);
            Console.SetError(prevErr);
        }
    }

    [Fact]
    public async Task RunAsync_aborts_when_claim_lint_fails()
    {
        using CancellationTokenSource listenCts = new(TimeSpan.FromSeconds(30));
        await using ProofPacketLoopbackApi api = await ProofPacketLoopbackApi.StartAsync(listenCts.Token);
        api.FirstValueReportMarkdown = "# Summary\n\nThis run shows guaranteed savings for the buyer.";
        Environment.SetEnvironmentVariable("ARCHLUCID_API_URL", api.BaseUrl.TrimEnd('/'));

        StringWriter errWriter = new(CultureInfo.InvariantCulture);
        TextWriter prevErr = Console.Error;
        string prevCwd = Directory.GetCurrentDirectory();

        try
        {
            Directory.SetCurrentDirectory(_emptyCwd);
            Console.SetError(errWriter);

            int exit = await ProofPacketCommand.RunAsync(
                ["--runId", "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee", "--out", Path.Combine(_emptyCwd, "blocked-claims.zip")],
                listenCts.Token);

            exit.Should().Be(CliExitCode.OperationFailed);
            errWriter.ToString().Should().Contain("guaranteed savings");
            errWriter.ToString().Should().Contain("proof-summary.md");
        }
        finally
        {
            Directory.SetCurrentDirectory(prevCwd);
            Console.SetError(prevErr);
        }
    }

    [Fact]
    public async Task RunAsync_skips_claim_lint_when_flag_set()
    {
        using CancellationTokenSource listenCts = new(TimeSpan.FromSeconds(30));
        await using ProofPacketLoopbackApi api = await ProofPacketLoopbackApi.StartAsync(listenCts.Token);
        api.FirstValueReportMarkdown = "# Summary\n\nThis run shows guaranteed savings for the buyer.";
        Environment.SetEnvironmentVariable("ARCHLUCID_API_URL", api.BaseUrl.TrimEnd('/'));

        string zipPath = Path.Combine(_emptyCwd, "skipped-lint.zip");
        StringWriter errWriter = new(CultureInfo.InvariantCulture);
        TextWriter prevErr = Console.Error;
        string prevCwd = Directory.GetCurrentDirectory();

        try
        {
            Directory.SetCurrentDirectory(_emptyCwd);
            Console.SetError(errWriter);

            int exit = await ProofPacketCommand.RunAsync(
                [
                    "--runId", "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
                    "--out", zipPath,
                    "--skip-claim-lint",
                ],
                listenCts.Token);

            exit.Should().Be(CliExitCode.Success, $"stderr: {errWriter}");
            File.Exists(zipPath).Should().BeTrue();
        }
        finally
        {
            Directory.SetCurrentDirectory(prevCwd);
            Console.SetError(prevErr);
        }
    }

    [Fact]
    public async Task RunAsync_aborts_when_commit_gate_fails()
    {
        using CancellationTokenSource listenCts = new(TimeSpan.FromSeconds(30));
        await using ProofPacketLoopbackApi api = await ProofPacketLoopbackApi.StartAsync(listenCts.Token);
        api.PilotRunDeltasJson =
            """
            {"isDemoTenant":false,"proofPackageCompleteness":{"runInCommittedStatus":false},"findingsBySeverity":[]}
            """;

        Environment.SetEnvironmentVariable("ARCHLUCID_API_URL", api.BaseUrl.TrimEnd('/'));

        StringWriter errWriter = new(CultureInfo.InvariantCulture);
        TextWriter prevErr = Console.Error;
        string prevCwd = Directory.GetCurrentDirectory();

        try
        {
            Directory.SetCurrentDirectory(_emptyCwd);
            Console.SetError(errWriter);

            int exit = await ProofPacketCommand.RunAsync(
                ["--runId", "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee", "--out", Path.Combine(_emptyCwd, "blocked.zip")],
                listenCts.Token);

            exit.Should().Be(CliExitCode.UsageError);
            errWriter.ToString().Should().Contain("Review is not finalized");
        }
        finally
        {
            Directory.SetCurrentDirectory(prevCwd);
            Console.SetError(prevErr);
        }
    }

    private sealed class ProofPacketLoopbackApi : IAsyncDisposable
    {
        private readonly HttpListener _listener = new();
        private readonly CancellationTokenSource _runnerCts = new();
        private Task _runner = Task.CompletedTask;

        private ProofPacketLoopbackApi(string baseUrl) => BaseUrl = baseUrl;

        public string BaseUrl
        {
            get;
        }

        public string PilotRunDeltasJson
        {
            get; set;
        } =
            """
            {"isDemoTenant":false,"proofPackageCompleteness":{"runInCommittedStatus":true},"findingsBySeverity":[]}
            """;

        public string FirstValueReportMarkdown
        {
            get; set;
        } = "# First value report\n\nstub";

        public static async Task<ProofPacketLoopbackApi> StartAsync(CancellationToken ct)
        {
            int port = await ReserveFreeTcpPortAsync(ct);
            ProofPacketLoopbackApi api = new($"http://127.0.0.1:{port}/");
            api._listener.Prefixes.Add(api.BaseUrl);
            api._listener.Start();
            api._runner = Task.Run(() => api.AcceptLoopAsync(api._runnerCts.Token), CancellationToken.None);

            return api;
        }

        private static Task<int> ReserveFreeTcpPortAsync(CancellationToken ct)
        {
            ct.ThrowIfCancellationRequested();
            TcpListener tcp = new(IPAddress.Loopback, 0);
            tcp.Start();

            try
            {
                return Task.FromResult(((IPEndPoint)tcp.LocalEndpoint).Port);
            }
            finally
            {
                tcp.Stop();
            }
        }

        private async Task AcceptLoopAsync(CancellationToken ct)
        {
            while (!ct.IsCancellationRequested)
            {
                HttpListenerContext ctx;

                try
                {
                    ctx = await _listener.GetContextAsync().WaitAsync(ct);
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
                    await HandleRequestAsync(ctx);
                }
                catch
                {
                    try
                    {
                        ctx.Response.StatusCode = 500;
                    }
                    catch (ObjectDisposedException)
                    {
                        // Ignore — client may have aborted.
                    }
                }
            }
        }

        private async Task HandleRequestAsync(HttpListenerContext ctx)
        {
            string path = ctx.Request.Url!.AbsolutePath.TrimEnd('/');
            string method = ctx.Request.HttpMethod.ToUpperInvariant();

            if (string.Equals(path, "/health/live", StringComparison.OrdinalIgnoreCase)
                && string.Equals(method, "GET", StringComparison.Ordinal))
            {
                await WriteTextAsync(ctx.Response, 200, "healthy");

                return;
            }

            if (path.EndsWith("/pilot-run-deltas", StringComparison.OrdinalIgnoreCase)
                && string.Equals(method, "GET", StringComparison.Ordinal))
            {
                await WriteJsonAsync(ctx.Response, 200, PilotRunDeltasJson);

                return;
            }

            if (path.Contains("/first-value-report", StringComparison.OrdinalIgnoreCase)
                && string.Equals(method, "GET", StringComparison.Ordinal))
            {
                await WriteTextAsync(ctx.Response, 200, FirstValueReportMarkdown);

                return;
            }

            ctx.Response.StatusCode = 404;
            ctx.Response.Close();
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
                await _runner;
            }
            catch (OperationCanceledException)
            {
                // Expected during cooperative shutdown.
            }

            _runnerCts.Dispose();
        }
    }
}
