pipeline {
    agent any

    environment {
        DOCKER_IMAGE_BACKEND = "laaouafifatiha/todo-backend-enhanced"
        DOCKER_IMAGE_FRONTEND = "laaouafifatiha/todo-frontend-enhanced"
        BUILD_TAG = "${env.BUILD_NUMBER}"
    }

    stages {
        stage('Checkout Source') {
            steps {
                checkout scm
            }
        }

        stage('Backup Current Version') {
            steps {
                script {
                    echo "Creating backup of current stable version..."
                    // Attempt to tag the running 'latest' images as 'backup'
                    // This creates a restore point. || true prevents failure on first run.
                    sh '''
                        if docker image inspect ${DOCKER_IMAGE_BACKEND}:latest >/dev/null 2>&1; then
                            docker tag ${DOCKER_IMAGE_BACKEND}:latest ${DOCKER_IMAGE_BACKEND}:backup
                            echo "✅ Backend backup created."
                        else
                            echo "⚠️ No existing backend image found (First run?). Skipping backup."
                        fi

                        if docker image inspect ${DOCKER_IMAGE_FRONTEND}:latest >/dev/null 2>&1; then
                            docker tag ${DOCKER_IMAGE_FRONTEND}:latest ${DOCKER_IMAGE_FRONTEND}:backup
                            echo "✅ Frontend backup created."
                        else
                            echo "⚠️ No existing frontend image found (First run?). Skipping backup."
                        fi
                    '''
                }
            }
        }

        stage('Build New Version') {
            steps {
                script {
                    echo "Building new version (Build #${env.BUILD_NUMBER})..."
                    // Build new images (updates 'latest' locally)
                    sh "docker-compose build"
                    
                    // Tag images with unique build number
                    sh "docker tag ${DOCKER_IMAGE_BACKEND}:latest ${DOCKER_IMAGE_BACKEND}:${BUILD_TAG}"
                    sh "docker tag ${DOCKER_IMAGE_FRONTEND}:latest ${DOCKER_IMAGE_FRONTEND}:${BUILD_TAG}"
                }
            }
        }

        stage('Test New Version (With Rollback)') {
            steps {
                script {
                    try {
                        echo "🚀 Deploying new version for testing..."
                        
                        // Force cleanup of any existing containers to prevent name conflicts
                        sh '''
                            echo "Cleaning up existing containers..."
                            docker-compose down -v 2>/dev/null || true
                            
                            # Force remove containers by name if they still exist
                            docker rm -f task_db_container task_api_container task_web_container 2>/dev/null || true
                            
                            echo "✅ Cleanup complete."
                        '''
                        
                        // Start new containers
                        sh "docker-compose up -d --remove-orphans"
                        
                        echo "⏳ Waiting 20s for services to stabilize..."
                        sleep 20

                        // Comprehensive Health Checks
                        sh '''
                            echo "Running System Health Checks..."
                            
                            # Check 1: Verify Containers are running
                            if [ $(docker ps -q -f name=task_api_container | wc -l) -eq 0 ]; then
                                echo "❌ CRITICAL: Backend container failed to start."
                                exit 1
                            fi
                            if [ $(docker ps -q -f name=task_web_container | wc -l) -eq 0 ]; then
                                echo "❌ CRITICAL: Frontend container failed to start."
                                exit 1
                            fi

                            # Check 2: Backend Health Endpoint
                            echo "Testing Backend API..."
                            MAX_RETRIES=5
                            i=0
                            backend_ready=false
                            while [ $i -lt $MAX_RETRIES ]; do
                                if docker exec task_api_container curl -f -s http://localhost:5000/health > /dev/null; then
                                    echo "✅ Backend is healthy."
                                    backend_ready=true
                                    break
                                fi
                                echo "Waiting for backend... ($i/$MAX_RETRIES)"
                                sleep 5
                                i=$((i+1))
                            done
                            
                            if [ "$backend_ready" = false ]; then
                                echo "❌ Backend health check FAILED."
                                exit 1
                            fi

                            # Check 3: Frontend Accessibility
                            echo "Testing Frontend Access..."
                            if curl -f -s http://localhost:3000 > /dev/null; then
                                echo "✅ Frontend is accessible."
                            else
                                echo "❌ Frontend accessibility check FAILED."
                                exit 1
                            fi
                        '''
                        echo "✅ ALL TESTS PASSED. Version ${env.BUILD_NUMBER} is live."
                    } catch (Exception e) {
                        echo "🔴 DEPLOYMENT FAILED! INITIATING AUTOMATIC ROLLBACK..."
                        
                        // AUTOMATIC ROLLBACK STEPS
                        sh '''
                            echo "---------------------------------------------------"
                            echo "🔄 ROLLBACK SEQUENCE STARTED"
                            echo "---------------------------------------------------"
                            
                            # 1. Stop the failed containers
                            echo "Stopping failed deployment..."
                            docker-compose down -v 2>/dev/null || true
                            
                            # Force remove containers by name if they still exist
                            docker rm -f task_db_container task_api_container task_web_container 2>/dev/null || true
                            
                            # 2. Restore backup tags
                            echo "Restoring previous stable images..."
                            if docker image inspect ${DOCKER_IMAGE_BACKEND}:backup >/dev/null 2>&1; then
                                docker tag ${DOCKER_IMAGE_BACKEND}:backup ${DOCKER_IMAGE_BACKEND}:latest
                            fi
                            if docker image inspect ${DOCKER_IMAGE_FRONTEND}:backup >/dev/null 2>&1; then
                                docker tag ${DOCKER_IMAGE_FRONTEND}:backup ${DOCKER_IMAGE_FRONTEND}:latest
                            fi
                            
                            # 3. Restart previous version
                            echo "Restarting previous stable version..."
                            docker-compose up -d
                            
                            echo "Verifying rollback status..."
                            sleep 10
                            if docker exec task_api_container curl -f -s http://localhost:5000/health > /dev/null; then
                                echo "✅ ROLLBACK SUCCESSFUL: System restored to previous stable state."
                            else
                                echo "❌ ROLLBACK WARNING: System restored but health check failed. Manual intervention required."
                            fi
                        '''
                        
                        // Fail the build in Jenkins so needed attention is drawn
                        currentBuild.result = 'FAILURE'
                        error("Deployment failed and was automatically rolled back.")
                    }
                }
            }
        }

        stage('Push to Docker Hub') {
            when {
                expression { currentBuild.result == null || currentBuild.result == 'SUCCESS' }
            }
            steps {
                script {
                    echo 'Pushing verified images to Docker Hub...'
                    withCredentials([usernamePassword(credentialsId: 'dockerhub-id', passwordVariable: 'DOCKER_PASSWORD', usernameVariable: 'DOCKER_USERNAME')]) {
                        sh '''
                            echo "$DOCKER_PASSWORD" | docker login -u "$DOCKER_USERNAME" --password-stdin
                            
                            echo "Pushing Version ${BUILD_TAG}..."
                            docker push ${DOCKER_IMAGE_BACKEND}:${BUILD_TAG}
                            docker push ${DOCKER_IMAGE_FRONTEND}:${BUILD_TAG}
                            
                            echo "Pushing Latest..."
                            docker push ${DOCKER_IMAGE_BACKEND}:latest
                            docker push ${DOCKER_IMAGE_FRONTEND}:latest
                        '''
                    }
                }
            }
        }
    }

    post {
        success {
            echo '==================================================='
            echo "✅ DEPLOYMENT SUCCESSFUL: Version ${env.BUILD_NUMBER}"
            echo 'Access at: http://192.168.176.128:3000'
            echo '==================================================='
        }
        failure {
            echo '==================================================='
            echo '🚨 DEPLOYMENT FAILED'
            echo '🔄 System has been automatically rolled back.'
            echo 'Check logs for failure details.'
            echo '==================================================='
        }
    }
}
