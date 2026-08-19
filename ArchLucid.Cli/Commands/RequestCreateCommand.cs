using ArchLucid.Cli.Request;
using ArchLucid.Contracts.Requests;

namespace ArchLucid.Cli.Commands;

/// <summary>
///     <c>archlucid request create --from-file</c> — POST a template JSON file to <c>/v1/architecture/request</c>.
/// </summary>
internal static class RequestCreateCommand
{
    public static async Task<int> RunAsync(string[] args, CancellationToken cancellationToken = default)
    {
        RequestCreateCommandOptions? options = RequestCreateCommandOptions.Parse(args, out string? parseError);

        if (options is null)
        {
            await Console.Out.WriteLineAsync(parseError);

            return CliExitCode.UsageError;
        }

        ArchitectureRequestFileParseOutcome parsed = ArchitectureRequestFileParser.ParseFromFile(options.InputPath);

        if (!parsed.IsSuccess)
        {
            await Console.Out.WriteLineAsync(parsed.Message ?? "Invalid architecture request file.");

            return MapParseFailureToExit(parsed.FailureCode);
        }

        ArchitectureRequestFileParseOutcome withRequestId =
            ArchitectureRequestFileParser.ApplyRequestIdOverride(
                parsed.Request!,
                options.RequestIdOverride,
                options.InputPath);

        if (!withRequestId.IsSuccess)
        {
            await Console.Out.WriteLineAsync(withRequestId.Message ?? "Invalid --request-id.");

            return CliExitCode.UsageError;
        }

        ArchitectureRequest request = withRequestId.Request!;
        ArchLucidProjectScaffolder.ArchLucidCliConfig? config = CliCommandShared.TryLoadConfigFromCwd();
        string baseUrl = options.ApiBaseUrlFromArgument
            ? options.ApiBaseUrl.TrimEnd('/')
            : ArchLucidApiClient.ResolveBaseUrl(config);

        ApiConnectionOutcome connection =
            await CliCommandShared.TryConnectToApiAsync(baseUrl, config, cancellationToken);

        if (connection is not ApiConnectionOutcome.Connected)
            return CliCommandShared.ExitCodeForFailedConnection(connection);

        ArchLucidApiClient client = new(baseUrl, config);

        ArchLucidApiClient.CreateRunResult create = await client.CreateRunAsync(request, cancellationToken);

        if (!create.Success || create.Response is null)
        {
            await Console.Out.WriteLineAsync($"Error: {create.Error}");
            CliOperatorHints.WriteAfterApiFailure(create.StatusCode, create.Error);

            return CliExitCode.OperationFailed;
        }

        string runId = create.Response.Run.RunId;
        string requestId = create.Response.Run.RequestId;

        if (CliExecutionContext.JsonOutput)
        {
            CliJson.WriteSuccessLine(
                Console.Out,
                new
                {
                    ok = true,
                    runId,
                    requestId,
                    status = create.Response.Run.Status.ToString()
                });
        }
        else
        {
            await Console.Out.WriteLineAsync($"RunId: {runId}");
            await Console.Out.WriteLineAsync($"RequestId: {requestId}");
            await Console.Out.WriteLineAsync($"Status: {create.Response.Run.Status}");
        }

        return CliExitCode.Success;
    }

    public static void WriteUsage()
    {
        Console.WriteLine(
            "Usage: archlucid request create --from-file <path.json> [--request-id <id>] [--api-base-url <url>]");
    }

    private static int MapParseFailureToExit(ArchitectureRequestFileParseFailureCode code)
    {
        return code switch
        {
            ArchitectureRequestFileParseFailureCode.PayloadTooLarge => CliExitCode.UsageError,
            _ => CliExitCode.UsageError
        };
    }
}
