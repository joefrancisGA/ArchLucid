"""Split run-detail-workspace-derive.ts into domain modules."""

from __future__ import annotations

import re
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
SRC = REPO_ROOT / "archlucid-ui" / "src" / "lib" / "run-detail-workspace-derive.ts"
OUT_DIR = REPO_ROOT / "archlucid-ui" / "src" / "lib" / "run-detail-workspace-derive"

EXPORT_FN_RE = re.compile(r"^export function (\w+)", re.MULTILINE)
EXPORT_TYPE_RE = re.compile(r"^export type (\w+)", re.MULTILINE)

TYPE_NAMES = {
    "ReviewHeaderPresentation",
    "EvidenceCoverageSummary",
    "RunDetailWorkspaceStatusKind",
    "RunDetailWorkspaceStatus",
    "FindingSeverityCounts",
    "RunDetailWorkspaceRecommendedAction",
    "ReviewStatusSummary",
    "ExecutiveBottomLineContent",
    "DeriveRunDetailWorkspaceStatusInput",
}

FUNCTION_GROUPS: dict[str, list[str]] = {
    "finding-metrics.ts": [
        "countFindingsBySeverity",
        "deriveHighestFindingSeverityLabel",
        "filterUnresolvedFindings",
        "countOpenFindings",
        "deriveHighestUnresolvedSeverityLabel",
        "derivePrimaryConcernFinding",
        "derivePrimaryConcernLabel",
        "countFindingsAwaitingAction",
        "severityLabelForFinding",
    ],
    "review-metadata.ts": [
        "deriveArchitectureSystemName",
        "deriveSubmittedArchitectureText",
        "deriveReviewOwnerLabel",
        "deriveReviewTemplateLabel",
        "deriveLastEvaluatedLabel",
        "deriveFinalizedAtUtc",
    ],
    "workspace-status.ts": ["deriveRunDetailWorkspaceStatus"],
    "workspace-actions.ts": [
        "deriveBlockingApprovalCount",
        "deriveRecommendedWorkspaceActions",
        "deriveBlockingFindingHref",
        "shortenNextActionForPrimaryCta",
    ],
    "decision-snapshot.ts": [
        "formatDecisionSnapshotGovernanceOutcome",
        "formatDecisionSnapshotFindingsLine",
    ],
    "review-presentation.ts": [
        "deriveReviewNextActionLabel",
        "deriveReviewStatusSummary",
        "deriveExecutiveBottomLineContent",
        "isProductBrandReviewTitle",
        "deriveReviewHeaderPresentation",
        "derivePackageVersionLabel",
        "deriveEvidenceCoverageSummary",
        "deriveReviewDisplayTitle",
        "deriveOverallPostureLabel",
    ],
}


def find_function_end(text: str, decl_start: int) -> int:
    paren_depth = 0
    started_paren = False
    index = decl_start
    in_string = False
    escape = False
    expression_body = False

    while index < len(text):
        char = text[index]

        if not in_string and char == "=" and text[index : index + 2] == "=>":
            expression_body = True

        if in_string:
            if escape:
                escape = False
            elif char == "\\":
                escape = True
            elif char == '"':
                in_string = False
            index += 1
            continue

        if char == '"':
            in_string = True
            index += 1
            continue

        if char == "(":
            paren_depth += 1
            started_paren = True
        elif char == ")":
            paren_depth -= 1

            if started_paren and paren_depth == 0:
                index += 1
                break

        index += 1

    while index < len(text) and text[index] in " \t\r\n":
        index += 1

    if expression_body:
        while index < len(text):
            char = text[index]

            if char == ";":
                return index + 1

            index += 1

        return len(text)

    while index < len(text) and text[index] != "{":
        index += 1

    if index >= len(text):
        return len(text)

    brace_depth = 0
    started = False

    for body_index in range(index, len(text)):
        char = text[body_index]

        if char == "{":
            brace_depth += 1
            started = True
        elif char == "}":
            brace_depth -= 1

            if started and brace_depth == 0:
                return body_index + 1

    return len(text)


def find_type_end(text: str, start: int) -> int:
    brace_depth = 0
    started = False

    for index in range(start, len(text)):
        char = text[index]

        if char == "=":
            started = True
        elif char == "{":
            brace_depth += 1
        elif char == "}":
            brace_depth -= 1

            if started and brace_depth == 0:
                return index + 1
        elif char == ";" and started and brace_depth == 0:
            return index + 1

    return len(text)


def export_internal_declarations(content: str) -> str:
    content = re.sub(r"^function ", "export function ", content, flags=re.MULTILINE)
    return re.sub(r"^const ", "export const ", content, flags=re.MULTILINE)


