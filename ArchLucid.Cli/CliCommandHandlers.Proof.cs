using ArchLucid.Cli.Commands;
using ArchLucid.Contracts.Common;

namespace ArchLucid.Cli;

internal static partial class CliCommandHandlers
{
    internal static Task<int> HandleProcurementPack(string[] normalized) =>
        ProcurementPackCommand.RunAsync(normalized.Skip(1).ToArray());


    internal static Task<int> HandleBuyerProofPack(string[] normalized) =>
        BuyerProofPackCommand.RunAsync(normalized.Skip(1).ToArray());


    internal static Task<int> HandleProofPacket(string[] normalized) =>
        ProofPacketCommand.RunAsync(normalized.Skip(1).ToArray());


    internal static Task<int> HandleSponsorPacket(string[] normalized) =>
        SponsorPacketCommand.RunAsync(normalized.Skip(1).ToArray());


    internal static async Task<int> HandleFirstValueReport(string[] normalized)
    {
        if (normalized.Length > 1)
        {
            bool saveReport = normalized.Skip(2).Contains("--save", StringComparer.Ordinal);

            return await FirstValueReportCommand.RunAsync(normalized[1], saveReport);
        }

        Console.WriteLine("Usage: archlucid first-value-report <runId> [--save]");

        return CliExitCode.UsageError;
    }


    internal static async Task<int> HandleSponsorOnePager(string[] normalized)
    {
        if (normalized.Length > 1)
        {
            bool savePdf = normalized.Skip(2).Contains("--save", StringComparer.Ordinal);

            return await SponsorOnePagerCommand.RunAsync(normalized[1], savePdf);
        }

        Console.WriteLine("Usage: archlucid sponsor-one-pager <runId> [--save]");

        return CliExitCode.UsageError;
    }


    internal static Task<int> HandleReferenceEvidence(string[] normalized) =>
        ReferenceEvidenceCommand.RunAsync(normalized.Skip(1).ToArray());
}
