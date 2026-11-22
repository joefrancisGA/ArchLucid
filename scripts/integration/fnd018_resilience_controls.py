"""FND-018 deterministic retry, circuit-breaker and failure-budget contracts.

Pure state transitions: callers supply monotonic timestamps and outcomes.
No timers, sleeps, I/O, network calls or automatic execution.
"""
from __future__ import annotations
from dataclasses import dataclass
from enum import Enum


class Circuit(Enum):
    CLOSED = "closed"
    OPEN = "open"
    HALF_OPEN = "half_open"


@dataclass(frozen=True)
class RetryPolicy:
    max_attempts: int = 3
    base_delay_ms: int = 200
    max_delay_ms: int = 2000
    max_total_delay_ms: int = 3000

    def __post_init__(self):
        if not (1 <= self.max_attempts <= 10 and
                1 <= self.base_delay_ms <= self.max_delay_ms <= 60000 and
                self.max_total_delay_ms >= 0):
            raise ValueError("Invalid bounded retry policy")


@dataclass(frozen=True)
class RetryDecision:
    allowed: bool
    delay_ms: int
    reason: str


def retry_decision(policy: RetryPolicy, *, completed_attempts: int,
                   total_delay_ms: int, transient_failure: bool,
                   idempotent_operation: bool) -> RetryDecision:
    if completed_attempts < 1 or total_delay_ms < 0:
        return RetryDecision(False, 0, "invalid_attempt_state")
    if not transient_failure:
        return RetryDecision(False, 0, "nontransient_failure")
    if not idempotent_operation:
        return RetryDecision(False, 0, "non_idempotent_operation")
    if completed_attempts >= policy.max_attempts:
        return RetryDecision(False, 0, "attempt_limit")
    delay = min(policy.max_delay_ms, policy.base_delay_ms * (2 ** (completed_attempts - 1)))
    if total_delay_ms + delay > policy.max_total_delay_ms:
        return RetryDecision(False, 0, "delay_budget_exhausted")
    return RetryDecision(True, delay, "retry_permitted")


@dataclass(frozen=True)
class CircuitPolicy:
    failure_threshold: int = 3
    reset_after_ms: int = 30000

    def __post_init__(self):
        if self.failure_threshold < 1 or self.reset_after_ms < 1:
            raise ValueError("Invalid circuit policy")


@dataclass(frozen=True)
class CircuitState:
    mode: Circuit = Circuit.CLOSED
    consecutive_failures: int = 0
    opened_at_ms: int | None = None
    probe_in_flight: bool = False


@dataclass(frozen=True)
class Admission:
    permitted: bool
    reason: str
    state: CircuitState


def admit(state: CircuitState, policy: CircuitPolicy, *, now_ms: int) -> Admission:
    if now_ms < 0:
        return Admission(False, "invalid_clock", state)
    if state.mode is Circuit.OPEN:
        if state.opened_at_ms is None or now_ms < state.opened_at_ms:
            return Admission(False, "invalid_open_timestamp", state)
        if now_ms - state.opened_at_ms < policy.reset_after_ms:
            return Admission(False, "circuit_open", state)
        next_state = CircuitState(Circuit.HALF_OPEN, state.consecutive_failures,
                                  state.opened_at_ms, True)
        return Admission(True, "single_probe", next_state)
    if state.mode is Circuit.HALF_OPEN:
        if state.probe_in_flight:
            return Admission(False, "probe_in_flight", state)
        return Admission(True, "single_probe", CircuitState(
            Circuit.HALF_OPEN, state.consecutive_failures, state.opened_at_ms, True))
    return Admission(True, "circuit_closed", state)


def observe(state: CircuitState, policy: CircuitPolicy, *, success: bool,
            now_ms: int) -> CircuitState:
    if now_ms < 0:
        raise ValueError("Invalid clock")
    if state.mode is Circuit.OPEN:
        return state  # An unadmitted result must never close an open circuit.
    if state.mode is Circuit.HALF_OPEN:
        if not state.probe_in_flight:
            return state
        return CircuitState() if success else CircuitState(
            Circuit.OPEN, policy.failure_threshold, now_ms)
    if success:
        return CircuitState()
    failures = state.consecutive_failures + 1
    if failures >= policy.failure_threshold:
        return CircuitState(Circuit.OPEN, failures, now_ms)
    return CircuitState(Circuit.CLOSED, failures)


@dataclass(frozen=True)
class FailureBudget:
    window_start_ms: int
    failures: int = 0
    requests: int = 0


@dataclass(frozen=True)
class BudgetPolicy:
    window_ms: int = 60000
    max_failures: int = 5
    min_requests: int = 5

    def __post_init__(self):
        if min(self.window_ms, self.max_failures, self.min_requests) < 1:
            raise ValueError("Invalid failure budget")


def record_budget(state: FailureBudget, policy: BudgetPolicy, *,
                  now_ms: int, failed: bool) -> FailureBudget:
    if now_ms < state.window_start_ms:
        raise ValueError("Clock regression")
    if now_ms - state.window_start_ms >= policy.window_ms:
        state = FailureBudget(now_ms)
    return FailureBudget(state.window_start_ms,
                         state.failures + int(failed), state.requests + 1)


def budget_allows(state: FailureBudget, policy: BudgetPolicy) -> bool:
    return state.requests < policy.min_requests or state.failures < policy.max_failures
