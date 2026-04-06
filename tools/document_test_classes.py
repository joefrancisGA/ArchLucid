"""One-off helper: insert /// <summary> before test class declarations when missing."""
from __future__ import annotations

import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

# Only these test project roots (under solution root).
TEST_ROOTS = [
    ROOT / "ArchiForge.Api.Tests",
    ROOT / "ArchiForge.Persistence.Tests",
    ROOT / "ArchiForge.AgentRuntime.Tests",
    ROOT / "ArchiForge.Coordinator.Tests",
    ROOT / "ArchiForge.ContextIngestion.Tests",
    ROOT / "ArchiForge.Contracts.Tests",
    ROOT / "ArchiForge.Decisioning.Tests",
    ROOT / "ArchiForge.Decisioning.Tests",
    ROOT / "ArchiForge.KnowledgeGraph.Tests",
    ROOT / "ArchiForge.Retrieval.Tests",
    ROOT / "ArchiForge.Cli.Tests",
]

CLASS_RE = re.compile(
    r"^\s*public\s+(?:sealed\s+|static\s+|abstract\s+)*class\s+(\w+)",
    re.MULTILINE,
)

SKIP_FILES = {
    "AssemblyInfo.cs",
}


def pascal_words(name: str) -> str:
    s = re.sub(r"([a-z])([A-Z])", r"\1 \2", name)
    return s.replace("_", " ").strip()


def summary_for(class_name: str, rel: Path) -> str:
    if class_name.endswith("SqlIntegrationTests"):
        core = class_name[: -len("SqlIntegrationTests")]
        return (
            f"SQL Server integration tests for {pascal_words(core)} "
            f"(storage round-trips, relational vs JSON paths where applicable)."
        )
    if class_name.endswith("ContractTests"):
        core = class_name[: -len("ContractTests")]
        return f"Contract-focused tests for {pascal_words(core)} (naming or shared scenarios; see related *Tests for concrete implementations)."
    if "ContractTests" in class_name and class_name.endswith("Tests"):
        return f"Contract or integration tests for {pascal_words(class_name)}."
    if class_name.endswith("IntegrationTests"):
        core = class_name[: -len("IntegrationTests")]
        return f"Integration tests: {pascal_words(core)} (HTTP host, database, or cross-component)."
    if class_name.endswith("Tests"):
        core = class_name[: -len("Tests")]
        return f"Tests for {pascal_words(core)}."
    return f"Tests for {class_name}."


def find_class_line(lines: list[str]) -> int | None:
    for i, line in enumerate(lines):
        if CLASS_RE.match(line) and "Tests" in line:
            return i
    return None


def has_summary_above(lines: list[str], class_idx: int) -> bool:
    j = class_idx - 1
    while j >= 0 and lines[j].strip() == "":
        j -= 1
    while j >= 0 and lines[j].strip().startswith("["):
        j -= 1
    while j >= 0 and lines[j].strip() == "":
        j -= 1
    if j < 0:
        return False
    if not lines[j].strip().startswith("///"):
        return False
    k = j
    while k >= 0 and (lines[k].strip().startswith("///") or lines[k].strip() == ""):
        if "<summary>" in lines[k]:
            return True
        k -= 1
    return False


def insert_index(lines: list[str], class_idx: int) -> int:
    k = class_idx
    while k > 0 and lines[k - 1].strip().startswith("["):
        k -= 1
    return k


def process_file(path: Path) -> bool:
    if path.name in SKIP_FILES:
        return False
    text = path.read_text(encoding="utf-8")
    lines = text.splitlines(keepends=True)
    class_idx = find_class_line(lines)
    if class_idx is None:
        return False
    m = CLASS_RE.match(lines[class_idx])
    if not m:
        return False
    class_name = m.group(1)
    if not class_name.endswith("Tests") and not class_name.endswith("Test"):
        if "Fixture" not in class_name and "Factory" not in class_name and "Collection" not in class_name:
            return False
    if has_summary_above(lines, class_idx):
        return False
    rel = path.relative_to(ROOT)
    summ = summary_for(class_name, rel)
    idx = insert_index(lines, class_idx)
    block = f"/// <summary>\n/// {summ}\n/// </summary>\n\n"
    lines.insert(idx, block)
    path.write_text("".join(lines), encoding="utf-8")
    return True


def main() -> int:
    updated = 0
    for root in TEST_ROOTS:
        if not root.is_dir():
            continue
        for path in sorted(root.rglob("*.cs")):
            if "obj" in path.parts or "bin" in path.parts:
                continue
            try:
                if process_file(path):
                    updated += 1
                    print(path.relative_to(ROOT))
            except (OSError, UnicodeDecodeError) as e:
                print(f"skip {path}: {e}", file=sys.stderr)
    print(f"Updated {updated} files.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
