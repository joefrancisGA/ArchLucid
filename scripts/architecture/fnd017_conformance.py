#!/usr/bin/env python3
"""FND-017 advisory architecture conformance scanner.

AST-based Python import/call checks and explicitly limited token contracts.
Never modifies source or blocks CI; deterministic JSON report with baselines.
"""
from __future__ import annotations
import argparse
import ast
import hashlib
import json
from pathlib import Path


def scan(root: Path, policy: dict) -> dict:
    findings = []
    reviewed_files = set()
    for rule in policy["rules"]:
        rid = rule["id"]
        for name in rule["paths"]:
            path = root / name
            if not path.is_file():
                findings.append({"rule": rid, "path": name, "line": 0,
                                 "kind": "missing_file"})
                continue
            reviewed_files.add(name)
            source = path.read_text(encoding="utf-8")
            if name.endswith(".py"):
                try:
                    tree = ast.parse(source, filename=name)
                except SyntaxError as error:
                    findings.append({"rule": rid, "path": name, "line": error.lineno or 0,
                                     "kind": "invalid_python"})
                    continue
                forbidden = tuple(rule.get("forbiddenImports", ()))
                for node in ast.walk(tree):
                    imports = []
                    if isinstance(node, ast.Import):
                        imports = [alias.name for alias in node.names]
                    elif isinstance(node, ast.ImportFrom):
                        imports = [node.module or ""]
                    for module in imports:
                        if any(module == prefix or module.startswith(prefix + ".")
                               for prefix in forbidden):
                            findings.append({"rule": rid, "path": name, "line": node.lineno,
                                             "kind": "forbidden_import", "symbol": module})
                    if isinstance(node, ast.Call) and isinstance(node.func, ast.Name):
                        if node.func.id in rule.get("forbiddenCalls", []):
                            findings.append({"rule": rid, "path": name, "line": node.lineno,
                                             "kind": "forbidden_call", "symbol": node.func.id})
            for token in rule.get("requiredTokens", []):
                if token not in source:
                    findings.append({"rule": rid, "path": name, "line": 0,
                                     "kind": "missing_required_token", "symbol": token})
            for token in rule.get("forbiddenTokens", []):
                for line, content in enumerate(source.splitlines(), 1):
                    if token in content:
                        findings.append({"rule": rid, "path": name, "line": line,
                                         "kind": "forbidden_token", "symbol": token})
    findings.sort(key=lambda f: (f["rule"], f["path"], f["line"], f["kind"], f.get("symbol", "")))
    for item in findings:
        item["fingerprint"] = hashlib.sha256(json.dumps(item, sort_keys=True,
            separators=(",", ":")).encode()).hexdigest()[:20]
    return {"schemaVersion": "1.0.0", "mode": "advisory",
            "rulesChecked": len(policy["rules"]),
            "filesReviewed": len(reviewed_files),
            "findings": findings}


def compare(current: dict, previous: dict) -> dict:
    before = {f["fingerprint"] for f in previous.get("findings", [])}
    now = {f["fingerprint"] for f in current["findings"]}
    return {"new": sorted(now - before), "resolved": sorted(before - now),
            "unchanged": len(now & before)}


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--root", default=".")
    parser.add_argument("--rules", default="config/architecture/fnd017-conformance-rules.json")
    parser.add_argument("--baseline")
    parser.add_argument("--output", default="fnd017-conformance-report.json")
    args = parser.parse_args()
    root = Path(args.root)
    policy = json.loads((root / args.rules).read_text())
    result = scan(root, policy)
    if args.baseline:
        path = root / args.baseline
        if path.exists():
            result["drift"] = compare(result, json.loads(path.read_text()))
        else:
            result["drift"] = {"status": "baseline_unavailable"}
    Path(args.output).write_text(json.dumps(result, indent=2, sort_keys=True) + "\n")
    print(f"FND-017 advisory: {result['filesReviewed']} files, "
          f"{len(result['findings'])} findings; report: {args.output}")


if __name__ == "__main__":
    main()
