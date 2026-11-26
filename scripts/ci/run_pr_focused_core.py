#!/usr/bin/env python3
"""Run directly affected core test projects after the existing Release compilation.
Full dependency-wide regression remains mandatory on the merge queue and manual runs.
"""
import argparse
import json
import subprocess
import os
from pathlib import Path

def select_projects(paths, projects):
    # Unknown diff, build tooling, or shared platform changes require all core projects.
    if not paths or any(p.startswith((".github/", "scripts/ci/")) or p in
        ("global.json", "Directory.Build.props", "Directory.Build.targets",
         "Directory.Packages.props", "ArchLucid.sln") for p in paths):
        return projects
    roots = {p.split("/", 1)[0] for p in paths}
    if roots.intersection({"ArchLucid.Core", "ArchLucid.Contracts", "ArchLucid.Analyzers"}):
        return projects
    selected = [p for p in projects if p.split("/", 1)[0] in roots
                or p.split("/", 1)[0].removesuffix(".Tests") in roots]
    # Unknown source projects cannot safely be classified as irrelevant.
    known = {p.split("/", 1)[0] for p in projects}
    known |= {p.removesuffix(".Tests") for p in known}
    if any(root.startswith("ArchLucid.") and root not in known for root in roots):
        return projects
    return selected

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--base", required=True)
    args = parser.parse_args()
    data = json.loads(Path("scripts/ci/fast_core_corset_shards.json").read_text())
    projects = [p for shard in data["shards"] for p in shard["projects"]]
    diff = subprocess.run(["git", "diff", "--name-only", "--no-renames", "-z", args.base, "HEAD"],
                          capture_output=True, check=False)
    paths = [p.decode("utf-8") for p in diff.stdout.split(b"\0") if p] if diff.returncode == 0 else []
    selected = select_projects(paths, projects)
    # Keep broad regression parallel rather than serializing it on the build runner.
    mode = "focused" if len(selected) <= 2 else "full"
    with open(os.environ["GITHUB_OUTPUT"], "a", encoding="utf-8") as output:
        output.write(f"mode={mode}\n")
    print(f"PR core validation: {mode}; {len(selected)} of {len(projects)} projects", flush=True)
    if mode == "full":
        return
    for project in selected:
        print(f"Testing {project}", flush=True)
        cmd = ["timeout", "--kill-after=30s", "14m", "dotnet", "test", project,
               "--no-build", "--no-restore", "-c", "Release", "--filter",
               os.environ["DOTNET_FAST_CORE_TEST_FILTER"], "--blame-hang",
               "--blame-hang-timeout", "5m", "--blame-hang-dump-type", "none"]
        if project.startswith("ArchLucid.Api.Tests/"):
            cmd.extend(["--settings", "test.runsettings"])
        subprocess.run(cmd, check=True)
    if not selected:
        print("No directly affected core test project; compilation and separate security checks remain required.")

if __name__ == "__main__":
    main()
