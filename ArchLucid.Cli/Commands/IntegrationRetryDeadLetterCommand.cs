using System.Diagnostics.CodeAnalysis;
using System.Net.Http.Json;
using System.Text.Json;

using ArchLucid.Contracts.Admin;

namespace ArchLucid.Cli.Commands;

[ExcludeFromCodeCoverage(Justification = "CLI HTTP integration; covered by command-line tests.")]
internal static class IntegrationRetryDeadLetterCommand
{
    internal static async Task<int> RunAsync(string[] args, CancellationToken cancellationToken = default)
    {
        ArchLucidProjectScaffolder.ArchLucidCliConfig? config = CliCommandShared.TryLoadConfigFromCwd();
        string baseUrl = CliAuthorizedHttpClient.ResolveBaseUrl(args, config);
        string? tenantIdRaw = CliCommandShared.TryGetOptionValue(args, "--tenant-id");
        string? eventType = CliCommandShared.TryGetOptionValue(args, "--event-type");

        Guid? tenantId = null;

        if (!string.IsNullOrWhiteSpace(tenantIdRaw))
        {
            if (!Guid.TryParse(tenantIdRaw, out Guid parsedTenantId))
            {
                await WriteErrorAsync("invalid_tenant_id", "Expected --tenant-id with a GUID value.");

                return CliExitCode.UsageError;
            }

            tenantId = parsedTenantId;
        }

        IntegrationOutboxDeadLetterBulkRetryRequest body = new()
        {
            TenantId = tenantId,
            EventType = eventType,
            MaxRows = 100
        };

        using HttpClient http = CliAuthorizedHttpClient.Create(baseUrl);

        using HttpResponseMessage response = await http.PostAsJsonAsync(
            "v1/admin/integrations/outbox/retry-dead-letter",
            body,
            cancellationToken);

        string text = await response.Content.ReadAsStringAsync(cancellationToken);

        if (!response.IsSuccessStatusCode)
        {
            await WriteErrorAsync("api_error", $"Error {(int)response.StatusCode}: {text}");

            return CliExitCode.OperationFailed;
        }

        IntegrationOutboxDeadLetterBulkRetryResponse? payload =
            JsonSerializer.Deserialize<IntegrationOutboxDeadLetterBulkRetryResponse>(
                text,
                new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

        if (CliExecutionContext.JsonOutput)
        {
            Console.WriteLine(text);

            return CliExitCode.Success;
        }

        int retried = payload?.RetriedCount ?? 0;
        Console.WriteLine($"Re-queued {retried} integration outbox dead-letter row(s).");

        if (payload?.RetriedOutboxIds is { Count: > 0 } ids)
        {
            foreach (Guid id in ids)
                Console.WriteLine($"  {id:D}");
        }

        return CliExitCode.Success;
    }

    internal static void WriteUsage()
    {
        const string plain =
            "Usage: archlucid integration retry-dead-letter [--tenant-id <guid>] [--event-type <type>] [--api-base-url <url>]\n"
            + "Requires ARCHLUCID_API_KEY with admin authority.";

        if (CliExecutionContext.JsonOutput)
            CliJson.WriteFailureLine(Console.Error, CliExitCode.UsageError, "usage", plain);
        else
            Console.WriteLine(plain);
    }

    private static async Task WriteErrorAsync(string code, string message)
    {
        if (CliExecutionContext.JsonOutput)
            CliJson.WriteFailureLine(Console.Error, CliExitCode.OperationFailed, code, message);
        else
            await Console.Error.WriteLineAsync(message);
    }
}
