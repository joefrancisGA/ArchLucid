#!/usr/bin/env python3
"""CI guard: ArchLucid.Api controller mutating routes appear in AUDIT_COVERAGE_MATRIX.md.

Scans ``ArchLucid.Api/Controllers/**/*.cs`` for ``[HttpPost]``, ``[HttpPut]``, and ``[HttpDelete]`` action
attributes. For each action, resolves route templates (class- and method-level ``[Route]``, multiple verb
attributes, absolute ``"/v{version:apiVersion}/…"`` patterns) and asserts each ``METHOD + path`` is documented
in ``docs/library/AUDIT_COVERAGE_MATRIX.md`` using the same rules as
``assert_openapi_mutations_in_audit_matrix.py`` (full path or ``POST …/suffix`` ellipsis form).

Bypass (explicit exceptions only):
  - Attribute ``[AuditExempt]`` (optional namespace / ctor args) on the action's attribute stack, or
  - End-of-line ``//`` comment containing ``audit-matrix-exempt`` (case-insensitive) on an attribute line
    for that action, or on the nearest non-doc comment line immediately above the first mutating verb line.

Controllers with ``[ApiExplorerSettings(IgnoreApi = true)]`` at class level are skipped (no OpenAPI contract
surface). Individual actions may also skip when that attribute appears on the action's attribute stack.

Also honors ``scripts/ci/openapi_audit_matrix_allowlist.txt`` (``METHOD /path`` lines) for grandfathered routes.

Exit codes:
  0 — all resolved routes documented, allowlisted, or exempt
  1 — undocumented route(s)
  2 — I/O error
"""

from __future__ import annotations

import argparse
import os
import re
import sys
from collections.abc import Iterator
from pathlib import Path

_SCRIPT_DIR = Path(__file__).resolve().parent
if str(_SCRIPT_DIR) not in sys.path:
    sys.path.insert(0, str(_SCRIPT_DIR))

from assert_openapi_mutations_in_audit_matrix import (  # noqa: E402
    is_documented,
    load_allowlist,
    parse_matrix,
)


_MUTATING_VERB_LINE = re.compile(
    r"^\s*\[\s*Http(?P<verb>Post|Put|Delete)\s*(?:\(\s*(?P<arg>[^)]*?)\s*\))?\s*\]\s*(?://.*)?$"
    ,
    re.IGNORECASE,
)

_ROUTE_ATTR = re.compile(r'^\s*\[\s*Route\(\s*"([^"]*)"\s*\)\s*\]\s*(?://.*)?$')

_CLASS_DECL = re.compile(
    r"^\s*(?:public\s+|internal\s+|sealed\s+|partial\s+)*class\s+(?P<name>\w+)\s*(?:\(|:|\{|where)",
)

# ApiExplorerSettings(IgnoreApi = true) — excludes from OpenAPI; matrix/OpenAPI guards track contract surface.
_IGNORE_API_TRUE = re.compile(r"\[\s*ApiExplorerSettings\s*\([^)]*IgnoreApi\s*=\s*true", re.IGNORECASE)

_METHOD_START = re.compile(
    r"^\s*public\s+(?:async\s+)?(?:Task\s*<[^>]+>|IActionResult|ActionResult[^<{]*)\s+(?P<m>\w+)\s*\(",
)

_AUDIT_EXEMPT_ATTR = re.compile(r"\[\s*[\w.:]*AuditExempt\b")
_AUDIT_MATRIX_EXEMPT_COMMENT = re.compile(r"audit-matrix-exempt", re.IGNORECASE)


def _strip_block_comments(text: str) -> str:
    return re.sub(r"/\*.*?\*/", "", text, flags=re.DOTALL)


