#!/bin/sh
set -eu

cat >/usr/share/nginx/html/runtime-config.js <<EOF
window.__PAMLAB_CONFIG__ = Object.assign({}, window.__PAMLAB_CONFIG__, {
  fudoUrl: "${VITE_FUDO_URL:-/api/fudo}",
  matrixUrl: "${VITE_M42_URL:-/api/matrix42}",
  adUrl: "${VITE_AD_URL:-/api/ad}",
  azureAdUrl: "${VITE_AZURE_AD_URL:-/api/azure-ad}",
  snowUrl: "${VITE_SNOW_URL:-/api/snow}",
  jsmUrl: "${VITE_JSM_URL:-/api/jsm}",
  remedyUrl: "${VITE_REMEDY_URL:-/api/remedy}",
  cyberarkUrl: "${VITE_CYBERARK_URL:-/api/cyberark}",
  fudoUser: "${VITE_FUDO_USER:-admin}",
  fudoPass: "${VITE_FUDO_PASS:-admin}",
});
EOF
