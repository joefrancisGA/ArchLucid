"""Split contributor-leakage.ts into domain modules with shared private helpers."""

from __future__ import annotations

import re
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
SRC = REPO_ROOT / "archlucid-ui" / "src" / "lib" / "help-markdown" / "contributor-leakage.ts"
OUT_DIR = REPO_ROOT / "archlucid-ui" / "src" / "lib" / "help-markdown" / "contributor-leakage"

EXPORT_RE = re.compile(r"^export function (\w+)", re.MULTILINE)
INTERNAL_EXPORT_RE = re.compile(r"^export (?:function|const) (\w+)", re.MULTILINE)
CROSS_EXPORT_IMPORTS: dict[str, list[tuple[str, str]]] = {
    "executive-pilot-roi": [("stripProductOverviewContributorLeakage", "policy-and-misc")],
}


def bucket(name: str) -> str:
    lowered = name.lower()
    if "procurement" in lowered or "configurationreference" in lowered:
        return "procurement-and-config"
    if "enterpriseonboarding" in lowered or "evaluatorworkbook" in lowered:
        return "onboarding-and-enterprise"
    if "governanceapicontracts" in lowered:
        return "governance-and-api"
    if (
        "executivesummary" in lowered
        or "pilotroi" in lowered
        or "pilotfeedback" in lowered
        or "firstvalue20" in lowered
    ):
        return "executive-pilot-roi"
    if "repeatreviewloop" in lowered or "acceleratorchooser" in lowered or "priormanifest" in lowered:
        return "review-loop-and-accelerator"
    if (
        "azureboards" in lowered
        or "caiqsig" in lowered
        or "subprocessors" in lowered
        or "tenantisolation" in lowered
        or "dpatemplate" in lowered
        or "trustcenter" in lowered
        or "soc2" in lowered
        or "datahandling" in lowered
    ):
        return "integrations-trust"
    if (
        "firstreview" in lowered
        or "cliusage" in lowered
        or "developertroubleshooting" in lowered
        or "evidence" in lowered
        or "pathchooser" in lowered
    ):
        return "evidence-and-cli"
    return "policy-and-misc"


def find_function_end(text: str, start_pos: int) -> int:
    brace_depth = 0
    started = False

    for index in range(start_pos, len(text)):
        char = text[index]

        if char == "{":
            brace_depth += 1
            started = True
        elif char == "}":
            brace_depth -= 1

            if started and brace_depth == 0:
                return index + 1

    return len(text)


def rewrite_import_paths(content: str) -> str:
    content = content.replace('from "./leakage-rewrite-table"', 'from "../leakage-rewrite-table"')
    return content.replace(
        'from "./contributor-leakage-rewrite-tables"',
        'from "../contributor-leakage-rewrite-tables"',
    )


def export_internal_declarations(content: str) -> str:
    content = re.sub(r"^function ", "export function ", content, flags=re.MULTILINE)
    return re.sub(r"^const ", "export const ", content, flags=re.MULTILINE)


def collect_internal_exports(internal_text: str) -> list[str]:
    return INTERNAL_EXPORT_RE.findall(internal_text)



def build_imports_for_file(
    body: str,
    internal_exports: list[str],
    cross_imports: list[tuple[str, str]],
) -> list[str]:
    imports: list[str] = []
    internal_used = [name for name in internal_exports if re.search(rf"\b{re.escape(name)}\b", body)]

    if internal_used:
        imports.append(
            "import {\n  " + ",\n  ".join(internal_used) + '\n} from "./internal";',
        )

    for symbol, module in cross_imports:
        if re.search(rf"\b{re.escape(symbol)}\b", body):
            imports.append(f'import {{ {symbol} }} from "./{module}";')

    return imports


def main() -> None:
    text = SRC.read_text(encoding="utf-8")
    matches = list(EXPORT_RE.finditer(text))

    if not matches:
        raise SystemExit("No export functions found")

    import_block = text[: matches[0].start()]
    prev_end = matches[0].start()
    internal_parts: list[str] = []
    chunks: list[tuple[str, str]] = []

    for match in matches:
        if match.start() > prev_end:
            internal_parts.append(text[prev_end : match.start()])

        chunk_end = find_function_end(text, match.start())
        chunks.append((match.group(1), text[match.start() : chunk_end].rstrip() + "\n"))
        prev_end = chunk_end

    if prev_end < len(text):
        internal_parts.append(text[prev_end:])

    internal_body = export_internal_declarations("".join(internal_parts).strip())
    internal_content = rewrite_import_paths(import_block)
    if internal_body:
        internal_content += "\n" + internal_body + "\n"
    internal_exports = collect_internal_exports(internal_content)

    groups: dict[str, list[str]] = {}
    export_to_group: dict[str, str] = {}

    for name, body in chunks:
        group = bucket(name)
        groups.setdefault(group, []).append(body)
        export_to_group[name] = group

    OUT_DIR.mkdir(exist_ok=True)
    (OUT_DIR / "internal.ts").write_text(internal_content, encoding="utf-8")
    print(f"wrote internal.ts ({len(internal_exports)} private exports)")

    for group, bodies in groups.items():
        body = "".join(bodies)
        imports = build_imports_for_file(
            body,
            internal_exports,
            CROSS_EXPORT_IMPORTS.get(group, []),
        )
        normalized_import_block = rewrite_import_paths(import_block)
        import_suffix = ("\n".join(imports) + "\n") if imports else ""
        content = normalized_import_block + import_suffix + body
        (OUT_DIR / f"{group}.ts").write_text(content, encoding="utf-8")
        print(f"wrote {group}.ts ({len(bodies)} exports)")

    index_lines = ["// Barrel: contributor-leakage transforms split by domain.\n"]
    for name in sorted(export_to_group):
        index_lines.append(f'export {{ {name} }} from "./{export_to_group[name]}";')

    (OUT_DIR / "index.ts").write_text("\n".join(index_lines) + "\n", encoding="utf-8")
    print(f"wrote index.ts ({len(export_to_group)} exports)")


if __name__ == "__main__":
    main()
