using System.Security.Cryptography;
using System.Text;

namespace ArchLucid.Core.AgentSimulation;

/// <summary>
///     Deterministic <see cref="AgentResult" /> builders shared by simulator execution paths (no LLM).
///     Lives in Core so production adapters (echo client, cost handler) avoid referencing <c>AgentSimulator</c>.
/// </summary>
public static partial class FakeScenarioFactory
{
    /// <summary>
    ///     Fixed synthetic timestamp for Simulator <see cref="AgentResult.CreatedUtc" /> so golden-cohort locks and
    ///     determinism tests do not depend on wall-clock time.
    /// </summary>
    private static readonly DateTime SimulatorSyntheticCreatedUtc = new(2024, 6, 1, 0, 0, 0, DateTimeKind.Utc);

    /// <summary>128-bit lowercase hex id (same shape as <c>Guid.ToString("N")</c>) derived from run + task + slot.</summary>
    private static string StableHexId(string runId, string taskId, string slot)
    {
        byte[] digest = SHA256.HashData(Encoding.UTF8.GetBytes($"{runId}|{taskId}|{slot}"));

        return Convert.ToHexString(digest.AsSpan(0, 16)).ToLowerInvariant();
    }
}
