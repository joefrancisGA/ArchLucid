using System.Net;
using System.Net.Sockets;

namespace ArchLucid.Application.Tests.Integrations.Itsm.Outbound;

/// <summary>Loopback <see cref="HttpListener" /> serving <c>POST …/rest/api/3/issue</c> for Jira outbound tests (fully offline).</summary>
internal sealed class JiraIssueCreateInProcessMockServer : IAsyncDisposable
{
    private readonly HttpListener _listener;
    private readonly CancellationTokenSource _runCts;
    private readonly Task _acceptLoop;

    private JiraIssueCreateInProcessMockServer(HttpListener listener, CancellationTokenSource runCts, Task acceptLoop, string publicBaseUrl)
    {
        _listener = listener;
        _runCts = runCts;
        _acceptLoop = acceptLoop;
        BaseUrl = publicBaseUrl;
    }

    public string BaseUrl
    {
        get;
    }

    public static Task<JiraIssueCreateInProcessMockServer> StartAsync(Func<HttpListenerContext, CancellationToken, Task> issuePostHandler,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(issuePostHandler);
        int port = AllocateFreeLoopbackPort();
        HttpListener listener = new();
        listener.Prefixes.Add($"http://127.0.0.1:{port}/");
        listener.Start();

        CancellationTokenSource runCts = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
        Task loop = AcceptLoopAsync(listener, issuePostHandler, runCts.Token);
        JiraIssueCreateInProcessMockServer server = new(listener, runCts, loop, $"http://127.0.0.1:{port}");

        return Task.FromResult(server);
    }

    public async ValueTask DisposeAsync()
    {
        _runCts.Cancel();

        try
        {
            _listener.Stop();
        }
        catch (ObjectDisposedException)
        {
        }
        catch (HttpListenerException)
        {
        }

        _listener.Close();

        try
        {
            await _acceptLoop.ConfigureAwait(false);
        }
        catch (OperationCanceledException)
        {
        }

        _runCts.Dispose();
    }

    private static int AllocateFreeLoopbackPort()
    {
        TcpListener tcp = new(IPAddress.Loopback, 0);
        tcp.Start();
        int port = ((IPEndPoint)tcp.LocalEndpoint).Port;
        tcp.Stop();

        return port;
    }

    private static async Task AcceptLoopAsync(HttpListener listener, Func<HttpListenerContext, CancellationToken, Task> issuePostHandler,
        CancellationToken cancellationToken)
    {
        while (!cancellationToken.IsCancellationRequested)
        {
            HttpListenerContext context;

            try
            {
                context = await listener.GetContextAsync().ConfigureAwait(false);
            }
            catch (ObjectDisposedException)
            {
                return;
            }
            catch (HttpListenerException)
            {
                return;
            }
            catch (InvalidOperationException)
            {
                return;
            }

            _ = ProcessOneAsync(context, issuePostHandler, cancellationToken);
        }
    }

    private static async Task ProcessOneAsync(HttpListenerContext context, Func<HttpListenerContext, CancellationToken, Task> issuePostHandler,
        CancellationToken cancellationToken)
    {
        try
        {
            if (cancellationToken.IsCancellationRequested)
                return;

            HttpListenerRequest request = context.Request;

            if (!string.Equals(request.HttpMethod, "POST", StringComparison.OrdinalIgnoreCase) ||
                !request.Url!.AbsolutePath.TrimEnd('/').EndsWith("/rest/api/3/issue", StringComparison.Ordinal))
            {
                context.Response.StatusCode = (int)HttpStatusCode.NotFound;
                context.Response.Close();

                return;
            }

            await issuePostHandler(context, cancellationToken).ConfigureAwait(false);
        }
        catch (Exception)
        {
            TryClose(context);
        }
    }

    private static void TryClose(HttpListenerContext context)
    {
        try
        {
            context.Response.Close();
        }
        catch (ObjectDisposedException)
        {
        }
        catch (HttpListenerException)
        {
        }
    }
}
