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
        ArgumentNullException.ThrowIfNull(serviceProvider);
        ArgumentNullException.ThrowIfNull(checks);
        ArgumentNullException.ThrowIfNull(debug);

        bool primaryOpen = false;
        bool fallbackRegistered = false;
        bool fallbackOpen = false;
        bool embeddingRegistered = false;
        bool embeddingOpen = false;
        bool anyGate = false;

        AppendGate(
            serviceProvider,
            checks,
            debug,
            OpenAiCircuitBreakerKeys.Completion,
            isOpen => primaryOpen = isOpen,
            registered =>
            {
                if (registered)
                    anyGate = true;
            });

        AppendGate(
            serviceProvider,
            checks,
            debug,
            OpenAiCircuitBreakerKeys.CompletionFallback,
            isOpen =>
            {
                fallbackRegistered = true;
                fallbackOpen = isOpen;
                anyGate = true;
            },
            registered => { });

        AppendGate(
            serviceProvider,
            checks,
            debug,
            OpenAiCircuitBreakerKeys.Embedding,
            isOpen =>
            {
                embeddingRegistered = true;
                embeddingOpen = isOpen;
                anyGate = true;
            },
            registered => { });

        if (!anyGate)
        {
            checks.Add(
                new WorkspaceAiAvailabilityCheckRow
                {
                    Name = "circuit_breakers",
                    Status = "skipped",
                    Detail = "OpenAI circuit breakers are not registered on this host.",
                });
        }

        return WorkspaceAiCircuitPathHealth.IsReviewPathUsable(
            primaryOpen,
            fallbackRegistered,
            fallbackOpen,
            embeddingRegistered,
            embeddingOpen);
    }

    private static void AppendGate(
        IServiceProvider serviceProvider,
        List<WorkspaceAiAvailabilityCheckRow> checks,
        Dictionary<string, string> debug,
        string gateKey,
        Action<bool> onRegisteredOpen,
        Action<bool> onPresence)
    {
        CircuitBreakerGate? gate = serviceProvider.GetKeyedService<CircuitBreakerGate>(gateKey);

        if (gate is null)
        {
            onPresence(false);
            return;
        }

        onPresence(true);

        string role = OpenAiCircuitBreakerHealthMetadata.ResolveRole(gateKey);
        debug[$"circuitBreaker.{role}.state"] = gate.CurrentState;
        debug[$"circuitBreaker.{role}.consecutiveFailures"] =
            gate.ConsecutiveFailureCount.ToString(CultureInfo.InvariantCulture);

        if (!string.IsNullOrWhiteSpace(gate.LastOpenReason))
            debug[$"circuitBreaker.{role}.lastOpenReason"] = gate.LastOpenReason;

        bool open = string.Equals(gate.CurrentState, "Open", StringComparison.Ordinal);
        bool degraded = open || string.Equals(gate.CurrentState, "HalfOpen", StringComparison.Ordinal);
        onRegisteredOpen(open);

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
}
