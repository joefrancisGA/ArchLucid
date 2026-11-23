import unittest
from scripts.integration.fnd018_resilience_controls import (
    Circuit, CircuitPolicy, CircuitState, RetryPolicy, FailureBudget,
    BudgetPolicy, admit, observe, retry_decision, record_budget, budget_allows,
)


class ResilienceContractsTests(unittest.TestCase):
    def test_bounded_exponential_retry(self):
        policy = RetryPolicy()
        self.assertEqual(retry_decision(policy, completed_attempts=1,
            total_delay_ms=0, transient_failure=True,
            idempotent_operation=True).delay_ms, 200)
        self.assertEqual(retry_decision(policy, completed_attempts=2,
            total_delay_ms=200, transient_failure=True,
            idempotent_operation=True).delay_ms, 400)

    def test_retry_attempt_limit(self):
        self.assertFalse(retry_decision(RetryPolicy(), completed_attempts=3,
            total_delay_ms=600, transient_failure=True,
            idempotent_operation=True).allowed)

    def test_no_retry_non_idempotent(self):
        self.assertEqual(retry_decision(RetryPolicy(), completed_attempts=1,
            total_delay_ms=0, transient_failure=True,
            idempotent_operation=False).reason, "non_idempotent_operation")

    def test_no_retry_permanent_failure(self):
        self.assertFalse(retry_decision(RetryPolicy(), completed_attempts=1,
            total_delay_ms=0, transient_failure=False,
            idempotent_operation=True).allowed)

    def test_delay_budget_exhaustion(self):
        self.assertEqual(retry_decision(RetryPolicy(max_total_delay_ms=100),
            completed_attempts=1, total_delay_ms=0,
            transient_failure=True, idempotent_operation=True).reason,
            "delay_budget_exhausted")

    def test_breaker_opens_on_threshold(self):
        policy = CircuitPolicy(failure_threshold=2, reset_after_ms=100)
        state = observe(CircuitState(), policy, success=False, now_ms=0)
        state = observe(state, policy, success=False, now_ms=1)
        self.assertEqual(state.mode, Circuit.OPEN)
        self.assertFalse(admit(state, policy, now_ms=50).permitted)

    def test_half_open_single_probe(self):
        policy = CircuitPolicy(failure_threshold=1, reset_after_ms=100)
        opened = observe(CircuitState(), policy, success=False, now_ms=10)
        admission = admit(opened, policy, now_ms=110)
        self.assertTrue(admission.permitted)
        self.assertEqual(admission.state.mode, Circuit.HALF_OPEN)
        self.assertFalse(admit(admission.state, policy, now_ms=111).permitted)

    def test_successful_probe_closes(self):
        policy = CircuitPolicy(failure_threshold=1, reset_after_ms=10)
        opened = observe(CircuitState(), policy, success=False, now_ms=0)
        probe = admit(opened, policy, now_ms=10).state
        self.assertEqual(observe(probe, policy, success=True, now_ms=11).mode,
                         Circuit.CLOSED)

    def test_failed_probe_reopens(self):
        policy = CircuitPolicy(failure_threshold=1, reset_after_ms=10)
        opened = observe(CircuitState(), policy, success=False, now_ms=0)
        probe = admit(opened, policy, now_ms=10).state
        self.assertEqual(observe(probe, policy, success=False, now_ms=11).mode,
                         Circuit.OPEN)

    def test_budget_exhaustion_and_window_reset(self):
        policy = BudgetPolicy(window_ms=100, max_failures=2, min_requests=2)
        state = FailureBudget(0)
        state = record_budget(state, policy, now_ms=1, failed=True)
        state = record_budget(state, policy, now_ms=2, failed=True)
        self.assertFalse(budget_allows(state, policy))
        state = record_budget(state, policy, now_ms=100, failed=False)
        self.assertTrue(budget_allows(state, policy))

    def test_clock_regression_rejected(self):
        with self.assertRaises(ValueError):
            record_budget(FailureBudget(100), BudgetPolicy(), now_ms=99, failed=True)

    def test_open_circuit_ignores_unadmitted_result(self):
        policy = CircuitPolicy(failure_threshold=1)
        state = observe(CircuitState(), policy, success=False, now_ms=1)
        self.assertEqual(observe(state, policy, success=True, now_ms=2), state)


if __name__ == "__main__":
    unittest.main()
