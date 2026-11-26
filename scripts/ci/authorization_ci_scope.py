#!/usr/bin/env python3
"""Conservative authorization CI path decision; unknown changes run tests."""
import os
import subprocess
from pathlib import Path, PurePosixPath

def requires_tests(event, paths):
    if event != "pull_request" or not paths:
        return True
    # Only ordinary prose under docs/ is eligible. Security, architecture,
    # test fixtures, schemas and configuration remain fail-safe.
    return not all(
        path.startswith("docs/")
        and PurePosixPath(path).suffix.lower() == ".md"
        and not path.startswith(("docs/security/", "docs/architecture/"))
        for path in paths
    )

def changed_paths(base):
    if not base:
        return []
    try:
        result = subprocess.run(
            ["git", "diff", "--name-only", "--no-renames", "-z", base, "HEAD"],
            check=True, capture_output=True,
        )
        return [p.decode("utf-8") for p in result.stdout.split(b"\0") if p]
    except (OSError, subprocess.CalledProcessError, UnicodeError):
        return []

def main():
    event = os.environ.get("EVENT_NAME", "")
    paths = changed_paths(os.environ.get("BASE_SHA", "")) if event == "pull_request" else []
    run = requires_tests(event, paths)
    print(f"Authorization CI: {'execute' if run else 'prose-only change; skip compilation'}")
    with Path(os.environ["GITHUB_OUTPUT"]).open("a", encoding="utf-8") as output:
        output.write(f"run_tests={str(run).lower()}\n")

if __name__ == "__main__":
    main()
