import importlib.util
from pathlib import Path


SCRIPT_PATH = Path(__file__).resolve().parents[1] / "eval_agent_faithfulness.py"
SPEC = importlib.util.spec_from_file_location("eval_agent_faithfulness", SCRIPT_PATH)
MODULE = importlib.util.module_from_spec(SPEC)
assert SPEC.loader is not None
SPEC.loader.exec_module(MODULE)


def test_evaluate_case_classifies_missing_citation_wrong_corpus_and_roi_cost_claim():
    hits = [
        {"sourceId": "policy-a", "title": "Policy A", "corpusKind": "PriorManifest"},
        {"sourceId": "policy-b", "title": "Policy B", "corpusKind": "PolicyPack"},
    ]

    retrieved, supported, ratio, missing, wrong_corpus, unsupported_claims = MODULE._evaluate_case(
        hits,
        "Policy B supports this finding, but the cost claim omits its baseline.",
        expected_corpus_kind="PolicyPack",
        required_evidence_tokens=["cost-baseline-q2"],
        claim_issue_kind="unsupported-roi-cost-claim",
    )

    assert retrieved == 2
    assert supported == 1
    assert ratio == 0.5
    assert missing == ["policy-a"]
    assert wrong_corpus == ["policy-a"]
    assert unsupported_claims == ["unsupported-roi-cost-claim"]
