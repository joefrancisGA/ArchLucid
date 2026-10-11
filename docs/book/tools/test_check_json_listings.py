"""Tests for check_json_listings.py, the parse and strict-schema check for the book's JSON listings."""

from __future__ import annotations

import contextlib
import io
import json
import tempfile
import unittest
from pathlib import Path

from check_json_listings import (
    check_file,
    children,
    is_object_schema,
    main,
    node_problems,
    schema_count,
    strict_problems,
    strict_schemas,
)

STRICT = {
    "type": "object",
    "additionalProperties": False,
    "required": ["a"],
    "properties": {"a": {"type": "string"}},
}
LOOSE = {"type": "object", "properties": {"a": {}, "b": {}}, "required": ["a", "c"]}


class Nodes(unittest.TestCase):
    def test_is_object_schema(self) -> None:
        self.assertTrue(is_object_schema({"type": "object"}))
        self.assertTrue(is_object_schema({"type": ["object", "null"]}))
        self.assertTrue(is_object_schema({"properties": {}}))
        self.assertFalse(is_object_schema({"type": "string"}))

    def test_node_problems(self) -> None:
        self.assertEqual(node_problems(STRICT, "#"), [])
        self.assertEqual(node_problems({"type": "string"}, "#"), [])
        self.assertEqual(node_problems(LOOSE, "#"), [
            "#: additionalProperties must be false",
            "#: not in required: b",
            "#: required but not a property: c",
        ])

    def test_children_cover_every_keyword_shape(self) -> None:
        node = {"items": {"x": 1}, "anyOf": [{"y": 1}, "skip"], "$defs": {"d": {"z": 1}, "e": 2}}

        self.assertEqual(children(node, "#"), [
            ({"x": 1}, "#/items"),
            ({"y": 1}, "#/anyOf/0"),
            ({"z": 1}, "#/$defs/d"),
        ])

    def test_strict_problems_recurse(self) -> None:
        schema = {**STRICT, "$defs": {"inner": LOOSE}}

        self.assertEqual(strict_problems(schema)[0], "#/$defs/inner: additionalProperties must be false")
        self.assertEqual(strict_problems(STRICT), [])


class Detection(unittest.TestCase):
    def test_schema_file_suffix(self) -> None:
        self.assertEqual(strict_schemas(STRICT, "x.schema.json"), [(STRICT, "#")])
        self.assertEqual(strict_schemas(STRICT, "x.json"), [])

    def test_response_format_wrapper(self) -> None:
        wrapped = {"json_schema": {"strict": True, "schema": STRICT}}

        self.assertEqual(strict_schemas(wrapped, "x.json"), [(STRICT, "#/json_schema/schema")])
        self.assertEqual(strict_schemas({"json_schema": {"strict": True}}, "x.json"), [({}, "#/json_schema/schema")])
        self.assertEqual(strict_schemas({"json_schema": {"schema": STRICT}}, "x.json"), [])

    def test_function_tools(self) -> None:
        tools = [
            {"function": {"strict": True, "parameters": STRICT}},
            {"function": {"strict": True}},
            {"function": {"parameters": LOOSE}},
            "not a tool",
        ]

        self.assertEqual(strict_schemas(tools, "tools.json"), [(STRICT, "#/0/function/parameters"),
                                                               ({}, "#/1/function/parameters")])

    def test_other_documents(self) -> None:
        self.assertEqual(strict_schemas("text", "x.json"), [])
        self.assertEqual(strict_schemas([1], "x.schema.json"), [])


class Files(unittest.TestCase):
    def setUp(self) -> None:
        self.folder = tempfile.TemporaryDirectory()
        self.root = Path(self.folder.name)
        self.listings = self.root / "lab" / "listings" / "json"
        self.listings.mkdir(parents=True)

    def tearDown(self) -> None:
        self.folder.cleanup()

    def write(self, name: str, text: str) -> Path:
        path = self.listings / name
        path.write_text(text, encoding="utf-8")

        return path

    def run_main(self) -> tuple[int, str]:
        output = io.StringIO()

        with contextlib.redirect_stdout(output):
            code = main(["--book-root", str(self.root)])

        return code, output.getvalue()

    def test_bad_json(self) -> None:
        path = self.write("bad.json", "{")

        self.assertIn("does not parse", check_file(path)[0])
        self.assertEqual(schema_count(path), 0)

    def test_main_passes(self) -> None:
        self.write("good.schema.json", json.dumps(STRICT))
        self.write("example.json", json.dumps({"anything": True}))

        code, output = self.run_main()

        self.assertEqual(code, 0)
        self.assertIn("check_json_listings: 2 file(s), 1 strict schema(s), 0 problem(s)", output)

    def test_main_fails(self) -> None:
        self.write("loose.schema.json", json.dumps(LOOSE))

        code, output = self.run_main()

        self.assertEqual(code, 1)
        self.assertIn("loose.schema.json: #: additionalProperties must be false", output)


if __name__ == "__main__":
    unittest.main()
