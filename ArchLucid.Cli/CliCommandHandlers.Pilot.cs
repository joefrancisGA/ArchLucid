using System.Diagnostics.CodeAnalysis;

using ArchLucid.Cli.Commands;
using ArchLucid.Contracts.Common;


namespace ArchLucid.Cli;

internal static partial class CliCommandHandlers
{
    internal static async Task<int> HandlePilot(string[] normalized)
    {
        if (normalized.Length > 1)
        {
            if (normalized[1] == "up")
            {
                const string pilotUpRemoved =
                    "pilot up is not available in the product CLI (local Docker bring-up is contributor-only). Set ARCHLUCID_API_URL to your hosted API instead.";

                if (CliExecutionContext.JsonOutput)
                    CliJson.WriteFailureLine(
                        Console.Error,
                        CliExitCode.UsageError,
                        "usage",
                        pilotUpRemoved);
                else
                    Console.WriteLine(pilotUpRemoved);

                return CliExitCode.UsageError;
            }

            if (normalized[1] == "success-criteria-template")
                return await PilotSuccessCriteriaTemplateCommand.RunAsync();

            if (normalized[1] == "preflight")
                return await PilotPreflightCommand.RunAsync(normalized.Skip(2).ToArray());

            if (normalized[1] == "init")
                return await PilotInitCommand.RunAsync(normalized.Skip(2).ToArray());

            if (normalized[1] == "proof")
                return await PilotProofCommand.RunAsync(normalized.Skip(2).ToArray());

            if (normalized[1] == "proof-packet")
                return await PilotProofPacketCommand.RunAsync(normalized.Skip(2).ToArray());

            if (normalized[1] == "ship-gate-evidence")
                return await ShipGateEvidenceCommand.RunAsync(normalized.Skip(2).ToArray());

            if (normalized[1] == "frontier-ai-baseline")
                return await FrontierAiBaselineCommand.RunAsync(normalized.Skip(2).ToArray());

            if (normalized[1] == "itsm-pull-forward-gate")
                return await ItsmPullForwardCommand.RunAsync(normalized.Skip(2).ToArray());

            if (normalized[1] == "citation-integrity")
                return await CitationIntegrityCommand.RunAsync(normalized.Skip(2).ToArray());

            if (normalized[1] == "tenant-isolation-negative-test")
                return await TenantIsolationNegativeTestCommand.RunAsync(normalized.Skip(2).ToArray());

            if (normalized[1] == "return-trigger-telemetry")
                return await ReturnTriggerTelemetryCommand.RunAsync(normalized.Skip(2).ToArray());

            if (normalized[1] == "buyer-proof-evidence-ledger")
                return await BuyerProofEvidenceLedgerCommand.RunAsync(normalized.Skip(2).ToArray());

            if (normalized[1] == "decision-owner-scoreboard")
                return await DecisionOwnerScoreboardCommand.RunAsync(normalized.Skip(2).ToArray());

            if (normalized[1] == "readiness-bundle")
                return await PilotReadinessBundleCommand.RunAsync(normalized.Skip(2).ToArray());
        }

        Console.WriteLine("Expected: archlucid pilot init | archlucid pilot success-criteria-template | archlucid pilot preflight [--no-api] [--include-itsm] [--simulate-production] [--md] [--markdown-out <path>] | archlucid pilot proof [-- args for collect-first-pilot-proof.ps1] | archlucid pilot proof-packet <runId> [--out <dir>] | archlucid pilot ship-gate-evidence --run-id <guid> [--json-out <path>] [--markdown-out <path>] [--no-write-artifacts] [--ui-base-url <url>] | archlucid pilot frontier-ai-baseline [--scoreboard <path>] [--init-scoreboard] [--json-out <path>] [--markdown-out <path>] [--no-write-artifacts] | archlucid pilot itsm-pull-forward-gate [--ledger-dir <path>] [--evidence <path>] [--include-api] [--json-out <path>] [--markdown-out <path>] [--no-write-artifacts] | archlucid pilot citation-integrity [--fixtures-dir <path>] [--manifest <path>] [--sample-size <n>] [--fail-threshold <n>] [--include-api] [--json-out <path>] [--markdown-out <path>] [--no-write-artifacts] | archlucid pilot tenant-isolation-negative-test [--run-id <guid>] [--alternate-tenant-id <guid>] [--alternate-workspace-id <guid>] [--alternate-project-id <guid>] [--manifest <path>] [--json-out <path>] [--markdown-out <path>] [--no-write-artifacts] | archlucid pilot return-trigger-telemetry [--ledger-dir <path>] [--rules <path>] [--json-out <path>] [--markdown-out <path>] [--no-write-artifacts] | archlucid pilot buyer-proof-evidence-ledger [--proof-dir <path>] [--rules <path>] [--json-out <path>] [--markdown-out <path>] [--no-write-artifacts] | archlucid pilot decision-owner-scoreboard [--ledger-dir <path>] [--rules <path>] [--json-out <path>] [--markdown-out <path>] [--sponsor-markdown-out <path>] [--no-write-artifacts] | archlucid pilot readiness-bundle [--run-id <guid>] [--include-api] [--ui-base-url <url>] [--json-out <path>] [--markdown-out <path>] [--no-write-artifacts]");

        return CliExitCode.UsageError;
    }


}
