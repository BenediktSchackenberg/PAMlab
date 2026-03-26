"""Tests for pamlab.core."""

from __future__ import annotations

import textwrap
from pathlib import Path

import pytest

from pamlab.core import PamConfig, PamRule, PamService, _parse_rule


# ---------------------------------------------------------------------------
# PamRule
# ---------------------------------------------------------------------------

class TestPamRule:
    def test_str_without_arguments(self):
        rule = PamRule("auth", "required", "pam_unix.so")
        assert str(rule) == "auth\trequired\tpam_unix.so"

    def test_str_with_arguments(self):
        rule = PamRule("auth", "sufficient", "pam_unix.so", ["nullok", "try_first_pass"])
        assert str(rule) == "auth\tsufficient\tpam_unix.so\tnullok\ttry_first_pass"

    def test_validate_ok(self):
        rule = PamRule("session", "required", "pam_limits.so")
        assert rule.validate() == []

    def test_validate_bad_module_type(self):
        rule = PamRule("badtype", "required", "pam_unix.so")
        errors = rule.validate()
        assert len(errors) == 1
        assert "badtype" in errors[0]

    def test_validate_bad_control(self):
        rule = PamRule("auth", "magic", "pam_unix.so")
        errors = rule.validate()
        assert len(errors) == 1
        assert "magic" in errors[0]

    def test_validate_bracketed_control_ok(self):
        rule = PamRule("auth", "[success=1 default=ignore]", "pam_unix.so")
        assert rule.validate() == []

    def test_validate_hyphen_prefixed_module_type_ok(self):
        rule = PamRule("-session", "optional", "pam_systemd.so")
        assert rule.validate() == []

    def test_validate_empty_module_path(self):
        rule = PamRule("auth", "required", "")
        errors = rule.validate()
        assert any("module_path" in e for e in errors)

    def test_validate_multiple_errors(self):
        rule = PamRule("badtype", "badcontrol", "")
        errors = rule.validate()
        assert len(errors) == 3


# ---------------------------------------------------------------------------
# _parse_rule
# ---------------------------------------------------------------------------

class TestParseRule:
    def test_simple_rule(self):
        rule = _parse_rule("auth\trequired\tpam_unix.so")
        assert rule is not None
        assert rule.module_type == "auth"
        assert rule.control == "required"
        assert rule.module_path == "pam_unix.so"
        assert rule.arguments == []

    def test_rule_with_arguments(self):
        rule = _parse_rule("auth sufficient pam_unix.so nullok try_first_pass")
        assert rule is not None
        assert rule.control == "sufficient"
        assert rule.arguments == ["nullok", "try_first_pass"]

    def test_comment_stripped(self):
        rule = _parse_rule("auth required pam_unix.so  # inline comment")
        assert rule is not None
        assert rule.arguments == []

    def test_full_comment_line(self):
        assert _parse_rule("# this is a comment") is None

    def test_empty_line(self):
        assert _parse_rule("   ") is None

    def test_too_few_tokens(self):
        assert _parse_rule("auth required") is None

    def test_bracketed_control_single_token(self):
        rule = _parse_rule("auth [success=ok] pam_unix.so")
        assert rule is not None
        assert rule.control == "[success=ok]"

    def test_bracketed_control_multi_token(self):
        rule = _parse_rule("auth [success=1 default=ignore] pam_unix.so nullok")
        assert rule is not None
        assert rule.control == "[success=1 default=ignore]"
        assert rule.arguments == ["nullok"]


# ---------------------------------------------------------------------------
# PamService
# ---------------------------------------------------------------------------

