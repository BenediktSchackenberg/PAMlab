# PAMlab

PAMlab is a lightweight Python tool for **inspecting, validating, and testing
Linux [PAM (Pluggable Authentication Modules)](https://www.linux-pam.org/)**
configurations.

It parses `/etc/pam.d/` service files into structured data objects, validates
them against PAM rules, and provides a CLI to explore configurations from any
Linux machine or a Docker container.

---

## Features

- Parse any PAM service directory (e.g. `/etc/pam.d/`)
- Validate module types, control flags, and module paths
- Iterate and filter rules by type (`auth`, `account`, `password`, `session`)
- Read and write PAM configuration directories programmatically
- CLI with `validate` and `list` sub-commands
- Docker image for isolated lab/testing use

---

## Quick start

### Install from source

```bash
pip install -e .
```

### CLI usage

```bash
# Validate the current machine's PAM configuration
pamlab validate /etc/pam.d

# List all PAM services
pamlab list /etc/pam.d
```

### Docker usage

```bash
docker build -t pamlab .

# Run against the host PAM config (read-only)
docker run --rm -v /etc/pam.d:/etc/pam.d:ro pamlab validate
```

---

## Python API

```python
from pamlab import PamConfig, PamService, PamRule

# Load from disk
cfg = PamConfig.from_directory("/etc/pam.d")

# Inspect a service
sshd = cfg.get_service("sshd")
for rule in sshd.iter_rules("auth"):
    print(rule)

# Build a config programmatically
cfg = PamConfig()
cfg.add_service(PamService("sshd", [
    PamRule("auth",    "required",   "pam_unix.so"),
    PamRule("account", "required",   "pam_unix.so"),
    PamRule("session", "optional",   "pam_systemd.so"),
]))

errors = cfg.validate()
if errors:
    for e in errors:
        print(e)
```

---

## Development

```bash
# Install with dev dependencies
pip install -e ".[dev]"

# Run tests
pytest
```

---

## License

Apache 2.0 — see [LICENSE](LICENSE).