def _strip_line_comments(text: str) -> str:
    out_lines: list[str] = []
    for line in text.splitlines():
        if "//" in line:
            in_string = False
            quote = ""
            i = 0
            cut = len(line)
            while i < len(line) - 1:
                ch = line[i]
                if not in_string and ch == "/" and line[i + 1] == "/":
                    cut = i
                    break
                if ch in ('"', "'"):
                    if not in_string:
                        in_string = True
                        quote = ch
                    elif ch == quote and line[i - 1] != "\\":
                        in_string = False
                i += 1
            line = line[:cut].rstrip()
        out_lines.append(line)
    return "\n".join(out_lines)


def _controller_short_name(class_name: str) -> str:
    if class_name.endswith("Controller") and len(class_name) > len("Controller"):
        return class_name[: -len("Controller")]
    return class_name


def _expand_route_token_template(template: str, *, controller_short: str, api_version_token: str) -> str:
    t = template.strip().replace("[controller]", controller_short)
    t = t.replace("v{version:apiVersion}", f"v{api_version_token}")
    # Remaining route constraints, e.g. {runId:guid} → {runId} to match OpenAPI path keys.
    t = re.sub(r"\{([^:}]+)(:[^}]+)?\}", r"{\1}", t)
    return t


def _finalize_api_path(path: str, *, controller_short: str, api_version_token: str) -> str:
    s = path.strip()
    if not s or s == "/":
        return "/"
    inner = s.lstrip("/")

    return _join_url_parts(_expand_route_token_template(inner, controller_short=controller_short, api_version_token=api_version_token))


def _join_url_parts(*parts: str) -> str:
    segs: list[str] = []
    for p in parts:
        s = p.strip().strip("/")
        if s:
            segs.append(s)
    return "/" + "/".join(segs) if segs else "/"


def _parse_http_attr_arg(arg: str | None) -> str:
    """Return route template inside HttpPost('...') or empty for [HttpPost] / [HttpPost()]."""

    if arg is None:
        return ""

    arg = arg.strip()
    if not arg:
        return ""

    m = re.match(r'^"([^"]*)"\s*(?:,\s*\w+\s*=)?', arg)
    if m:
        return m.group(1)

    return ""


def _class_ignore_api(lines: list[str], class_line_idx: int) -> bool:
    i = class_line_idx - 1
    while i >= 0:
        raw = lines[i]
        s = raw.strip()
        if s.startswith("///"):
            i -= 1
            continue

        if _IGNORE_API_TRUE.search(raw):
            return True

        if s.startswith("["):
            i -= 1
            continue

        if not s:
            i -= 1
            continue

        break

    return False


def _collect_class_routes(lines: list[str], class_line_idx: int) -> list[str]:
    routes: list[str] = []
    i = class_line_idx - 1
    while i >= 0:
        raw = lines[i]
        s = raw.strip()
        if s.startswith("///"):
            i -= 1
            continue

        m_route = _ROUTE_ATTR.match(raw)
        if m_route:
            routes.append(m_route.group(1))
            i -= 1
            continue

        if s.startswith("["):
            i -= 1
            continue

        if not s:
            i -= 1
            continue

        break

    routes.reverse()
    return routes


def _method_is_exempt(attr_lines: list[str], mutating_first_line_idx: int, lines: list[str]) -> bool:
    block = "\n".join(attr_lines)
    if _AUDIT_EXEMPT_ATTR.search(block):
        return True

    for al in attr_lines:
        if "//" in al and _AUDIT_MATRIX_EXEMPT_COMMENT.search(al):
            return True

    j = mutating_first_line_idx - 1
    while j >= 0:
        s = lines[j].strip()
        if s.startswith("///"):
            j -= 1
            continue
        if s.startswith("//") and _AUDIT_MATRIX_EXEMPT_COMMENT.search(s):
            return True

        if not s:
            j -= 1
            continue

        break

    return False


