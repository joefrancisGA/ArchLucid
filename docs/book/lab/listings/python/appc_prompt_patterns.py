"""Appendix C listings: the probable-flow checker.

Each region between `# region <name>` and `# endregion <name>` appears verbatim in the book under a
`<!-- listing: lab/listings/python/appc_prompt_patterns.py#<name> -->` marker. Edit the code here, then copy the
region into the book; docs/book/tools/check_listings.py fails when the two differ.
"""

from __future__ import annotations


# region probable_flow_problems
from pathlib import Path


def probable_flow_problems(
    flows: list[dict],
    repo_root: Path,
    known_stores: set[str],
    setting_values: dict[str, str],
) -> list[str]:
    """Reject proposed flows whose cited line doesn't exist or doesn't point at the store."""
    problems: list[str] = []
    root = repo_root.resolve()

    for index, flow in enumerate(flows, start=1):
        store = flow.get("store") or ""
        path = (root / (flow.get("file") or "")).resolve()

        if store not in known_stores:
            problems.append(f"Flow {index}: store '{store}' is not in the snapshot.")
            continue

        # The file name comes from the model. Never open anything outside the repository.
        if not path.is_relative_to(root):
            problems.append(f"Flow {index}: file '{flow.get('file')}' is outside the repository.")
            continue

        if not path.is_file():
            problems.append(f"Flow {index}: file '{flow.get('file')}' does not exist.")
            continue

        lines = path.read_text(encoding="utf-8", errors="replace").splitlines()
        line_number = flow.get("line") or 0

        if not 1 <= line_number <= len(lines):
            problems.append(f"Flow {index}: line {line_number} is outside the file.")
            continue

        # The line must name the store directly, or name a setting whose value is the store
        # (for example ARCHIVE_ACCOUNT, which the Terraform sets to custarchive).
        text = lines[line_number - 1]
        settings_for_store = [name for name, value in setting_values.items() if value == store]

        if store not in text and not any(name in text for name in settings_for_store):
            problems.append(
                f"Flow {index}: line {line_number} of '{flow.get('file')}' "
                f"does not mention {store}."
            )

    return problems
# endregion probable_flow_problems
