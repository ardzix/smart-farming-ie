pipeline {
    agent any

    environment {
        DEPLOY = 'true'
        DOCKER_IMAGE_REPO = 'arnatechid/smart-farming-be'
        DEPLOY_IMAGE_REPO = 'arnatechid/smart-farming-be'
        DOCKER_REGISTRY_CREDENTIALS = 'ard-dockerhub'
        BACKEND_ENV_CREDENTIALS = 'smart-farming-be-env'
        SSH_CREDENTIALS = 'stag-arnatech-sa-01'
        STACK_NAME = 'smart-farming-be'
        REPLICAS = '1'
        NETWORK_NAME = 'production'
        VPS_HOST = '172.105.124.43'
        VPS_USER = 'root'
        VPS_APP_DIR = '/root/smart-farming-ie/be'
        USE_DOCKER_CLOUD = 'true'
        DOCKER_CLOUD_BUILDER_ENDPOINT = 'arnatechid/default'
        DOCKER_CLOUD_BUILDER_NAME = 'arna-cloud-builder'
    }

    stages {
        stage('Checkout Code') {
            steps {
                checkout scm
            }
        }

        stage('Inject Backend Environment') {
            steps {
                withCredentials([
                    file(credentialsId: env.BACKEND_ENV_CREDENTIALS, variable: 'ENV_FILE')
                ]) {
                    sh '''
                        cp "${ENV_FILE}" be/.env
                    '''
                }
            }
        }

        stage('Validate Environment') {
            steps {
                script {
                    def dockerRepo = env.DOCKER_IMAGE_REPO?.trim()
                    def deployRepo = (env.DEPLOY_IMAGE_REPO?.trim() ?: dockerRepo)

                    if (!dockerRepo || !dockerRepo.contains('/') || dockerRepo in ['true', 'false']) {
                        error("Invalid DOCKER_IMAGE_REPO='${env.DOCKER_IMAGE_REPO}'. Expected format like 'namespace/repo'.")
                    }
                    if (!deployRepo || !deployRepo.contains('/') || deployRepo in ['true', 'false']) {
                        error("Invalid DEPLOY_IMAGE_REPO='${env.DEPLOY_IMAGE_REPO}'. Expected format like 'namespace/repo'.")
                    }

                    env.DOCKER_IMAGE_REPO = dockerRepo
                    env.DEPLOY_IMAGE_REPO = deployRepo
                    echo "Validated DOCKER_IMAGE_REPO=${env.DOCKER_IMAGE_REPO}"
                    echo "Validated DEPLOY_IMAGE_REPO=${env.DEPLOY_IMAGE_REPO}"
                }
            }
        }

        stage('Build & Push Docker Image') {
            steps {
                script {
                    def imageRepo = env.DOCKER_IMAGE_REPO?.trim()
                    if (!imageRepo || !imageRepo.contains('/')) {
                        error("Invalid DOCKER_IMAGE_REPO='${env.DOCKER_IMAGE_REPO}'. Expected format like 'namespace/repo'.")
                    }
                    def imageTag = env.BUILD_NUMBER ?: 'latest'
                    def buildImage = "${imageRepo}:${imageTag}"
                    echo "Using image repo: ${imageRepo}"
                    echo "Using build image: ${buildImage}"

                    withCredentials([
                        usernamePassword(
                            credentialsId: env.DOCKER_REGISTRY_CREDENTIALS,
                            usernameVariable: 'DOCKERHUB_USER',
                            passwordVariable: 'DOCKERHUB_TOKEN'
                        )
                    ]) {
                        if (env.USE_DOCKER_CLOUD.toBoolean()) {
                            int cloudStatus = sh(
                                returnStatus: true,
                                script: """
                                    set -e
                                    echo "\$DOCKERHUB_TOKEN" | docker login -u "\$DOCKERHUB_USER" --password-stdin

                                    if ! docker buildx version >/dev/null 2>&1; then
                                      mkdir -p ~/.docker/cli-plugins/
                                      BUILDX_URL="\$(curl -s https://raw.githubusercontent.com/docker/actions-toolkit/main/.github/buildx-lab-releases.json | grep -m1 -o 'https://[^"]*linux-amd64[^"]*')"
                                      if [ -z "\$BUILDX_URL" ]; then
                                        echo "Failed to resolve Buildx binary URL" >&2
                                        exit 1
                                      fi
                                      curl -sSL "\$BUILDX_URL" -o ~/.docker/cli-plugins/docker-buildx
                                      chmod +x ~/.docker/cli-plugins/docker-buildx
                                    fi

                                    CLOUD_ENDPOINT="${DOCKER_CLOUD_BUILDER_ENDPOINT}"
                                    CLOUD_BUILDER_NAME="${DOCKER_CLOUD_BUILDER_NAME}"

                                    if [ -z "\$CLOUD_ENDPOINT" ]; then
                                      echo "DOCKER_CLOUD_BUILDER_ENDPOINT is empty" >&2
                                      exit 1
                                    fi

                                    if docker buildx create --help 2>/dev/null | grep -q -- "--name"; then
                                      docker buildx inspect "\$CLOUD_BUILDER_NAME" >/dev/null 2>&1 || \
                                        docker buildx create --name "\$CLOUD_BUILDER_NAME" --use --driver cloud "\$CLOUD_ENDPOINT"
                                    else
                                      CLOUD_BUILDER_NAME="\$(docker buildx inspect "${DOCKER_CLOUD_BUILDER_NAME}" >/dev/null 2>&1 && echo "${DOCKER_CLOUD_BUILDER_NAME}" || docker buildx create --driver cloud "\$CLOUD_ENDPOINT")"
                                      docker buildx use "\$CLOUD_BUILDER_NAME"
                                    fi
                                    docker buildx inspect --bootstrap "\$CLOUD_BUILDER_NAME"

                                    docker buildx build \
                                      --builder "\$CLOUD_BUILDER_NAME" \
                                      --platform linux/amd64,linux/arm64 \
                                      --push \
                                      --file be/Dockerfile \
                                      --tag "${imageRepo}:${imageTag}" \
                                      --tag "${imageRepo}:latest" .
                                """
                            )

                            if (cloudStatus != 0) {
                                echo 'Cloud build failed. Fallback to local build/push.'
                                sh """
                                    set -e
                                    echo "\$DOCKERHUB_TOKEN" | docker login -u "\$DOCKERHUB_USER" --password-stdin
                                    docker build -f be/Dockerfile -t "${imageRepo}:${imageTag}" -t "${imageRepo}:latest" .
                                    docker push "${imageRepo}:${imageTag}"
                                    docker push "${imageRepo}:latest"
                                """
                            }
                        } else {
                            sh """
                                set -e
                                echo "\$DOCKERHUB_TOKEN" | docker login -u "\$DOCKERHUB_USER" --password-stdin
                                docker build -f be/Dockerfile -t "${imageRepo}:${imageTag}" -t "${imageRepo}:latest" .
                                docker push "${imageRepo}:${imageTag}"
                                docker push "${imageRepo}:latest"
                            """
                        }
                    }
                }
            }
        }

        stage('Deploy to Swarm (Robust Rolling Update)') {
            when {
                expression { return env.DEPLOY?.toBoolean() ?: false }
            }
            steps {
                script {
                    def deployRepo = env.DEPLOY_IMAGE_REPO?.trim()
                    def deployTag = env.BUILD_NUMBER ?: 'latest'
                    def resolvedImage = "${deployRepo}:${deployTag}"
                    if (!resolvedImage.contains('/') || !resolvedImage.contains(':') || resolvedImage.startsWith('true') || resolvedImage.contains(':true')) {
                        error("Resolved deploy image is invalid: '${resolvedImage}'")
                    }
                    env.RESOLVED_IMAGE = resolvedImage
                    echo "Deploy stage image: ${resolvedImage}"
                }
                withCredentials([
                    sshUserPrivateKey(credentialsId: env.SSH_CREDENTIALS, keyFileVariable: 'SSH_KEY_FILE')
                ]) {
                    sh '''
                        set -eu

                        echo "[INFO] Preparing VPS deployment directory..."
                        ssh -i "$SSH_KEY_FILE" -o StrictHostKeyChecking=no ${VPS_USER}@${VPS_HOST} "mkdir -p ${VPS_APP_DIR}"

                        echo "[INFO] Copying .env and supervisord config to VPS..."
                        scp -i "$SSH_KEY_FILE" -o StrictHostKeyChecking=no be/.env ${VPS_USER}@${VPS_HOST}:${VPS_APP_DIR}/.env
                        scp -i "$SSH_KEY_FILE" -o StrictHostKeyChecking=no be/supervisord.conf ${VPS_USER}@${VPS_HOST}:${VPS_APP_DIR}/supervisord.conf

                        echo "[INFO] Deploying service with rolling update..."
                        ssh -i "$SSH_KEY_FILE" -o StrictHostKeyChecking=no ${VPS_USER}@${VPS_HOST} \
                          'bash -se' -- "${RESOLVED_IMAGE}" "${STACK_NAME}" "${REPLICAS}" "${NETWORK_NAME}" "${VPS_APP_DIR}" <<'EOSSH'
                            set -eu

                            TARGET_IMAGE="$1"
                            STACK_NAME="$2"
                            REPLICAS="$3"
                            NETWORK_NAME="$4"
                            VPS_APP_DIR="$5"

                            docker swarm init >/dev/null 2>&1 || true

                            if ! docker network inspect "${NETWORK_NAME}" >/dev/null 2>&1; then
                                docker network create --driver overlay --attachable "${NETWORK_NAME}"
                            fi

                            if [ -z "${TARGET_IMAGE}" ]; then
                                echo "[ERROR] TARGET_IMAGE is empty" >&2
                                exit 1
                            fi
                            case "${TARGET_IMAGE}" in
                                true|true:*|*:true)
                                    echo "[ERROR] TARGET_IMAGE resolved to invalid value: ${TARGET_IMAGE}" >&2
                                    exit 1
                                    ;;
                            esac
                            case "${TARGET_IMAGE}" in
                                */*:*)
                                    ;;
                                *)
                                    echo "[ERROR] Unexpected TARGET_IMAGE value: ${TARGET_IMAGE}" >&2
                                    exit 1
                                    ;;
                            esac
                            echo "[INFO] TARGET_IMAGE=${TARGET_IMAGE}"

                            docker pull "${TARGET_IMAGE}"

                            CURRENT_IMAGE="$(docker service inspect "${STACK_NAME}" --format '{{.Spec.TaskTemplate.ContainerSpec.Image}}' 2>/dev/null || true)"
                            if echo "${CURRENT_IMAGE}" | grep -Eq '(^|/)true:latest(@|$)'; then
                                echo "[WARN] Existing service uses invalid image (${CURRENT_IMAGE}). Recreating service..."
                                docker service rm "${STACK_NAME}" || true
                                sleep 3
                            fi

                            if ! docker service inspect "${STACK_NAME}" >/dev/null 2>&1; then
                                echo "[INFO] Creating service ${STACK_NAME}..."
                                docker service create \
                                    --with-registry-auth \
                                    --name "${STACK_NAME}" \
                                    --detach true \
                                    --replicas "${REPLICAS}" \
                                    --network "${NETWORK_NAME}" \
                                    --mount type=bind,src=${VPS_APP_DIR}/.env,dst=/app/.env,ro=true \
                                    --mount type=bind,src=${VPS_APP_DIR}/supervisord.conf,dst=/etc/supervisor/conf.d/supervisord.conf,ro=true \
                                    --health-cmd "python -c 'import socket; s=socket.create_connection((\\\"127.0.0.1\\\",8000),3); s.close()'" \
                                    --health-interval 15s \
                                    --health-timeout 5s \
                                    --health-retries 5 \
                                    --restart-condition any \
                                    --restart-delay 5s \
                                    --restart-max-attempts 5 \
                                    --restart-window 60s \
                                    --update-order start-first \
                                    --update-parallelism 1 \
                                    --update-delay 10s \
                                    --update-monitor 30s \
                                    --update-failure-action rollback \
                                    --rollback-order start-first \
                                    --rollback-parallelism 1 \
                                    --rollback-delay 5s \
                                    "${TARGET_IMAGE}"
                            else
                                echo "[INFO] Updating service ${STACK_NAME}..."
                                docker service update "${STACK_NAME}" \
                                    --with-registry-auth \
                                    --detach true \
                                    --image "${TARGET_IMAGE}" \
                                    --force \
                                    --env-add DUMMY_ROLLOUT_TS="$(date +%s)" \
                                    --network-add "${NETWORK_NAME}" \
                                    --network-rm production_attach \
                                    --publish-rm 8000 \
                                    --restart-condition any \
                                    --restart-delay 5s \
                                    --restart-max-attempts 5 \
                                    --restart-window 60s \
                                    --update-order start-first \
                                    --update-parallelism 1 \
                                    --update-delay 10s \
                                    --update-monitor 30s \
                                    --update-failure-action rollback \
                                    --rollback-order start-first \
                                    --rollback-parallelism 1 \
                                    --rollback-delay 5s || {
                                        echo "[WARN] Primary update command failed. Retrying without network/publish mutation..."
                                        docker service update "${STACK_NAME}" \
                                            --with-registry-auth \
                                            --detach true \
                                            --image "${TARGET_IMAGE}" \
                                            --force \
                                            --env-add DUMMY_ROLLOUT_TS="$(date +%s)" \
                                            --restart-condition any \
                                            --restart-delay 5s \
                                            --restart-max-attempts 5 \
                                            --restart-window 60s \
                                            --update-order start-first \
                                            --update-parallelism 1 \
                                            --update-delay 10s \
                                            --update-monitor 30s \
                                            --update-failure-action rollback \
                                            --rollback-order start-first \
                                            --rollback-parallelism 1 \
                                            --rollback-delay 5s
                                    }
                            fi

                            docker network connect "${NETWORK_NAME}" nginx >/dev/null 2>&1 || true

                            echo "[INFO] Waiting for service to become healthy (max 180s)..."
                            i=0
                            until [ $i -ge 36 ]
                            do
                                RUNNING_COUNT="$(docker service ps "${STACK_NAME}" --filter desired-state=running --format '{{.CurrentState}}' | grep -c '^Running' || true)"
                                if [ "$RUNNING_COUNT" -ge "${REPLICAS}" ]; then
                                    echo "[INFO] Service ${STACK_NAME} is running (${RUNNING_COUNT}/${REPLICAS})."
                                    docker service ps "${STACK_NAME}"
                                    exit 0
                                fi
                                i=$((i+1))
                                sleep 5
                            done

                            echo "[ERROR] Service ${STACK_NAME} is not healthy within timeout."
                            docker service ps "${STACK_NAME}" || true
                            docker service inspect "${STACK_NAME}" || true
                            docker service logs "${STACK_NAME}" --tail 100 || true
                            exit 1
EOSSH
                    '''
                }
            }
        }
    }

    post {
        always {
            echo 'Pipeline finished.'
        }
        success {
            echo 'Build/deploy succeeded.'
        }
        failure {
            echo 'Build/deploy failed.'
        }
    }
}
