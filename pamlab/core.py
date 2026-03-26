"""Core data structures and helpers for PAMlab."""

from __future__ import annotations

import re
from dataclasses import dataclass, field
from pathlib import Path
from typing import Iterator


# ---------------------------------------------------------------------------
# Data model
# ---------------------------------------------------------------------------

@dataclass
class PamRule:
    """Represents a single line in a PAM service file.

    Attributes:
        module_type: One of ``account``, ``auth``, ``password``, ``session``.
        control:     Control flag or bracketed value list, e.g. ``required``,
                     ``sufficient``, or ``[success=ok default=bad]``.
        module_path: Path to the PAM module, e.g. ``pam_unix.so``.
        arguments:   Optional module arguments as a list of strings.
    """

    module_type: str
    control: str
    module_path: str
    arguments: list[str] = field(default_factory=list)

    # Valid module types defined by Linux-PAM
    _VALID_TYPES = frozenset({"account", "auth", "password", "session"})

    # Control keywords that do not need bracket syntax
    _SIMPLE_CONTROLS = frozenset(
        {"required", "requisite", "sufficient", "optional", "include", "substack"}
    )

    def validate(self) -> list[str]:
        """Return a list of validation error messages (empty = valid)."""
        errors: list[str] = []
        # Strip optional leading hyphen (silent-fail prefix) before checking type
        bare_type = self.module_type.lstrip("-")
        if bare_type not in self._VALID_TYPES:
            errors.append(
                f"Invalid module_type '{self.module_type}'. "
                f"Must be one of: {sorted(self._VALID_TYPES)} "
                f"(optionally prefixed with '-')"
            )
        if (
            self.control not in self._SIMPLE_CONTROLS
            and not self.control.startswith("[")
        ):
            errors.append(
                f"Unknown control flag '{self.control}'. "
                f"Use one of {sorted(self._SIMPLE_CONTROLS)} or a bracketed value."
            )
        if not self.module_path:
            errors.append("module_path must not be empty.")
        return errors

    def __str__(self) -> str:
        parts = [self.module_type, self.control, self.module_path] + self.arguments
        return "\t".join(parts)


@dataclass
class PamService:
    """Represents a PAM service configuration (a single ``/etc/pam.d/<name>`` file).

    Attributes:
        name:  Service name, e.g. ``sshd``, ``sudo``, ``login``.
        rules: Ordered list of :class:`PamRule` objects.
    """

    name: str
    rules: list[PamRule] = field(default_factory=list)

    def validate(self) -> list[str]:
        """Return a list of validation error messages across all rules."""
        errors: list[str] = []
        for i, rule in enumerate(self.rules, start=1):
            for msg in rule.validate():
                errors.append(f"[{self.name}] rule {i}: {msg}")
        return errors

    def iter_rules(self, module_type: str | None = None) -> Iterator[PamRule]:
        """Yield rules, optionally filtered by *module_type*."""
        for rule in self.rules:
            if module_type is None or rule.module_type == module_type:
                yield rule

    def __str__(self) -> str:
        lines = [f"# PAMlab — service: {self.name}"]
        for rule in self.rules:
            lines.append(str(rule))
        return "\n".join(lines)


# ---------------------------------------------------------------------------
# Parser
# ---------------------------------------------------------------------------

_COMMENT_RE = re.compile(r"#.*$")


def _parse_rule(line: str) -> PamRule | None:
    """Parse a single non-empty, non-comment PAM config line into a :class:`PamRule`.

    Returns ``None`` if the line cannot be parsed.
    """
    line = _COMMENT_RE.sub("", line).strip()
    if not line:
        return None

    tokens = line.split()
    if len(tokens) < 3:
        return None

    module_type = tokens[0]
    control = tokens[1]
    rest = tokens[2:]

    # Handle bracketed control value that may contain spaces, e.g.:
    #   auth  [success=1 default=ignore]  pam_unix.so
    if control.startswith("[") and not control.endswith("]"):
        # Consume from rest until we close the bracket
        bracket_parts = [control]
        consumed = 0
        for part in rest:
            consumed += 1
            bracket_parts.append(part)
            if part.endswith("]"):
                break
        control = " ".join(bracket_parts)
        rest = rest[consumed:]

    if not rest:
        return None

    module_path = rest[0]
    arguments = rest[1:]

    return PamRule(
        module_type=module_type,
        control=control,
        module_path=module_path,
        arguments=arguments,
    )


# ---------------------------------------------------------------------------
# PamConfig — multi-service container
# ---------------------------------------------------------------------------

class PamConfig:
    """A collection of :class:`PamService` objects, mirroring ``/etc/pam.d/``.

    Example usage::

        cfg = PamConfig()
        cfg.add_service(PamService("sshd", [
            PamRule("auth", "required", "pam_unix.so"),
        ]))
        errors = cfg.validate()
    """

    def __init__(self) -> None:
        self._services: dict[str, PamService] = {}

    # ------------------------------------------------------------------
    # Mutation helpers
    # ------------------------------------------------------------------

    def add_service(self, service: PamService) -> None:
        """Add (or replace) a :class:`PamService`."""
        self._services[service.name] = service

    def remove_service(self, name: str) -> None:
        """Remove a service by name. Silent if not present."""
        self._services.pop(name, None)

    def get_service(self, name: str) -> PamService | None:
        """Return the :class:`PamService` for *name*, or ``None``."""
        return self._services.get(name)

    @property
    def services(self) -> list[PamService]:
        """Return services in insertion order."""
        return list(self._services.values())

    # ------------------------------------------------------------------
    # I/O
    # ------------------------------------------------------------------

    @classmethod
    def from_directory(cls, path: str | Path) -> "PamConfig":
        """Load all service files from a directory (e.g. ``/etc/pam.d/``).

        Files that start with a dot or contain a dot in their name (e.g.
        ``README``) are skipped.
        """
        cfg = cls()
        directory = Path(path)
        for service_file in sorted(directory.iterdir()):
            if service_file.is_file() and "." not in service_file.name:
                cfg.add_service(cls._load_service(service_file))
        return cfg

    @classmethod
    def _load_service(cls, path: Path) -> PamService:
        service = PamService(name=path.name)
        for line in path.read_text(encoding="utf-8").splitlines():
            rule = _parse_rule(line)
            if rule is not None:
                service.rules.append(rule)
        return service

    def to_directory(self, path: str | Path) -> None:
        """Write all services to individual files under *path*."""
        directory = Path(path)
        directory.mkdir(parents=True, exist_ok=True)
        for service in self._services.values():
            (directory / service.name).write_text(str(service) + "\n", encoding="utf-8")

    # ------------------------------------------------------------------
    # Validation
    # ------------------------------------------------------------------

    def validate(self) -> list[str]:
        """Return all validation errors across every service."""
        errors: list[str] = []
        for service in self._services.values():
            errors.extend(service.validate())
        return errors
