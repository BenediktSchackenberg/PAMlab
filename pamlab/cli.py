"""Command-line interface for PAMlab."""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

from pamlab.core import PamConfig


def _cmd_validate(args: argparse.Namespace) -> int:
    path = Path(args.path)
    if not path.exists():
        print(f"Error: path '{path}' does not exist.", file=sys.stderr)
        return 1

    cfg = PamConfig.from_directory(path)
    errors = cfg.validate()

    if errors:
        for err in errors:
            print(f"  [FAIL] {err}")
        print(f"\n{len(errors)} error(s) found.")
        return 2

    print(f"All {len(cfg.services)} service(s) validated successfully.")
    return 0


def _cmd_list(args: argparse.Namespace) -> int:
    path = Path(args.path)
    if not path.exists():
        print(f"Error: path '{path}' does not exist.", file=sys.stderr)
        return 1

    cfg = PamConfig.from_directory(path)
    for service in cfg.services:
        rule_count = len(service.rules)
        print(f"  {service.name!s:<24} ({rule_count} rule{'s' if rule_count != 1 else ''})")
    return 0


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        prog="pamlab",
        description="PAMlab — inspect and validate Linux PAM configurations",
    )
    sub = parser.add_subparsers(dest="command", required=True)

    p_validate = sub.add_parser("validate", help="Validate a PAM configuration directory")
    p_validate.add_argument(
        "path",
        nargs="?",
        default="/etc/pam.d",
        help="Path to the PAM configuration directory (default: /etc/pam.d)",
    )
    p_validate.set_defaults(func=_cmd_validate)

    p_list = sub.add_parser("list", help="List all PAM services in a directory")
    p_list.add_argument(
        "path",
        nargs="?",
        default="/etc/pam.d",
        help="Path to the PAM configuration directory (default: /etc/pam.d)",
    )
    p_list.set_defaults(func=_cmd_list)

    return parser


def main(argv: list[str] | None = None) -> None:
    parser = build_parser()
    args = parser.parse_args(argv)
    sys.exit(args.func(args))


if __name__ == "__main__":
    main()