def _resolve_paths_for_action(
    *,
    controller_routes: list[str],
    controller_short: str,
    api_version_token: str,
    verb_templates: list[str],
    method_route_templates: list[str],
) -> Iterator[str]:
    expanded_bases = [
        _expand_route_token_template(r, controller_short=controller_short, api_version_token=api_version_token) for r in controller_routes
    ]

    if not expanded_bases:
        expanded_bases = [""]

    m_routes = method_route_templates if method_route_templates else [""]

    if not verb_templates:
        return

    for tmpl_raw in verb_templates:
        tmpl = tmpl_raw.strip() if tmpl_raw else ""

        if tmpl.startswith("/"):
            expanded_abs = _expand_route_token_template(tmpl, controller_short=controller_short, api_version_token=api_version_token)
            yield _join_url_parts(expanded_abs.lstrip("/"))
            continue

        for base in expanded_bases:
            for mseg in m_routes:
                mseg_e = mseg.strip() if mseg else ""
                if tmpl and mseg_e:
                    mid = _join_url_parts(mseg_e, tmpl).lstrip("/")
                elif tmpl:
                    mid = tmpl.lstrip("/")
                elif mseg_e:
                    mid = mseg_e.lstrip("/")
                else:
                    mid = ""

                if base and mid:
                    yield _finalize_api_path(_join_url_parts(base, mid), controller_short=controller_short, api_version_token=api_version_token)
                elif base:
                    yield _finalize_api_path(_join_url_parts(base), controller_short=controller_short, api_version_token=api_version_token)
                elif mid:
                    yield _finalize_api_path(_join_url_parts(mid), controller_short=controller_short, api_version_token=api_version_token)
                else:
                    yield _finalize_api_path("/", controller_short=controller_short, api_version_token=api_version_token)


def _iter_mutating_actions(
    path: Path,
    *,
    api_version_token: str,
) -> list[tuple[str, str, int, str]]:
    """Return list of (METHOD, absolute_path, line_number, fq_method)."""

    raw = path.read_text(encoding="utf-8")
    text = _strip_line_comments(_strip_block_comments(raw))
    lines = text.splitlines()

    ns_match = re.search(r"^\s*namespace\s+([\w.]+)\s*;", text, re.MULTILINE)
    if ns_match is None:
        return []

    namespace = ns_match.group(1)
    class_line_idx = None
    class_name = None
    for idx, line in enumerate(lines):
        m = _CLASS_DECL.match(line)
        if m:
            class_line_idx = idx
            class_name = m.group("name")
            break

    if class_line_idx is None or class_name is None:
        return []

    if _class_ignore_api(lines, class_line_idx):
        return []

    controller_short = _controller_short_name(class_name)
    class_routes = _collect_class_routes(lines, class_line_idx)
    fq_prefix = f"{namespace}.{class_name}"

    results: list[tuple[str, str, int, str]] = []
    i = class_line_idx + 1
    while i < len(lines):
        mverb = _MUTATING_VERB_LINE.match(lines[i])
        if not mverb:
            i += 1
            continue

        first_mut_line = i
        verb = mverb.group("verb").upper()
        templates: list[str] = [_parse_http_attr_arg(mverb.group("arg"))]

        j = i + 1
        while j < len(lines):
            m2 = _MUTATING_VERB_LINE.match(lines[j])
            if m2 and m2.group("verb").upper() == verb:
                templates.append(_parse_http_attr_arg(m2.group("arg")))
                j += 1
                continue
            break

        attr_lines = lines[first_mut_line:j]
        method_route_templates: list[str] = []
        k = j
        while k < len(lines):
            s = lines[k].strip()
            if not s:
                k += 1
                continue

            rm = _ROUTE_ATTR.match(lines[k])
            if rm:
                method_route_templates.append(rm.group(1))
                attr_lines.append(lines[k])
                k += 1
                continue

            if s.startswith("["):
                attr_lines.append(lines[k])
                k += 1
                continue

            mm = _METHOD_START.match(lines[k])
            if mm:
                method_name = mm.group("m")
                if _method_is_exempt(attr_lines, first_mut_line, lines):
                    i = k + 1
                    break

                if _IGNORE_API_TRUE.search("\n".join(attr_lines)):
                    i = k + 1
                    break

                if not class_routes and not any((t.strip().startswith("/") for t in templates if t.strip())):
                    i = k + 1
                    break

                for path_out in _resolve_paths_for_action(
                    controller_routes=class_routes,
                    controller_short=controller_short,
                    api_version_token=api_version_token,
                    verb_templates=templates,
                    method_route_templates=method_route_templates,
                ):
                    results.append((verb, path_out, first_mut_line + 1, f"{fq_prefix}.{method_name}"))

                i = k + 1
                break

            i = first_mut_line + 1
            break
        else:
            i = first_mut_line + 1

    return results