class TestPamService:
    def _make_service(self) -> PamService:
        return PamService("sshd", [
            PamRule("auth", "required", "pam_unix.so"),
            PamRule("account", "required", "pam_unix.so"),
            PamRule("session", "optional", "pam_systemd.so"),
        ])

    def test_validate_ok(self):
        svc = self._make_service()
        assert svc.validate() == []

    def test_validate_propagates_errors(self):
        svc = PamService("bad", [PamRule("badtype", "required", "pam_unix.so")])
        errors = svc.validate()
        assert len(errors) == 1
        assert "bad" in errors[0]

    def test_iter_rules_all(self):
        svc = self._make_service()
        assert list(svc.iter_rules()) == svc.rules

    def test_iter_rules_filtered(self):
        svc = self._make_service()
        auth_rules = list(svc.iter_rules("auth"))
        assert len(auth_rules) == 1
        assert auth_rules[0].module_type == "auth"

    def test_str_contains_service_name(self):
        svc = self._make_service()
        assert "sshd" in str(svc)

    def test_str_contains_rules(self):
        svc = self._make_service()
        text = str(svc)
        assert "pam_unix.so" in text


# ---------------------------------------------------------------------------
# PamConfig
# ---------------------------------------------------------------------------

class TestPamConfig:
    def test_add_and_get_service(self):
        cfg = PamConfig()
        svc = PamService("sudo")
        cfg.add_service(svc)
        assert cfg.get_service("sudo") is svc

    def test_get_missing_service(self):
        cfg = PamConfig()
        assert cfg.get_service("nonexistent") is None

    def test_remove_service(self):
        cfg = PamConfig()
        cfg.add_service(PamService("sudo"))
        cfg.remove_service("sudo")
        assert cfg.get_service("sudo") is None

    def test_remove_missing_is_silent(self):
        cfg = PamConfig()
        cfg.remove_service("ghost")  # should not raise

    def test_validate_all_ok(self):
        cfg = PamConfig()
        cfg.add_service(PamService("sshd", [PamRule("auth", "required", "pam_unix.so")]))
        assert cfg.validate() == []

    def test_validate_propagates_errors(self):
        cfg = PamConfig()
        cfg.add_service(PamService("sshd", [PamRule("badtype", "required", "pam_unix.so")]))
        errors = cfg.validate()
        assert len(errors) == 1

    def test_services_property_order(self):
        cfg = PamConfig()
        cfg.add_service(PamService("a"))
        cfg.add_service(PamService("b"))
        cfg.add_service(PamService("c"))
        assert [s.name for s in cfg.services] == ["a", "b", "c"]

    def test_from_directory(self, tmp_path: Path):
        sshd = tmp_path / "sshd"
        sshd.write_text("auth\trequired\tpam_unix.so\n", encoding="utf-8")
        sudo = tmp_path / "sudo"
        sudo.write_text("auth\tsufficient\tpam_unix.so\tnullok\n", encoding="utf-8")
        # File with a dot should be ignored
        readme = tmp_path / "README.md"
        readme.write_text("ignore me\n", encoding="utf-8")

        cfg = PamConfig.from_directory(tmp_path)
        assert cfg.get_service("sshd") is not None
        assert cfg.get_service("sudo") is not None
        assert cfg.get_service("README.md") is None

    def test_to_directory(self, tmp_path: Path):
        cfg = PamConfig()
        cfg.add_service(PamService("login", [
            PamRule("auth", "required", "pam_unix.so"),
        ]))
        out = tmp_path / "pam.d"
        cfg.to_directory(out)
        written = (out / "login").read_text(encoding="utf-8")
        assert "pam_unix.so" in written

    def test_round_trip(self, tmp_path: Path):
        original = PamConfig()
        original.add_service(PamService("sshd", [
            PamRule("auth", "required", "pam_unix.so", ["nullok"]),
            PamRule("session", "optional", "pam_systemd.so"),
        ]))
        out = tmp_path / "pam.d"
        original.to_directory(out)

        loaded = PamConfig.from_directory(out)
        sshd = loaded.get_service("sshd")
        assert sshd is not None
        assert len(sshd.rules) == 2
        assert sshd.rules[0].arguments == ["nullok"]
