FROM debian:bookworm-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
        libpam-runtime \
        libpam-modules \
        python3 \
        python3-pip \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /pamlab

COPY pyproject.toml ./
COPY pamlab/ ./pamlab/

RUN pip3 install --no-cache-dir -e .

ENTRYPOINT ["pamlab"]
CMD ["validate", "/etc/pam.d"]
