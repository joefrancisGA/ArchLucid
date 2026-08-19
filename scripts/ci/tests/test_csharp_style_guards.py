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
import check_csharp_is_null as csharp_is_null  # noqa: E402
import check_datetime_now as datetime_now  # noqa: E402
import check_no_async_void as no_async_void  # noqa: E402
import check_no_base_exception as no_base_exception  # noqa: E402
import check_no_console_writeline as no_console  # noqa: E402
import check_no_sync_over_async as no_sync_over_async  # noqa: E402
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

    def test_ignores_type_declarations_inside_raw_string_literals(self) -> None:
        raw_delim = '"""'
        source = f"""
namespace ArchLucid.Analyzers.Tests;

public sealed class TenantScopedQueryScopeBindingAnalyzerTests
{{
    private const string SharedStubs = {raw_delim}

namespace Dapper
{{
    public static class SqlMapper
    {{
    }}
}}

public sealed class BadExemptionRepository
{{
}}

{raw_delim};
}}
"""

        self.assertEqual(
            single_class.root_type_names(source),
            {"TenantScopedQueryScopeBindingAnalyzerTests"},
        )


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


class TestCsharpIsNullGuard(unittest.TestCase):
    def test_allows_is_null_pattern(self) -> None:
        source = """
public void Demo(object value)
{
    if (value is null)
    {
    }

    if (value is not null)
    {
    }
}
"""

        self.assertEqual(csharp_is_null.scan_source(source), [])

    def test_flags_equality_null(self) -> None:
        source = """
public void Demo(object value)
{
    if (value == null)
    {
    }
}
"""

        self.assertEqual(csharp_is_null.scan_source(source), [4])


class TestNoConsoleWriteGuard(unittest.TestCase):
    def test_excludes_test_paths(self) -> None:
        self.assertFalse(no_console.should_scan_path("ArchLucid.Core.Tests/FooTests.cs"))
        self.assertFalse(no_console.should_scan_path("ArchLucid.Cli/Program.cs"))
        self.assertTrue(no_console.should_scan_path("ArchLucid.Api/Controllers/HealthController.cs"))

    def test_flags_console_write_line(self) -> None:
        source = """
public void Demo()
{
    Console.WriteLine("debug");
}
"""

        self.assertEqual(no_console.scan_source(source), [4])


class TestNoBaseExceptionGuard(unittest.TestCase):
    def test_allows_specific_exception(self) -> None:
        source = """
public void Demo()
{
    throw new InvalidOperationException("bad");
}
"""

        self.assertEqual(no_base_exception.scan_source(source), [])

    def test_flags_base_exception(self) -> None:
        source = """
public void Demo()
{
    throw new Exception("bad");
}
"""

        self.assertEqual(no_base_exception.scan_source(source), [4])


class TestDateTimeNowGuard(unittest.TestCase):
    def test_excludes_test_paths(self) -> None:
        self.assertFalse(datetime_now.should_scan_path("ArchLucid.Core.Tests/FooTests.cs"))
        self.assertTrue(datetime_now.should_scan_path("ArchLucid.Application/Services/Demo.cs"))

    def test_flags_datetime_now(self) -> None:
        source = """
public void Demo()
{
    var stamp = DateTime.Now;
}
"""

        self.assertEqual(datetime_now.scan_source(source), [4])


class TestNoAsyncVoidGuard(unittest.TestCase):
    def test_allows_async_task(self) -> None:
        source = """
public async Task Demo()
{
    await Task.CompletedTask;
}
"""

        self.assertEqual(no_async_void.scan_source(source), [])

    def test_flags_async_void(self) -> None:
        source = """
public async void Demo()
{
}
"""

        self.assertEqual(no_async_void.scan_source(source), [2])


class TestNoSyncOverAsyncGuard(unittest.TestCase):
    def test_excludes_test_and_cli_paths(self) -> None:
        self.assertFalse(no_sync_over_async.should_scan_path("ArchLucid.Core.Tests/FooTests.cs"))
        self.assertFalse(no_sync_over_async.should_scan_path("ArchLucid.Cli/Program.cs"))
        self.assertTrue(no_sync_over_async.should_scan_path("ArchLucid.Api/Controllers/HealthController.cs"))

    def test_flags_get_awaiter_get_result(self) -> None:
        source = """
public void Demo()
{
    work.GetAwaiter().GetResult();
}
"""

        hits = no_sync_over_async.scan_source(source)
        self.assertEqual(len(hits), 1)
        self.assertEqual(hits[0][0], 4)


if __name__ == "__main__":
    unittest.main()