def collect_internal_exports(internal_text: str) -> list[str]:
    names = re.findall(r"^export function (\w+)", internal_text, flags=re.MULTILINE)
    names.extend(re.findall(r"^export const (\w+)", internal_text, flags=re.MULTILINE))
    return names


CROSS_MODULE_IMPORTS: dict[str, list[tuple[str, str]]] = {
    "workspace-actions.ts": [("countFindingsBySeverity", "finding-metrics")],
    "decision-snapshot.ts": [("countFindingsBySeverity", "finding-metrics")],
    "review-metadata.ts": [("isProductBrandReviewTitle", "review-presentation")],
    "review-presentation.ts": [
        ("countFindingsBySeverity", "finding-metrics"),
        ("derivePrimaryConcernFinding", "finding-metrics"),
        ("countOpenFindings", "finding-metrics"),
        ("deriveHighestUnresolvedSeverityLabel", "finding-metrics"),
        ("countFindingsAwaitingAction", "finding-metrics"),
        ("derivePrimaryConcernLabel", "finding-metrics"),
        ("filterUnresolvedFindings", "finding-metrics"),
    ],
}


def build_imports(
    body: str,
    internal_exports: list[str],
    type_names: list[str],
    module_filename: str,
) -> str:
    imports: list[str] = []
    internal_used = [name for name in internal_exports if re.search(rf"\b{re.escape(name)}\b", body)]
    types_used = [name for name in type_names if re.search(rf"\b{re.escape(name)}\b", body)]

    if internal_used:
        imports.append("import {\n  " + ",\n  ".join(internal_used) + '\n} from "./internal";')

    if types_used:
        imports.append("import type {\n  " + ",\n  ".join(types_used) + '\n} from "./types";')

    for symbol, module in CROSS_MODULE_IMPORTS.get(module_filename, []):
        if re.search(rf"\b{re.escape(symbol)}\b", body):
            imports.append(f'import {{ {symbol} }} from "./{module}";')

    return ("\n".join(imports) + "\n") if imports else ""


def main() -> None:
    text = SRC.read_text(encoding="utf-8")
    first_export = min(
        [m.start() for m in EXPORT_FN_RE.finditer(text)] + [m.start() for m in EXPORT_TYPE_RE.finditer(text)]
    )
    import_block = text[:first_export]

    chunks: list[tuple[str, str, str]] = []

    for match in EXPORT_TYPE_RE.finditer(text):
        name = match.group(1)
        end = find_type_end(text, match.start())
        chunks.append(("type", name, text[match.start() : end].rstrip() + "\n"))

    type_chunks = [body for kind, name, body in chunks if kind == "type"]
    type_end = max((find_type_end(text, m.start()) for m in EXPORT_TYPE_RE.finditer(text)), default=first_export)

    fn_matches = list(EXPORT_FN_RE.finditer(text))
    prev_end = type_end
    internal_parts: list[str] = []
    fn_chunks: dict[str, str] = {}

    for match in fn_matches:
        if match.start() > prev_end:
            internal_parts.append(text[prev_end : match.start()])

        end = find_function_end(text, match.start())
        fn_chunks[match.group(1)] = text[match.start() : end].rstrip() + "\n"
        prev_end = end

    if prev_end < len(text):
        internal_parts.append(text[prev_end:])

    internal_body = export_internal_declarations("".join(internal_parts).strip())
    internal_content = import_block
    if internal_body:
        internal_content += "\n" + internal_body + "\n"
    internal_exports = collect_internal_exports(internal_content)

    OUT_DIR.mkdir(exist_ok=True)
    (OUT_DIR / "internal.ts").write_text(internal_content, encoding="utf-8")

    type_chunks = [body for kind, name, body in chunks if kind == "type"]
    (OUT_DIR / "types.ts").write_text(import_block + "".join(type_chunks), encoding="utf-8")

    all_types = sorted(TYPE_NAMES)

    for filename, names in FUNCTION_GROUPS.items():
        body = "".join(fn_chunks[name] for name in names)
        import_suffix = build_imports(body, internal_exports, all_types, filename)
        (OUT_DIR / filename).write_text(import_block + import_suffix + body, encoding="utf-8")
        print(f"wrote {filename} ({len(names)} exports)")

    index_lines = ["// Barrel: run-detail workspace derivation split by domain.\n"]
    index_lines.append('export type * from "./types";\n')
    for filename, names in FUNCTION_GROUPS.items():
        module = filename.removesuffix(".ts")
        for name in names:
            index_lines.append(f'export {{ {name} }} from "./{module}";')

    (OUT_DIR / "index.ts").write_text("\n".join(index_lines) + "\n", encoding="utf-8")
    print("wrote index.ts")


if __name__ == "__main__":
    main()
