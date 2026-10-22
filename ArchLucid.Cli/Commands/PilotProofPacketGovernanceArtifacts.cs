using System.Text.Json;

namespace ArchLucid.Cli.Commands;

/// <summary>
///     Buyer-safe governance and audit summaries for <c>pilot proof-packet</c> folders.
/// </summary>
internal static partial class PilotProofPacketGovernanceArtifacts
{
    private static readonly JsonSerializerOptions JsonWrite = new() { WriteIndented = true };
}
