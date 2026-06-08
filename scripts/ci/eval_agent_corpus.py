#!/usr/bin/env python3
"""Real-mode evaluation harness for ArchLucid design verification (TB-140).

Reads naive-user input templates from the golden cohort, runs them through the
ArchLucid design-verification agent (currently mocked until the live wiring lands),
and grades the structured verdict against the hand-authored golden expected verdict.

The verdict schema is the contract: classification, rationale, inferred intent,
clarifying questions, blunt verdict, and confidence. This is the behavior we want
ArchLucid to exhibit for naive or out-of-domain input -- not a confident review of
something that is not an architecture.
"""
import os
import sys
import json
import glob
from datetime import datetime, timezone

CORPUS_DIR = "tests/golden-cohort/data"
OUTPUT_FILE = "artifacts/agent-output-quality.md"
EXPECTED_PAIRS_FILE = "tests/golden-cohort/expected.json"

# Budget constraints (owner decision 2026-06-07: $15/month, unrestricted data boundary).
BUDGET_LIMIT_USD = 15.00
ESTIMATED_COST_PER_1K_PROMPT = 0.005
ESTIMATED_COST_PER_1K_COMPLETION = 0.015

# Verdict fields rendered in the report, in display order.
VERDICT_FIELDS = [
    ("domain_fit", "Domain fit"),
    ("classification", "Classification"),
    ("rationale", "Why (blunt rationale)"),
    ("inferred_intent", "Inferred intent (recoverable system, if any)"),
    ("verdict", "Verdict"),
    ("confidence", "Confidence"),
]


def estimate_tokens(text):
    # Rough estimate: 1 token ~= 4 characters. Good enough for budget gating.
    return len(text) // 4


def estimate_cost(prompt_tokens, completion_tokens):
    prompt_cost = prompt_tokens / 1000.0 * ESTIMATED_COST_PER_1K_PROMPT
    completion_cost = completion_tokens / 1000.0 * ESTIMATED_COST_PER_1K_COMPLETION

    return prompt_cost + completion_cost


def load_expected_verdicts():
    if not os.path.exists(EXPECTED_PAIRS_FILE):
        return {}

    with open(EXPECTED_PAIRS_FILE, "r", encoding="utf-8") as handle:
        return json.load(handle)


def run_agent_pipeline(template_content):
    # PLACEHOLDER until the live agent is wired in.
    # In real mode this calls POST /v1/architecture/request then .../execute and
    # returns the agent's structured design-verification verdict plus token usage.
    prompt_tokens = estimate_tokens(template_content)
    completion_tokens = 800

    placeholder_verdict = {
        "domain_fit": "PENDING-REAL-MODEL",
        "classification": "Not yet evaluated -- live agent not wired",
        "rationale": "The real model call is not implemented in this harness yet. Compare against the golden expected verdict below.",
        "inferred_intent": "n/a",
        "clarifying_questions": [],
        "verdict": "PENDING -- author the live agent call to populate this.",
        "confidence": "n/a",
    }

    return {
        "verdict": placeholder_verdict,
        "prompt_tokens": prompt_tokens,
        "completion_tokens": completion_tokens,
    }


def evaluate_template(file_path, expected_verdicts, spent_so_far):
    filename = os.path.basename(file_path)

    with open(file_path, "r", encoding="utf-8") as handle:
        content = handle.read()

    # Pre-flight budget gate: estimate before spending.
    est_cost = estimate_cost(estimate_tokens(content), 1000)

    if spent_so_far + est_cost > BUDGET_LIMIT_USD:
        return {"file": filename, "status": "SKIPPED_BUDGET_LIMIT", "cost_usd": 0.0}

    print(f"  Invoking design-verification agent for {filename} ...")
    response = run_agent_pipeline(content)
    actual_cost = estimate_cost(response["prompt_tokens"], response["completion_tokens"])

    golden = expected_verdicts.get(filename)
    status = golden["domain_fit"] if golden else "NO-GOLDEN-VERDICT"

    return {
        "file": filename,
        "status": status,
        "prompt_tokens": response["prompt_tokens"],
        "completion_tokens": response["completion_tokens"],
        "cost_usd": actual_cost,
        "actual_verdict": response["verdict"],
        "golden_verdict": golden,
    }


def render_verdict_block(handle, title, verdict):
    handle.write(f"**{title}:**\n\n")

    if verdict is None:
        handle.write("_None authored yet._\n\n")
        return

    for key, label in VERDICT_FIELDS:
        value = verdict.get(key, "n/a")
        handle.write(f"- **{label}:** {value}\n")

    questions = verdict.get("clarifying_questions", [])

    if questions:
        handle.write("- **Clarifying questions ArchLucid should ask:**\n")

        for question in questions:
            handle.write(f"    - {question}\n")

    handle.write("\n")


def write_report(results, total_cost_usd):
    os.makedirs(os.path.dirname(OUTPUT_FILE), exist_ok=True)

    with open(OUTPUT_FILE, "w", encoding="utf-8") as handle:
        handle.write("# Agent Output Quality Report (Real-Mode Design Verification)\n\n")
        handle.write(f"**Date:** {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M:%S')} UTC\n")
        handle.write(f"**Total Cost:** ${total_cost_usd:.4f} / ${BUDGET_LIMIT_USD:.2f} budget\n\n")

        handle.write("## Summary\n")
        handle.write("| Template | Domain Fit | Prompt Tokens | Completion Tokens | Cost (USD) |\n")
        handle.write("|---|---|---|---|---|\n")

        for result in results:
            if result["status"] == "SKIPPED_BUDGET_LIMIT":
                handle.write(f"| {result['file']} | SKIPPED (budget) | - | - | - |\n")
            else:
                handle.write(
                    f"| {result['file']} | {result['status']} | {result['prompt_tokens']} "
                    f"| {result['completion_tokens']} | ${result['cost_usd']:.4f} |\n"
                )

        handle.write("\n## Details\n")

        for result in results:
            if result["status"] == "SKIPPED_BUDGET_LIMIT":
                continue

            handle.write(f"### {result['file']}\n\n")
            render_verdict_block(handle, "Golden expected verdict (target)", result.get("golden_verdict"))
            render_verdict_block(handle, "Actual agent verdict", result.get("actual_verdict"))

    print(f"Report written to {OUTPUT_FILE}")


def main():
    print("Starting Real-Mode Design-Verification Harness (TB-140)")

    if not os.path.exists(CORPUS_DIR):
        print(f"Error: Corpus directory {CORPUS_DIR} not found.")
        sys.exit(1)

    template_files = sorted(glob.glob(os.path.join(CORPUS_DIR, "*.txt")))

    if not template_files:
        print(f"Warning: No templates found in {CORPUS_DIR}.")
        sys.exit(0)

    expected_verdicts = load_expected_verdicts()
    total_cost_usd = 0.0
    results = []

    for file_path in template_files:
        print(f"Processing template: {os.path.basename(file_path)}")
        result = evaluate_template(file_path, expected_verdicts, total_cost_usd)

        if result["status"] == "SKIPPED_BUDGET_LIMIT":
            print(f"BUDGET STOP: ${BUDGET_LIMIT_USD} limit would be exceeded. Halting.")
            results.append(result)
            break

        total_cost_usd += result["cost_usd"]
        results.append(result)

    print(f"Evaluation complete. Total estimated cost: ${total_cost_usd:.4f}")
    write_report(results, total_cost_usd)


if __name__ == "__main__":
    main()
