namespace ArchLucid.Core.Resilience;

public sealed partial class CircuitBreakerGate
{
    /// <summary>
    ///     Throws <see cref="CircuitBreakerOpenException" /> if the circuit rejects the call; otherwise returns
    ///     so the caller may invoke the downstream operation (and then call <see cref="RecordSuccess" /> or
    ///     <see cref="RecordFailure" /> / <see cref="RecordCallCancelled" />).
    /// </summary>
    public void ThrowIfBroken()
    {
        lock (_sync)
        {
            if (_state == State.Closed)
                return;

            if (_state == State.Open)
            {
                if (_timeProvider.GetUtcNow() < _openUntilUtc)
                {
                    EmitRejection();

                    throw new CircuitBreakerOpenException(_openUntilUtc);
                }

                if (_probeInFlight)
                {
                    EmitRejection();

                    throw new CircuitBreakerOpenException(
                        "Upstream AI recovery probe in progress; retry shortly.");
                }

                _state = State.HalfOpen;
                _probeInFlight = true;
                EmitStateTransition("Open", "HalfOpen");

                return;
            }

            // HalfOpen: only the probing thread holds the slot; others wait out.

            if (!_probeInFlight)
                return;

            EmitRejection();

            throw new CircuitBreakerOpenException(
                "Upstream AI recovery probe in progress; retry shortly.");
        }
    }

    /// <summary>Call after a successful downstream invocation.</summary>
    public void RecordSuccess()
    {
        lock (_sync)
        {
            if (_state == State.HalfOpen && _probeInFlight)
            {
                EmitProbeOutcome("success");
                _halfOpenSuccessCount++;
                CircuitBreakerOptions opts = ResolveOptions();

                if (_halfOpenSuccessCount >= opts.HalfOpenSuccessThreshold)
                {
                    EmitStateTransition("HalfOpen", "Closed");
                    _consecutiveFailures = 0;
                    _state = State.Closed;
                    _probeInFlight = false;
                    _halfOpenSuccessCount = 0;
                    _lastOpenReason = null;

                    return;
                }

                _probeInFlight = false;

                return;
            }

            _consecutiveFailures = 0;
            _state = State.Closed;
            _probeInFlight = false;
            _halfOpenSuccessCount = 0;
            _lastOpenReason = null;
        }
    }

    /// <summary>Call after a failed downstream invocation (counts toward opening the circuit).</summary>
    public void RecordFailure()
    {
        lock (_sync)
        {
            CircuitBreakerOptions opts = ResolveOptions();

            if (_state == State.HalfOpen)
            {
                EmitProbeOutcome("failure");
                EmitStateTransition("HalfOpen", "Open");
                _state = State.Open;
                _openUntilUtc = _timeProvider.GetUtcNow().AddSeconds(opts.DurationOfBreakSeconds);
                _probeInFlight = false;
                _consecutiveFailures = opts.FailureThreshold;
                _halfOpenSuccessCount = 0;
                _lastOpenReason = "half_open_probe_failed";

                return;
            }

            _consecutiveFailures++;

            if (_consecutiveFailures < opts.FailureThreshold)
                return;

            EmitStateTransition("Closed", "Open");
            _state = State.Open;
            _openUntilUtc = _timeProvider.GetUtcNow().AddSeconds(opts.DurationOfBreakSeconds);
            _lastOpenReason = "consecutive_failures";
        }
    }

    /// <summary>
    ///     Call when the caller canceled the operation so the probe slot is released without a failure tick.
    /// </summary>
    public void RecordCallCancelled()
    {
        lock (_sync)
        {
            if (_state != State.HalfOpen || !_probeInFlight)
                return;

            EmitProbeOutcome("canceled");
            EmitStateTransition("HalfOpen", "Open");
            _probeInFlight = false;
            _state = State.Open;
            _openUntilUtc = _timeProvider.GetUtcNow();
            _halfOpenSuccessCount = 0;
            _lastOpenReason = "half_open_probe_failed";
        }
    }
}
