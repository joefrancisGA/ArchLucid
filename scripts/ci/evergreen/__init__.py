"""Evergreen: launch a Cloud Agent to repair a red trunk gate.

Pipeline (one module per stage, wired by ``scripts/ci/evergreen_launch.py``):

1. ``FailureDigestBuilder`` reads the failed workflow run through ``gh api``.
2. ``FingerprintCalculator`` reduces the digest to a stable root-cause key.
3. ``LaunchPolicy`` decides whether to launch (branch scope, dedupe, daily cap).
4. ``PromptRenderer`` turns the digest into the agent prompt.
5. ``CloudAgentClient`` posts the prompt to the Cursor Cloud Agents API.
"""
