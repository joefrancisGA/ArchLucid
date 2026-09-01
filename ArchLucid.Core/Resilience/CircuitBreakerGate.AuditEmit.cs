using System.Diagnostics;
using System.Diagnostics.Metrics;

using ArchLucid.Core.Diagnostics;

namespace ArchLucid.Core.Resilience;

public sealed partial class CircuitBreakerGate
{
    private void EmitRejection()
    {
        TagList tags = new() { { "gate", GateName } };
        ArchLucidInstrumentation.CircuitBreakerRejections.Add(1, tags);
        string state = _state.ToString();

        InvokeAuditEntry("Rejection", state, state, null);
    }

    private void EmitStateTransition(string fromState, string toState)
    {
        _lastStateChangeUtc = _timeProvider.GetUtcNow();

        TagList tags = new() { { "gate", GateName }, { "from_state", fromState }, { "to_state", toState } };

        ArchLucidInstrumentation.CircuitBreakerStateTransitions.Add(1, tags);
        InvokeAuditEntry("StateTransition", fromState, toState, null);
    }

    private void EmitProbeOutcome(string outcome)
    {
        TagList tags = new() { { "gate", GateName }, { "outcome", outcome } };
        ArchLucidInstrumentation.CircuitBreakerProbeOutcomes.Add(1, tags);
        string state = _state.ToString();

        InvokeAuditEntry("ProbeOutcome", state, state, outcome);
    }

    private void InvokeAuditEntry(string transitionType, string fromState, string toState, string? probeOutcome)
    {
        if (_onAuditEntry is null)
            return;

        try
        {
            _onAuditEntry.Invoke(
                new CircuitBreakerAuditEntry(
                    GateName,
                    transitionType,
                    fromState,
                    toState,
                    probeOutcome,
                    _timeProvider.GetUtcNow()));
        }
        catch (Exception ex) when (ex is not OutOfMemoryException and not StackOverflowException)
        {
            // Audit callbacks must never break the circuit breaker (non-fatal exceptions only).
        }
    }
}
