import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from check_readme_density import count_links_before_first_details


class ReadmeDensityTests(unittest.TestCase):
    def test_details_example_in_fence_does_not_end_opener(self):
        text = "```html\n<details>\n```\n[link](target.md)\n<details>\n"
        self.assertEqual(count_links_before_first_details(text), (1, None))

    def test_crlf_fence_does_not_end_opener(self):
        text = "```html\r\n<details>\r\n```\r\n[link](target.md)\r\n<details>\r\n"
        self.assertEqual(count_links_before_first_details(text), (1, None))


if __name__ == "__main__":
    unittest.main()
