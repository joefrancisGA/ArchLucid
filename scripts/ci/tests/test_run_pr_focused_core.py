import importlib.util
from pathlib import Path
import unittest

spec = importlib.util.spec_from_file_location(
    "run_pr_focused_core", Path(__file__).resolve().parents[1] / "run_pr_focused_core.py"
)
core = importlib.util.module_from_spec(spec)
spec.loader.exec_module(core)

PROJECTS = [
    "ArchLucid.Api.Tests/ArchLucid.Api.Tests.csproj",
    "ArchLucid.Application.Tests/ArchLucid.Application.Tests.csproj",
    "ArchLucid.Persistence.Tests/ArchLucid.Persistence.Tests.csproj",
]

class FocusedCoreTests(unittest.TestCase):
    def test_direct_source_and_test_project(self):
        self.assertEqual(core.select_projects(["ArchLucid.Api/Controller.cs",
            "ArchLucid.Application.Tests/Fixture.cs"], PROJECTS), PROJECTS[:2])

    def test_shared_or_unclassified_changes_keep_full_suite(self):
        for paths in ([], ["ArchLucid.Core/Scope.cs"], ["ArchLucid.Unknown/Source.cs"],
                      [".github/workflows/ci.yml"], ["Directory.Packages.props"]):
            self.assertEqual(core.select_projects(paths, PROJECTS), PROJECTS)

    def test_only_prose_has_no_direct_project(self):
        self.assertEqual(core.select_projects(["docs/guide.md"], PROJECTS), [])

if __name__ == "__main__":
    unittest.main()
