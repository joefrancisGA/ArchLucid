#!/usr/bin/env python3
"""Unit tests for diff-scoped C# style guards."""

from __future__ import annotations

import sys
import tempfile
import unittest
from pathlib import Path

_CI_DIR = Path(__file__).resolve().parents[1]
if str(_CI_DIR) not in sys.path:
    sys.path.insert(0, str(_CI_DIR))

import check_control_flow_spacing as control_flow  # noqa: E402
import check_single_class_per_file as single_class  # noqa: E402


class TestSingleClassPerFileGuard(unittest.TestCase):
    def test_allows_single_root_type(self) -> None:
        source = """
namespace Demo;

public sealed class OnlyOne
{
    private class Nested
    {
    }
}
"""

        self.assertEqual(single_class.root_type_names(source), {"OnlyOne"})

    def test_flags_multiple_root_types(self) -> None:
        source = """
namespace Demo;

public class First { }
public class Second { }
"""

        self.assertEqual(len(single_class.root_type_names(source)), 2)


class TestControlFlowSpacingGuard(unittest.TestCase):
    def test_allows_blank_line_before_if(self) -> None:
        source = """
public void Demo()
{
    var value = 1;

    if (value > 0)
    {
    }
}
"""

        self.assertEqual(control_flow.scan_source(source), [])

    def test_flags_missing_blank_line(self) -> None:
        source = """
public void Demo()
{
    var value = 1;
    if (value > 0)
    {
    }
}
"""

        self.assertEqual(control_flow.scan_source(source), [5])


if __name__ == "__main__":
    unittest.main()