def _emit_github_errors(messages: list[str]) -> None:
    if os.environ.get("GITHUB_ACTIONS", "").lower() == "true":
        for msg in messages:
            safe = msg.replace("\n", "%0A")
            print(f"::error title=controller-audit-matrix::{safe}", file=sys.stderr)
        return

    for msg in messages:
        print(msg, file=sys.stderr)


def repo_root() -> Path:
    return Path(__file__).resolve().parents[2]


def evaluate_mutating_route_audit_matrix(
    root: Path,
    *,
    matrix_path: Path | None = None,
    api_version: str = "1",
) -> tuple[int, list[str], Path, Path]:
    """Return (discovered_count, undocumented_lines, matrix_path, allowlist_path)."""
    root = root.resolve()
    resolved_matrix = (
        matrix_path if matrix_path is not None else root / "docs" / "library" / "AUDIT_COVERAGE_MATRIX.md"
    ).resolve()
    allow_path = root / "scripts" / "ci" / "openapi_audit_matrix_allowlist.txt"
    controllers_dir = root / "ArchLucid.Api" / "Controllers"

    if not resolved_matrix.is_file():
        raise FileNotFoundError(f"missing {resolved_matrix}")

    if not controllers_dir.is_dir():
        raise FileNotFoundError(f"missing {controllers_dir}")

    matrix_text = resolved_matrix.read_text(encoding="utf-8", errors="strict")
    exact, suffix = parse_matrix(matrix_text)
    allow = load_allowlist(allow_path)
    api_token = api_version.strip()

    discovered: list[tuple[str, str, Path, int, str]] = []
    for cs in sorted(controllers_dir.rglob("*.cs")):
        for verb, pth, line_no, fq in _iter_mutating_actions(cs, api_version_token=api_token):
            discovered.append((verb, pth, cs, line_no, fq))

    undocumented: list[str] = []
    for verb, pth, cs, line_no, fq in discovered:
        if (verb, pth) in allow:
            continue

        if is_documented(verb, pth, exact, suffix):
            continue

        rel = cs.relative_to(root)
        undocumented.append(f"{verb} {pth}  ({rel}:{line_no} {fq})")

    return len(discovered), undocumented, resolved_matrix, allow_path


