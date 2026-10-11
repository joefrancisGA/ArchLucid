"""Appendix C: probable_flow_problems against Appendix A's Function App code (its author-note cases)."""

from __future__ import annotations

import tempfile
import unittest
from pathlib import Path

import support
from appc_prompt_patterns import probable_flow_problems

STORES = {"custdata", "custarchive"}
SETTINGS = {"ARCHIVE_ACCOUNT": "custarchive"}


def flow(store: str = "custarchive", file: str | None = "function_app.py", line: int | None = 13) -> dict:
    return {"workload": "pay-reconcile", "store": store, "operation": "read", "file": file, "line": line}


class ProbableFlows(unittest.TestCase):
    def setUp(self) -> None:
        self.folder = tempfile.TemporaryDirectory()
        self.repo = Path(self.folder.name) / "repo"
        self.repo.mkdir()
        (self.repo / "function_app.py").write_text(
            support.region_text("appa_function_app.py", "function_app"), encoding="utf-8"
        )
        (Path(self.folder.name) / "outside.py").write_text("custarchive\n", encoding="utf-8")

    def tearDown(self) -> None:
        self.folder.cleanup()

    def check(self, *flows: dict) -> list[str]:
        return probable_flow_problems(list(flows), self.repo, STORES, SETTINGS)

    def test_line_13_is_the_archive_setting(self) -> None:
        lines = (self.repo / "function_app.py").read_text(encoding="utf-8").splitlines()

        self.assertIn("ARCHIVE_ACCOUNT", lines[12])

    def test_real_line_is_accepted(self) -> None:
        self.assertEqual(self.check(flow()), [])

    def test_line_naming_the_store_directly_is_accepted(self) -> None:
        (self.repo / "settings.txt").write_text("ARCHIVE=custarchive\n", encoding="utf-8")

        self.assertEqual(probable_flow_problems([flow(file="settings.txt", line=1)], self.repo, STORES, {}), [])

    def test_fabricated_line(self) -> None:
        self.assertEqual(self.check(flow(line=3)),
                         ["Flow 1: line 3 of 'function_app.py' does not mention custarchive."])

    def test_out_of_range_line(self) -> None:
        self.assertEqual(self.check(flow(line=99)), ["Flow 1: line 99 is outside the file."])

    def test_missing_line(self) -> None:
        self.assertEqual(self.check(flow(line=None)), ["Flow 1: line 0 is outside the file."])

    def test_missing_file(self) -> None:
        self.assertEqual(self.check(flow(file="reconcile.py")), ["Flow 1: file 'reconcile.py' does not exist."])

    def test_no_file_named(self) -> None:
        self.assertEqual(self.check(flow(file=None)), ["Flow 1: file 'None' does not exist."])

    def test_unknown_store(self) -> None:
        self.assertEqual(self.check(flow(store="custbackup")), ["Flow 1: store 'custbackup' is not in the snapshot."])

    def test_wrong_store_for_the_setting(self) -> None:
        self.assertEqual(self.check(flow(store="custdata")),
                         ["Flow 1: line 13 of 'function_app.py' does not mention custdata."])

    def test_file_outside_the_repository_is_never_read(self) -> None:
        self.assertEqual(self.check(flow(file="../outside.py", line=1)),
                         ["Flow 1: file '../outside.py' is outside the repository."])

    def test_flows_are_numbered(self) -> None:
        problems = self.check(flow(), flow(store="custbackup"))

        self.assertEqual(problems, ["Flow 2: store 'custbackup' is not in the snapshot."])


if __name__ == "__main__":
    unittest.main()
