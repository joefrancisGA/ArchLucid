#!/usr/bin/env python3
"""RC49-only enum boundary verification; never builds master or approves findings automatically."""
import argparse
import hashlib
import json
import os
from pathlib import Path
import subprocess
import sys
from urllib.parse import unquote, urlparse

ROOT = Path(__file__).resolve().parents[2]
IDS = {"ENUM001", "ENUM002"}

def git(*args):
    return subprocess.check_output(["git", *args], cwd=ROOT, text=True).strip()

def run(*args):
    subprocess.run(args, cwd=ROOT, check=True)

def assert_rc49():
    head = git("rev-parse", "--abbrev-ref", "HEAD")
    if head == "RC49":
        return
    if (head == "HEAD" and os.environ.get("GITHUB_REF") == "refs/heads/RC49"
            and os.environ.get("GITHUB_SHA") == git("rev-parse", "HEAD")):
        return
    raise SystemExit("Full enum inventory is restricted to RC49.")

def findings_from_reports(directory):
    findings = {}
    reports = sorted(directory.glob("*.sarif"))
    if not reports:
        raise SystemExit("No compiler SARIF reports; audit cannot pass.")
    for report in reports:
        for run_data in json.loads(report.read_text(encoding="utf-8-sig")).get("runs", []):
            for item in run_data.get("results", []):
                rule = item.get("ruleId")
                if rule not in IDS:
                    continue
                for location in item.get("locations", []):
                    loc = location["physicalLocation"]
                    uri = loc["artifactLocation"]["uri"]
                    parsed = urlparse(uri)
                    if parsed.scheme not in ("", "file"):
                        raise ValueError(f"Unexpected source URI: {uri}")
                    path = Path(unquote(parsed.path))
                    if os.name == "nt" and parsed.scheme == "file":
                        path = Path(unquote(parsed.path).lstrip("/"))
                    if not path.is_absolute():
                        path = ROOT / path
                    path = path.resolve()
                    relative = path.relative_to(ROOT).as_posix()
                    region = loc["region"]
                    start = region["startLine"]
                    end = region.get("endLine", start)
                    source = path.read_text(encoding="utf-8-sig").splitlines()
                    if not 1 <= start <= end <= len(source):
                        raise ValueError(f"Invalid source region {relative}:{start}-{end}")
                    snippet = "\n".join(source[start-1:end])
                    digest = hashlib.sha256(snippet.encode()).hexdigest()
                    key = (rule, relative, start, region.get("startColumn", 1), digest)
                    findings[key] = {
                        "rule": rule, "path": relative, "line": start,
                        "column": region.get("startColumn", 1), "sha256": digest,
                        "source": snippet, "message": item.get("message", {}).get("text", "")
                    }
    return list(findings.values()), len(reports)

def key(row):
    return tuple(row[name] for name in ("rule", "path", "line", "column", "sha256"))

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--verify", action="store_true", help="Reject any finding without a specific reviewed exception.")
    parser.add_argument("--exceptions", type=Path, help="JSON array of reviewed entries with rationale; never generated automatically.")
    parser.add_argument("--output", type=Path, default=ROOT / "artifacts" / "enum-audit")
    args = parser.parse_args()
    assert_rc49()
    directory = args.output.resolve()
    directory.mkdir(parents=True, exist_ok=True)
    if any(directory.glob("*.sarif")):
        raise SystemExit("Choose a clean output directory; stale compiler reports are not accepted.")
    run("dotnet", "build", "ArchLucid.Analyzers/ArchLucid.Analyzers.csproj", "-c", "Release")
    analyzer = ROOT / "ArchLucid.Analyzers/bin/Release/netstandard2.0/ArchLucid.Analyzers.dll"
    if not analyzer.is_file():
        raise SystemExit("Analyzer build did not produce expected assembly.")
    # Capture inventory even if the mandatory analyzer reports errors; build failure is still fatal.
    result = subprocess.run([
        "dotnet", "build", "ArchLucid.sln", "-c", "Release", "--no-incremental",
        "-p:RunAnalyzersDuringBuild=true", "-p:EnumAuditInventory=true",
        f"-p:EnumAuditLogDirectory={directory}", f"-p:EnumAuditAnalyzerPath={analyzer}"
    ], cwd=ROOT)
    findings, count = findings_from_reports(directory)
    (directory / "inventory.json").write_text(json.dumps({
        "commit": git("rev-parse", "HEAD"), "reports": count,
        "build_exit_code": result.returncode, "findings": findings
    }, indent=2) + "\n", encoding="utf-8")
    print(f"{count} SARIF reports, {len(findings)} enum diagnostics; inventory written to {directory}")
    if result.returncode:
        return result.returncode
    if args.verify:
        if args.exceptions is None:
            raise SystemExit("--verify requires an explicitly reviewed --exceptions file (use [] for none).")
        rows = json.loads(args.exceptions.read_text(encoding="utf-8"))
        if not isinstance(rows, list) or any(not isinstance(row.get("rationale"), str) or not row["rationale"].strip() for row in rows):
            raise SystemExit("Every exception requires a nonempty rationale.")
        if any(row.get("rule") != "ENUM001" for row in rows):
            raise SystemExit("Blocking ENUM002 diagnostics cannot be allowlisted.")
        approved = {key(row) for row in rows}
        current = {key(row) for row in findings}
        if current != approved:
            print(f"Unreviewed diagnostics: {len(current - approved)}; stale exceptions: {len(approved - current)}")
            return 1
    return 0

if __name__ == "__main__":
    sys.exit(main())
