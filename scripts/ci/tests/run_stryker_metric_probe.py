"""Execute one disposable Stryker target and compare its CLI to our evidence."""

from __future__ import annotations

import json
from pathlib import Path
import shutil
import subprocess
import sys
import xml.etree.ElementTree as ET

CI = Path(__file__).resolve().parents[1]
ROOT = CI.parents[1]
sys.path.insert(0, str(CI))
from stryker_evidence import RECEIPT, head_revision, run_and_stamp


def write(repo: Path, path: str, value: str) -> None:
    file = repo / path
    file.parent.mkdir(parents=True, exist_ok=True)
    file.write_text(value, encoding="utf-8")


def run(repo: Path, *cmd: str) -> None:
    subprocess.run(cmd, cwd=repo, check=True, timeout=120)


def main(work: Path) -> None:
    work.mkdir(parents=True, exist_ok=False)
    repo = work / "checkout"
    repo.mkdir()
    write(repo, ".gitignore", "bin/\nobj/\n")
    write(repo, "Product/Probe.csproj", """
<Project Sdk="Microsoft.NET.Sdk">
  <PropertyGroup><TargetFramework>net10.0</TargetFramework></PropertyGroup>
</Project>
""")
    write(repo, "Product/Logic.cs", """
namespace Probe;
public static class Logic
{
    public static int Classify(int n) => n > 0 ? 10 : 20;
    public static bool Uncovered(int n) => n < 2;
}
""")
    write(repo, "Tests/Probe.Tests.csproj", """
<Project Sdk="Microsoft.NET.Sdk">
  <PropertyGroup><TargetFramework>net10.0</TargetFramework><IsTestProject>true</IsTestProject></PropertyGroup>
  <ItemGroup>
    <ProjectReference Include="../Product/Probe.csproj" />
    <PackageReference Include="Microsoft.NET.Test.Sdk" Version="17.14.1" />
    <PackageReference Include="xunit" Version="2.9.3" />
    <PackageReference Include="xunit.runner.visualstudio" Version="2.8.2" />
  </ItemGroup>
</Project>
""")
    write(repo, "Tests/ProbeTests.cs", """
using Xunit;
namespace Probe;
public sealed class ProbeTests
{
    [Fact]
    public void IndependentlySpecifiedPositiveInput()
    {
        Assert.Equal(10, Logic.Classify(1));
    }
}
""")
    write(repo, "stryker-config.json", json.dumps({"stryker-config": {
        "project": "Product/Probe.csproj", "test-projects": ["Tests/Probe.Tests.csproj"],
        "mutate": ["**/Logic.cs"], "reporters": ["json"], "concurrency": 1,
        "thresholds": {"high": 90, "low": 20, "break": 0},
    }}))
    (repo / ".config").mkdir()
    shutil.copyfile(ROOT / ".config/dotnet-tools.json", repo / ".config/dotnet-tools.json")
    shutil.copyfile(ROOT / "global.json", repo / "global.json")
    run(repo, "dotnet", "new", "sln", "--format", "sln", "--name", "Probe")
    run(repo, "dotnet", "sln", "Probe.sln", "add", "Product/Probe.csproj", "Tests/Probe.Tests.csproj")
    run(repo, "git", "init", "-q")
    run(repo, "git", "add", "-A")
    run(repo, "git", "-c", "user.name=Stryker fixture", "-c", "user.email=fixture@example.invalid",
        "commit", "-qm", "Pinned metric fixture")
    # Verify actual baseline execution, not just a successful command or discovered tests.
    baseline = work / "baseline"
    run(repo, "dotnet", "test", "Tests/Probe.Tests.csproj", "--results-directory", str(baseline),
        "--logger", "trx;LogFileName=baseline.trx")
    counters = ET.parse(baseline / "baseline.trx").find(".//{*}Counters")
    if counters is None or counters.get("executed") != "1" or counters.get("passed") != "1":
        raise ValueError("fixture baseline did not execute and pass exactly one test")
    run(repo, "dotnet", "tool", "restore")
    output = work / "evidence"
    summary = run_and_stamp(repo, output, head=head_revision(repo), target="MetricProbe",
                            config="stryker-config.json", solution="Probe.sln", budget=180)
    counts = summary["status_counts"]
    if counts.get("Killed", 0) < 1 or counts.get("NoCoverage", 0) < 1:
        raise ValueError("live probe did not exercise both killed and uncovered mutants")
    receipt = json.loads((output / RECEIPT).read_text())
    print(json.dumps({
        "baseline_executed": 1, "tool_version": receipt["tool_version"],
        "official_cli_percent": receipt["tool_score_percent"],
        "official_report_percent": summary["official_score_percent"],
        "assertion_kill_percent": summary["assertion_kill_percent"], "status_counts": counts,
    }, indent=2))
    (output / "score-summary.json").write_text(json.dumps(
        {k: v for k, v in summary.items() if k != "survivor_candidates"}, indent=2,
    ) + "\n")


if __name__ == "__main__":
    main(Path(sys.argv[1]).resolve())