def render_audit_matrix_proof_markdown(
    *,
    discovered_count: int,
    undocumented: list[str],
    matrix_path: Path,
    allowlist_path: Path,
    repo_root_path: Path,
) -> str:
    disposition = "PASS" if not undocumented else "BLOCK"
    lines = [
        "# Mutating route audit coverage (proof)",
        "",
        "> Controller POST/PUT/DELETE routes must appear in the audit coverage matrix, allowlist, or explicit exemption.",
        "",
        "| Field | Value |",
        "| --- | --- |",
        f"| Disposition | **{disposition}** |",
        f"| Discovered mutating routes | {discovered_count} |",
        f"| Undocumented routes | {len(undocumented)} |",
        f"| Matrix | `{matrix_path.relative_to(repo_root_path).as_posix()}` |",
        f"| Allowlist | `{allowlist_path.relative_to(repo_root_path).as_posix()}` |",
        "",
    ]

    if undocumented:
        lines.extend(
            [
                "## Remediation",
                "",
                "Add each route to the matrix (with audit event mapping) or to the allowlist with rationale:",
                "",
            ]
        )
        lines.extend(f"- `{line}`" for line in sorted(undocumented))
        lines.append("")
    else:
        lines.append("All discovered mutating controller routes are documented or explicitly allowlisted.")
        lines.append("")

    lines.extend(
        [
            "## References",
            "",
            "- [`docs/library/AUDIT_COVERAGE_MATRIX.md`](../../docs/library/AUDIT_COVERAGE_MATRIX.md)",
            "- CI guard: `scripts/ci/check_audit_matrix.py`",
            "",
        ]
    )
    return "\n".join(lines)


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--repo-root", type=Path, default=repo_root())
    parser.add_argument(
        "--matrix",
        type=Path,
        default=None,
        help="AUDIT_COVERAGE_MATRIX.md path (default: docs/library/AUDIT_COVERAGE_MATRIX.md).",
    )
    parser.add_argument(
        "--api-version",
        default="1",
        help="Value substituted for {version:apiVersion} token (default: 1 → v1 segment).",
    )
    parser.add_argument(
        "--print-violations",
        action="store_true",
        help="Print undocumented METHOD + path lines (exit 0). For bootstrapping.",
    )
    parser.add_argument("--markdown-out", type=Path, default=None, help="Optional proof Markdown output path.")
    parser.add_argument("--json-summary-out", type=Path, default=None, help="Optional proof JSON summary path.")
    args = parser.parse_args(argv)
    root = args.repo_root.resolve()

    try:
        discovered_count, undocumented, matrix_path, allow_path = evaluate_mutating_route_audit_matrix(
            root,
            matrix_path=args.matrix,
            api_version=args.api_version,
        )
    except FileNotFoundError as exc:
        print(f"check_audit_matrix: {exc}", file=sys.stderr)
        return 2

    if args.markdown_out is not None or args.json_summary_out is not None:
        import json
        from datetime import datetime, timezone

        markdown = render_audit_matrix_proof_markdown(
            discovered_count=discovered_count,
            undocumented=undocumented,
            matrix_path=matrix_path,
            allowlist_path=allow_path,
            repo_root_path=root,
        )

        if args.markdown_out is not None:
            markdown_path = args.markdown_out.expanduser().resolve()
            markdown_path.parent.mkdir(parents=True, exist_ok=True)
            markdown_path.write_text(markdown, encoding="utf-8")

        if args.json_summary_out is not None:
            summary = {
                "generatedUtc": datetime.now(timezone.utc).isoformat(),
                "disposition": "PASS" if not undocumented else "BLOCK",
                "discoveredMutatingRouteCount": discovered_count,
                "undocumentedRouteCount": len(undocumented),
                "undocumentedRoutes": sorted(undocumented),
                "matrixPath": matrix_path.relative_to(root).as_posix(),
                "allowlistPath": allow_path.relative_to(root).as_posix(),
            }
            json_path = args.json_summary_out.expanduser().resolve()
            json_path.parent.mkdir(parents=True, exist_ok=True)
            json_path.write_text(json.dumps(summary, indent=2) + "\n", encoding="utf-8")

    if args.print_violations:
        for line in sorted(undocumented):
            print(line)
        return 0

    if undocumented:
        msg = (
            "Controller mutating routes missing from audit coverage matrix "
            f"(add a route mention to {matrix_path.relative_to(root)} or allowlist in "
            f"{allow_path.relative_to(root)}):\n  " + "\n  ".join(sorted(undocumented))
        )
        _emit_github_errors([msg])
        print(f"check_audit_matrix: FAILED -\n{msg}", file=sys.stderr)
        return 1

    print(
        f"check_audit_matrix: OK ({discovered_count} controller POST/PUT/DELETE route binding(s); "
        f"{matrix_path.relative_to(root)})."
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
