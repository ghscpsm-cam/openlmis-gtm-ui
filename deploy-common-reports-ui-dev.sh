#!/bin/sh
set -eu

REMOTE="${REMOTE:-openlmisdev}"
BASE_IMAGE="${BASE_IMAGE:-ghcr.io/ghscpsm-cam/openlmis-gtm-ui:8.0.1-gtm.4}"
TARGET_IMAGE="${TARGET_IMAGE:-ghcr.io/ghscpsm-cam/openlmis-gtm-ui:8.0.1-gtm.5}"
COMPOSE_DIR="${COMPOSE_DIR:-/opt/openlmis-ref-distro}"
CONTAINER="${CONTAINER:-openlmis-ref-distro-reference-ui-1}"
SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
WORK_DIR=$(mktemp -d "${TMPDIR:-/tmp}/openlmis-ui-filter.XXXXXX")
REMOTE_WORK_DIR="/tmp/openlmis-ui-filter-$$"

cleanup() {
    rm -rf "$WORK_DIR"
    ssh "$REMOTE" "rm -rf '$REMOTE_WORK_DIR'" >/dev/null 2>&1 || true
}
trap cleanup EXIT INT TERM

echo "Extracting the translated GTM UI bundle from $BASE_IMAGE"
ssh "$REMOTE" "docker pull '$BASE_IMAGE' >/dev/null && mkdir -p '$REMOTE_WORK_DIR' && container_id=\$(docker create '$BASE_IMAGE') && docker cp \"\$container_id:/usr/share/nginx/html/openlmis.js\" '$REMOTE_WORK_DIR/openlmis.js' && docker rm \"\$container_id\" >/dev/null"
scp "$REMOTE:$REMOTE_WORK_DIR/openlmis.js" "$WORK_DIR/openlmis.js"

node "$SCRIPT_DIR/scripts/patch-report-list-bundle.js" "$WORK_DIR/openlmis.js"

cp "$SCRIPT_DIR/Dockerfile.report-filter" "$WORK_DIR/Dockerfile"
scp "$WORK_DIR/openlmis.js" "$WORK_DIR/Dockerfile" "$REMOTE:$REMOTE_WORK_DIR/"

echo "Building and publishing $TARGET_IMAGE"
ssh "$REMOTE" "docker build --build-arg BASE_IMAGE='$BASE_IMAGE' -t '$TARGET_IMAGE' '$REMOTE_WORK_DIR' >/dev/null && docker push '$TARGET_IMAGE'"

echo "Activating the versioned image through the platform override"
ssh "$REMOTE" "cd /opt/openlmis-gua-platform && sed -i -E 's#^REFERENCE_UI_IMAGE=.*#REFERENCE_UI_IMAGE=$TARGET_IMAGE#' env/dev.env && ./platform up dev"

ssh "$REMOTE" "docker exec '$CONTAINER' sh -lc 'grep -q \"Tarjeta de Almacén para\" /usr/share/nginx/html/openlmis.js && grep -q \"Reportes DABMA\" /usr/share/nginx/html/openlmis.js && grep -q \"commonCategoryName\" /usr/share/nginx/html/openlmis.js'"

echo "Deployment verified: GTM translations plus warehouse report filtering are active."
