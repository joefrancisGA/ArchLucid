using System.Net;
using System.Text;

using ArchLucid.Cli;

using FluentAssertions;

namespace ArchLucid.Cli.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class CliHttpProbeSessionTests
{
    [Fact]
    public async Task FetchPilotRunDeltasAsync_returns_body_on_success()
    {
        const string body = """{"runId":"abc"}""";
        using HttpListener listener = StartLoopbackStub(
            ctx =>
            {
                ctx.Response.StatusCode = (int)HttpStatusCode.OK;
                byte[] bytes = Encoding.UTF8.GetBytes(body);
                ctx.Response.OutputStream.Write(bytes);
                ctx.Response.Close();
            });

        string baseUrl = $"http://127.0.0.1:{listener.Prefixes.Cast<string>().First().Split(':').Last().TrimEnd('/')}/";
        using CliHttpProbeSession session = CliHttpProbeSession.ForApi(baseUrl);

        CliPilotRunDeltasFetchResult result = await session.FetchPilotRunDeltasAsync("run-1");

        result.Success.Should().BeTrue();
        result.NotFound.Should().BeFalse();
        result.Body.Should().Be(body);
    }

    [Fact]
    public async Task FetchPilotRunDeltasAsync_marks_not_found()
    {
        using HttpListener listener = StartLoopbackStub(
            ctx =>
            {
                ctx.Response.StatusCode = (int)HttpStatusCode.NotFound;
                ctx.Response.Close();
            });

        string baseUrl = $"http://127.0.0.1:{listener.Prefixes.Cast<string>().First().Split(':').Last().TrimEnd('/')}/";
        using CliHttpProbeSession session = CliHttpProbeSession.ForApi(baseUrl);

        CliPilotRunDeltasFetchResult result = await session.FetchPilotRunDeltasAsync("missing");

        result.NotFound.Should().BeTrue();
        result.Success.Should().BeFalse();
    }

    [Fact]
    public void DetachClient_leaves_http_usable_after_session_disposed()
    {
        HttpClient? detached = null;

        using (CliHttpProbeSession session = CliHttpProbeSession.ForApi("http://127.0.0.1:9"))
            detached = session.DetachClient();

        detached.Should().NotBeNull();
        detached!.BaseAddress.Should().NotBeNull();
    }

    private static HttpListener StartLoopbackStub(Action<HttpListenerContext> handler)
    {
        HttpListener listener = new();
        listener.Prefixes.Add($"http://127.0.0.1:{GetFreePort()}/");
        listener.Start();
        _ = Task.Run(async () =>
        {
            try
            {
                HttpListenerContext ctx = await listener.GetContextAsync();
                handler(ctx);
            }
            catch (HttpListenerException)
            {
            }
        });

        return listener;
    }

    private static int GetFreePort()
    {
        using System.Net.Sockets.TcpListener tcp = new(IPAddress.Loopback, 0);
        tcp.Start();
        int port = ((IPEndPoint)tcp.LocalEndpoint).Port;
        tcp.Stop();

        return port;
    }
}
