#!/usr/bin/env python3
"""Explicit master/RC49 enum boundary verification; never approves findings automatically."""
import argparse
import hashlib
import json
import os
from pathlib import Path
import subprocess
import sys
from urllib.parse import unquote, urlparse
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[2]
IDS = {"ENUM001", "ENUM002"}

def git(*args):
    return subprocess.check_output(["git", *args], cwd=ROOT, text=True).strip()

def run(*args):
    subprocess.run(args, cwd=ROOT, check=True)

def assert_audit_ref():
    head = git("rev-parse", "--abbrev-ref", "HEAD")
    if head in {"master", "RC49"}:
        return
    if (head == "HEAD" and os.environ.get("GITHUB_REF") in {"refs/heads/master", "refs/heads/RC49"}
            and os.environ.get("GITHUB_SHA") == git("rev-parse", "HEAD")):
        return
    raise SystemExit("Explicit full enum inventory is restricted to master or RC49.")

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

FOCUSED = {
    "ArchLucid.Contracts.Tests": [
        "DefinedEnumTests", "RunFindingCoverageSummaryDeserializationTests",
        "ArchitectureFindingJsonConverterTests", "AuthorityEnumPresenceTests",
        "FeasibilityVerdictDeserializationTests", "ArchitectureIntelligenceMissingEvidenceTests",
        "AgentResultClaimListJsonConverterEvidenceRefsTests",
    ],
    "ArchLucid.Persistence.Tests": [
        "FindingsSnapshotJsonFallbackMapperTests", "FindingsCoverageProjectionMapperTests",
        "ArtifactBundleStatusParserTests", "SynthesizedArtifactSliceStatusParserTests",
        "AgentModelCatalogRepositoryCoreTests", "BillingWebhookTrialActivatorTests",
    ],
    "ArchLucid.Application.Tests": [
        "DraftRequestListStatusFilterTests", "AgentOutputQualityGateOptionsResolverTests",
        "ArchitectureIntelligenceLlmResponseMapperMissingValueTests",
        "TenantAzureOpenAiConnectionUpsertValidationTests",
        "ItsmInboundExternalStatusMapperTests", "ItsmInboundHumanReviewMapHelperTests",
        "ProvenancePresentationMapperTests",
    ],
    "ArchLucid.AgentRuntime.Tests": [
        "AgentModelTierResolverTests", "QuickScanServiceCoverageTests",
        "AgentResultParserTests", "AgentHandlerFailureBudgetObserverTests",
    ],
    "ArchLucid.Api.Tests": ["AdminAgentModelCatalogControllerRecordEvaluationTests"],
    "ArchLucid.Cli.Tests": ["ArchitectureRequestFileParserTests"],
    "ArchLucid.Architecture.Tests": ["ArchLucidApiJsonSourceGenerationTests"],
    "ArchLucid.KnowledgeGraph.Tests": ["RequestActorMaterializerTests"],
    "ArchLucid.Analyzers.Tests": ["EnumBoundaryReviewAnalyzerTests"],
}

def check_report_coverage(directory):
    projects = subprocess.check_output(
        ["dotnet", "sln", "ArchLucid.sln", "list"], cwd=ROOT, text=True
    )
    expected = {
        Path(line.strip().replace(chr(92), "/")).stem
        for line in projects.splitlines() if line.strip().endswith(".csproj")
    }
    if not expected:
        raise SystemExit("No C# projects resolved from the solution.")
    missing = sorted(name for name in expected if not any(directory.glob(name + "-*.sarif")))
    if missing:
        raise SystemExit("Missing compiler reports for: " + ", ".join(missing))
    product = {name for name in expected if name.startswith("ArchLucid.")
               and not name.endswith(".Tests") and name != "ArchLucid.Analyzers"}
    if not product:
        raise SystemExit("No product C# projects resolved from the solution.")
    for name in sorted(product):
        for report in directory.glob(name + "-*.sarif"):
            data = json.loads(report.read_text(encoding="utf-8-sig"))
            messages = [item.get("message", {}).get("text", "")
                        for run_data in data.get("runs", [])
                        for item in run_data.get("results", [])
                        if item.get("ruleId") == "ENUM000"]
            if not any(f"'{name}'" in message for message in messages):
                raise SystemExit(f"Missing enum analyzer execution marker: {report.name}")
    return len(expected)

def run_focused_tests(directory):
    results = {}
    for project, classes in FOCUSED.items():
        target = directory / "tests" / project
        target.mkdir(parents=True, exist_ok=False)
        filter_text = "|".join("FullyQualifiedName~" + name for name in classes)
        run("dotnet", "test", f"{project}/{project}.csproj", "-c", "Release", "--no-build",
            "--filter", filter_text, "--logger", "trx", "--results-directory", str(target))
        tests = []
        for trx in target.glob("*.trx"):
            tests.extend(ET.parse(trx).getroot().findall(".//{*}UnitTestResult"))
        passed = [test for test in tests if test.get("outcome") == "Passed"]
        for name in classes:
            if not any(name in test.get("testName", "") for test in passed):
                raise SystemExit(f"No passing focused test recorded for {project}/{name}")
        if any(test.get("outcome") == "Failed" for test in tests):
            raise SystemExit(f"Failed focused tests in {project}")
        results[project] = {"passed": len(passed), "reported": len(tests)}
    (directory / "focused-tests.json").write_text(json.dumps(results, indent=2) + "\n", encoding="utf-8")

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--verify", action="store_true", help="Reject any finding without a specific reviewed exception.")
    parser.add_argument("--exceptions", type=Path, help="JSON array of reviewed entries with rationale; never generated automatically.")
    parser.add_argument("--output", type=Path, default=ROOT / "artifacts" / "enum-audit")
    args = parser.parse_args()
    assert_audit_ref()
    directory = args.output.resolve()
    directory.mkdir(parents=True, exist_ok=True)
    if any(directory.glob("*.sarif")):
        raise SystemExit("Choose a clean output directory; stale compiler reports are not accepted.")
    # A single solution build resolves the shared analyzer project reference.
    result = subprocess.run([
        "dotnet", "build", "ArchLucid.sln", "-c", "Release", "--no-incremental",
        "-p:RunAnalyzers=true", "-p:RunAnalyzersDuringBuild=true", "-p:EnumAuditInventory=true",
        f"-p:EnumAuditLogDirectory={directory}"
    ], cwd=ROOT)
    findings, count = findings_from_reports(directory)
    (directory / "inventory.json").write_text(json.dumps({
        "commit": git("rev-parse", "HEAD"), "reports": count,
        "build_exit_code": result.returncode, "findings": findings
    }, indent=2) + "\n", encoding="utf-8")
    print(f"{count} SARIF reports, {len(findings)} enum diagnostics; inventory written to {directory}")
    if result.returncode:
        return result.returncode
    covered = check_report_coverage(directory)
    print(f"Compiler report coverage: {covered} solution C# projects")
    run_focused_tests(directory)
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
