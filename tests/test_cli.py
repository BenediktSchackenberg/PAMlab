"""Tests for pamlab.cli."""

from __future__ import annotations

from pathlib import Path

import pytest

from pamlab.cli import build_parser, main


class TestCli:
    def test_validate_success(self, tmp_path: Path, capsys):
        sshd = tmp_path / "sshd"
        sshd.write_text("auth\trequired\tpam_unix.so\n", encoding="utf-8")

        with pytest.raises(SystemExit) as exc_info:
            main(["validate", str(tmp_path)])
        assert exc_info.value.code == 0
        captured = capsys.readouterr()
        assert "validated successfully" in captured.out

    def test_validate_failure(self, tmp_path: Path, capsys):
        bad = tmp_path / "bad"
        bad.write_text("badtype\trequired\tpam_unix.so\n", encoding="utf-8")

        with pytest.raises(SystemExit) as exc_info:
            main(["validate", str(tmp_path)])
        assert exc_info.value.code == 2
        captured = capsys.readouterr()
        assert "FAIL" in captured.out

    def test_validate_missing_path(self, tmp_path: Path, capsys):
        with pytest.raises(SystemExit) as exc_info:
            main(["validate", str(tmp_path / "nonexistent")])
        assert exc_info.value.code == 1

    def test_list_success(self, tmp_path: Path, capsys):
        (tmp_path / "sshd").write_text("auth\trequired\tpam_unix.so\n", encoding="utf-8")
        (tmp_path / "sudo").write_text("auth\tsufficient\tpam_unix.so\n", encoding="utf-8")

        with pytest.raises(SystemExit) as exc_info:
            main(["list", str(tmp_path)])
        assert exc_info.value.code == 0
        captured = capsys.readouterr()
        assert "sshd" in captured.out
        assert "sudo" in captured.out

    def test_list_missing_path(self, tmp_path: Path, capsys):
        with pytest.raises(SystemExit) as exc_info:
            main(["list", str(tmp_path / "nonexistent")])
        assert exc_info.value.code == 1

    def test_no_command_exits(self):
        with pytest.raises(SystemExit):
            main([])

    def test_parser_has_validate_and_list(self):
        parser = build_parser()
        # Should not raise
        args = parser.parse_args(["validate", "/tmp"])
        assert args.command == "validate"
        args = parser.parse_args(["list", "/tmp"])
        assert args.command == "list"
