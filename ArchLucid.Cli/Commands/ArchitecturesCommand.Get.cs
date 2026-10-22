using System.Text.Json;

using ArchLucid.Contracts.Architecture;

namespace ArchLucid.Cli.Commands;

internal static partial class ArchitecturesCommand
{
    private static async Task<int> GetAsync(ArchLucidApiClient client, string[] args)
    {
        if (args.Length == 0)
        {
            Console.WriteLine("Usage: archlucid architectures get <architectureId> [--json]");

            return CliExitCode.UsageError;
        }

        string architectureIdText = args[0];
        bool asJson = CliExecutionContext.JsonOutput || args.Any(arg => arg == "--json");

        if (!TryParseArchitectureIdentityId(architectureIdText, out Guid architectureId))
        {
            Console.WriteLine("architectureId must be a GUID — draft ids and review run ids are not architecture identities.");

            return CliExitCode.UsageError;
        }

        ArchitectureIdentityDetail? detail = await client.GetArchitectureAsync(architectureId);

        if (detail is null)
        {
            Console.WriteLine("Failed to get architecture identity (unauthorized, not found, out of scope, or request failed).");

            return CliExitCode.OperationFailed;
        }

        if (asJson)
        {
            string json = JsonSerializer.Serialize(detail, CliCommandShared.JsonWriteIndented);
            Console.WriteLine(json);

            return CliExitCode.Success;
        }

        Console.WriteLine($"ArchitectureId={detail.ArchitectureId:D}");
        Console.WriteLine($"DisplayName={detail.DisplayName}");
        Console.WriteLine($"UpdatedUtc={detail.UpdatedUtc:O}");
        Console.WriteLine($"DraftCount={detail.DraftCount}");
        Console.WriteLine($"ReviewCount={detail.ReviewCount}");

        if (detail.Drafts.Count > 0)
        {
            Console.WriteLine("Drafts:");

            foreach (ArchitectureIdentityChildDraftSummary draft in detail.Drafts)

                Console.WriteLine(
                    $"- DraftId={draft.DraftId:D} Status={draft.Status} SystemName={draft.SystemName ?? ""} UpdatedUtc={draft.UpdatedUtc:O}");
        }

        if (detail.Reviews.Count > 0)
        {
            Console.WriteLine("Reviews:");

            foreach (ArchitectureIdentityChildReviewSummary review in detail.Reviews)

                Console.WriteLine(
                    $"- RunId={review.RunId:D} Description={review.Description ?? ""} CreatedUtc={review.CreatedUtc:O}");
        }

        return CliExitCode.Success;
    }

    internal static bool TryParseArchitectureIdentityId(string text, out Guid architectureId) =>
        Guid.TryParse(text, out architectureId);
}
