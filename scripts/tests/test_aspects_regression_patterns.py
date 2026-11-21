"""Fast, dependency-free integrity tests for the Aspects regression library."""
import copy
import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "scripts" / "ci"))
import aspects_regression_patterns as library


class RegressionCatalogTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.cases = library.load_catalog()

    def test_registered_real_regressions_and_five_patterns(self):
        library.validate_catalog(self.cases)
        self.assertEqual(set(library.PATTERNS), {case["pattern"] for case in self.cases})
        self.assertEqual({"ArchLucid", "SecureNow"}, {case["product"] for case in self.cases})

    def test_no_sql_server_requirement_by_default(self):
        commands = library.build_commands(self.cases)
        self.assertEqual(2, sum(command[0] == "npm" for command in commands))
        self.assertTrue(any(command[0] == "dotnet" for command in commands))
        self.assertTrue(all("ArchLucid.Persistence.Tests/ArchLucid.Persistence.Tests.csproj"
                            not in command for command in commands))

    def test_sql_integration_is_explicit_opt_in(self):
        commands = library.build_commands(self.cases, include_sql=True)
        self.assertTrue(any("ArchLucid.Persistence.Tests/ArchLucid.Persistence.Tests.csproj"
                            in command for command in commands))

    def test_dangling_test_reference_is_rejected(self):
        changed = copy.deepcopy(self.cases)
        changed[0]["test"] = "TestMethodThatDoesNotExist"
        with self.assertRaisesRegex(ValueError, "no longer exists"):
            library.validate_catalog(changed)

    def test_unsafe_path_and_test_selector_are_rejected(self):
        changed = copy.deepcopy(self.cases)
        changed[0]["source"] = "../../outside.cs"
        changed[1]["test"] = "Unsafe|FullyQualifiedName~Everything"
        with self.assertRaisesRegex(ValueError, "unsafe source"):
            library.validate_catalog(changed)
        with self.assertRaisesRegex(ValueError, "invalid test name"):
            library.validate_catalog(changed)

    def test_duplicate_id_is_rejected(self):
        changed = copy.deepcopy(self.cases)
        changed[1]["id"] = changed[0]["id"]
        with self.assertRaisesRegex(ValueError, "duplicate id"):
            library.validate_catalog(changed)

    def test_commands_are_argv_arrays_not_shell_strings(self):
        commands = library.build_commands(self.cases)
        self.assertTrue(all(isinstance(command, list) for command in commands))
        self.assertTrue(all(isinstance(arg, str) for command in commands for arg in command))
        self.assertTrue(all(command[0] in ("npm", "dotnet") for command in commands))


if __name__ == "__main__":
    unittest.main()
