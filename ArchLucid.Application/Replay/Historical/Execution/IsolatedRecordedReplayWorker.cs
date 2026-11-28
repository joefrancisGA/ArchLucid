using System.ComponentModel;
using System.Diagnostics;
using System.Text;
using System.Text.Json;

using static ArchLucid.Application.Replay.Historical.Execution.RecordedReplayRecipe;

namespace ArchLucid.Application.Replay.Historical.Execution;

/// <summary>Runs only independently approved local image IDs on a dedicated Linux Docker daemon. No in-process fallback.</summary>
public sealed class IsolatedRecordedReplayWorker : IRecordedReplayWorker
{
    private const string Docker = "/usr/bin/docker";
    private static readonly JsonSerializerOptions Wire = new() { MaxDepth = 32, UnmappedMemberHandling = System.Text.Json.Serialization.JsonUnmappedMemberHandling.Disallow };
    private readonly string host;

    public IsolatedRecordedReplayWorker(string dedicatedUnixSocket = "/var/run/docker.sock")
    {
        if (!Path.IsPathFullyQualified(dedicatedUnixSocket) || dedicatedUnixSocket.Contains('\n') || dedicatedUnixSocket.Contains('\r'))
            throw new ArgumentException("A local Docker socket path is required.", nameof(dedicatedUnixSocket));
        host = "unix://" + dedicatedUnixSocket;
    }

    internal static bool IsImageId(string? imageId) => imageId is { Length: 71 }
        && imageId.StartsWith("sha256:", StringComparison.Ordinal)
        && imageId.AsSpan(7).IndexOfAnyExcept("0123456789abcdef") == -1;

    async Task<RecordedReplayWorkerOutput?> IRecordedReplayWorker.RunAsync(string imageId, RecordedReplayWorkerInput input, CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();
        if (!OperatingSystem.IsLinux() || !IsImageId(imageId) || !File.Exists(Docker))
            return null;

        var name = "archlucid-historical-replay-" + Guid.NewGuid().ToString("N");
        using var deadline = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
        deadline.CancelAfter(TimeSpan.FromSeconds(30));
        RecordedReplayWorkerOutput? result = null;
        bool removed = false;
        try
        {
            var created = await ExecuteAsync(
                ["create", "--name", name, "--interactive", "--pull", "never", "--network", "none", "--ipc", "none",
                 "--read-only", "--cap-drop", "ALL", "--security-opt", "no-new-privileges", "--pids-limit", "64",
                 "--memory", "256m", "--memory-swap", "256m", "--cpus", "1", "--ulimit", "nofile=128:128",
                 "--log-driver", "none", "--no-healthcheck", "--user", "65532:65532",
                 "--workdir", "/app", "--entrypoint", "/usr/bin/env", imageId,
                 "-i", "DOTNET_EnableDiagnostics=0", "/usr/share/dotnet/dotnet", "/app/ArchLucid.HistoricalReplay.Worker.dll"],
                null, 128, deadline.Token);
            if (created is { ExitCode: 0 })
            {
                var executed = await ExecuteAsync(["start", "--attach", "--interactive", name], input, MaxWorkerOutputBytes, deadline.Token);
                if (executed is { ExitCode: 0 })
                    result = JsonSerializer.Deserialize<RecordedReplayWorkerOutput>(executed.Bytes, Wire);
            }
        }
        catch (Exception exception) when (exception is IOException or JsonException or Win32Exception or OperationCanceledException)
        {
            // Do not publish process output or error details, which may contain historical data.
        }
        finally
        {
            using var cleanup = new CancellationTokenSource(TimeSpan.FromSeconds(5));
            try
            {
                // Removing by the private generated name also covers a timed-out partial create or attach.
                removed = (await ExecuteAsync(["rm", "--force", name], null, 128, cleanup.Token)).ExitCode == 0;
            }
            catch (Exception exception) when (exception is IOException or Win32Exception or OperationCanceledException)
            {
                // Fail closed if cleanup could not be verified.
            }
        }

        cancellationToken.ThrowIfCancellationRequested();
        return removed ? result : null;
    }

    private async Task<(int ExitCode, byte[] Bytes)> ExecuteAsync(string[] arguments, RecordedReplayWorkerInput? input,
        int maximumOutput, CancellationToken ct)
    {
        var start = new ProcessStartInfo(Docker)
        {
            UseShellExecute = false, RedirectStandardOutput = true, RedirectStandardError = true,
            RedirectStandardInput = true, StandardInputEncoding = new UTF8Encoding(false), CreateNoWindow = true,
        };
        start.Environment.Clear();
        start.Environment["HOME"] = "/nonexistent";
        start.Environment["PATH"] = "/usr/bin:/bin";
        foreach (var argument in new[] { "--host", host }.Concat(arguments))
            start.ArgumentList.Add(argument);

        using var process = Process.Start(start) ?? throw new IOException("Could not start the replay isolation client.");
        using var lifetime = CancellationTokenSource.CreateLinkedTokenSource(ct);
        var io = lifetime.Token;
        Task<byte[]> read = ReadBoundedAsync(process.StandardOutput.BaseStream, maximumOutput, io);
        Task stderr = ReadBoundedAsync(process.StandardError.BaseStream, 8 * 1024, io);
        Task write = SendAsync(process, input, io);
        Task exit = process.WaitForExitAsync(io);
        Task[] tasks = [read, stderr, write, exit];
        try
        {
            List<Task> pending = [.. tasks];
            while (pending.Count > 0)
            {
                var next = await Task.WhenAny(pending).WaitAsync(io);
                await next;
                pending.Remove(next);
            }
            return (process.ExitCode, await read);
        }
        finally
        {
            await lifetime.CancelAsync();
            if (!process.HasExited)
            {
                try { process.Kill(entireProcessTree: true); }
                catch (InvalidOperationException) when (process.HasExited) { }
            }
            try { await Task.WhenAll(tasks).WaitAsync(TimeSpan.FromSeconds(1), CancellationToken.None); }
            catch (Exception exception) when (exception is IOException or OperationCanceledException or TimeoutException) { }
        }
    }

    private static async Task SendAsync(Process process, RecordedReplayWorkerInput? input, CancellationToken ct)
    {
        try
        {
            if (input is not null)
                await JsonSerializer.SerializeAsync(process.StandardInput.BaseStream, input, Wire, ct);
        }
        finally
        {
            process.StandardInput.Close();
        }
    }

    private static async Task<byte[]> ReadBoundedAsync(Stream source, int cap, CancellationToken ct)
    {
        using var output = new MemoryStream();
        byte[] buffer = new byte[4096];
        while (true)
        {
            var read = await source.ReadAsync(buffer, ct);
            if (read == 0)
                return output.ToArray();
            if (output.Length + read > cap)
                throw new IOException("Historical replay worker output exceeded its budget.");
            output.Write(buffer, 0, read);
        }
    }
}
