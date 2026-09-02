using System.Globalization;

using ArchLucid.Contracts.Diagnostics;
using ArchLucid.Core.Resilience;
using ArchLucid.Host.Core.Resilience;

using Microsoft.Extensions.DependencyInjection;

namespace ArchLucid.Host.Composition.Services.Probes;

internal static class WorkspaceAiCircuitBreakerProbe
{
    internal static bool AppendChecks(
        IServiceProvider serviceProvider,
        List<WorkspaceAiAvailabilityCheckRow> checks,
        Dictionary<string, string> debug)
    {
        string[] gateKeys =
        [
            OpenAiCircuitBreakerKeys.Completion,
            OpenAiCircuitBreakerKeys.CompletionFallback,
            OpenAiCircuitBreakerKeys.Embedding,
        ];

        bool allClosed = true;

        foreach (string gateKey in gateKeys)
        {
            CircuitBreakerGate? gate = serviceProvider.GetKeyedService<CircuitBreakerGate>(gateKey);

            if (gate is null)
            {
                continue;
            }

            string role = OpenAiCircuitBreakerHealthMetadata.ResolveRole(gateKey);
            debug[$"circuitBreaker.{role}.state"] = gate.CurrentState;
            debug[$"circuitBreaker.{role}.consecutiveFailures"] =
                gate.ConsecutiveFailureCount.ToString(CultureInfo.InvariantCulture);

            if (!string.IsNullOrWhiteSpace(gate.LastOpenReason))
            {
                debug[$"circuitBreaker.{role}.lastOpenReason"] = gate.LastOpenReason;
            }

            bool degraded = gate.CurrentState is "Open" or "HalfOpen";

            if (degraded)
            {
                allClosed = false;
            }

            checks.Add(
                new WorkspaceAiAvailabilityCheckRow
                {
                    Name = $"circuit_breaker_{role}",
                    Status = degraded ? "degraded" : "ok",
                    Detail = degraded
                        ? $"Circuit '{role}' is {gate.CurrentState}."
                        : $"Circuit '{role}' is closed.",
                });
        }

        if (checks.All(row => !row.Name.StartsWith("circuit_breaker_", StringComparison.Ordinal)))
        {
            checks.Add(
                new WorkspaceAiAvailabilityCheckRow
                {
                    Name = "circuit_breakers",
                    Status = "skipped",
                    Detail = "OpenAI circuit breakers are not registered on this host.",
                });
        }

        return allClosed;
    }
}
