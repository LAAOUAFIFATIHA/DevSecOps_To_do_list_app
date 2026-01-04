pipeline {
    agent any

    environment {
        DOCKER_IMAGE_BACKEND = "laaouafifatiha/todo-backend"
        DOCKER_IMAGE_FRONTEND = "laaouafifatiha/todo-frontend"
        // Optional: You can set HOST_IP here if you want it hardcoded in Jenkins
        // HOST_IP = "192.168.176.128"
    }

    stages {
        stage('Checkout Source') {
            steps {
                checkout scm
            }
        }

        stage('Prune Infrastructure') {
            steps {
                script {
                    echo 'Ensuring a clean state for Enterprise Deployment...'
                    sh '''
                        # Stop and remove specific containers by fixed names
                        docker rm -f task_db_container task_api_container task_web_container 2>/dev/null || true
                        
                        # Use compose to down any legacy resources
                        docker-compose down --remove-orphans --volumes || true
                        
                        # System cleanup
                        docker system prune -f
                    '''
                }
            }
        }

        stage('Build & Deploy Enterprise Architecture') {
            steps {
                script {
                    echo 'Building production-grade images and orchestration...'
                    // Building with --no-cache to ensure fresh real-time logic
                    sh "docker-compose up -d --build"
                }
            }
        }

        stage('Post-Deployment Verification') {
            steps {
                script {
                    echo 'Verifying system stability...'
                    sh "docker ps"
                    
                    echo 'Waiting for Backend to initialize (up to 90s)...'
                    sh '''
                        MAX_RETRIES=18
                        i=0
                        while [ $i -lt $MAX_RETRIES ]; do
                            if docker exec task_api_container curl -f -s http://localhost:5000/health > /dev/null; then
                                echo "✅ Backend is healthy and responding!"
                                exit 0
                            fi
                            echo "⏳ Backend not ready yet... waiting ($i/$MAX_RETRIES)"
                            sleep 5
                            i=$((i+1))
                        done
                        
                        echo "❌ Backend failed to start health endpoint within time limit."
                        echo "--- BACKEND LOGS ---"
                        docker logs task_api_container
                        exit 1
                    '''
                    echo 'System is online and healthy.'
                }
            }
        }

        stage('Push Images to Docker Hub') {
            steps {
                script {
                    echo 'Pushing verified images to Docker Hub...'
                    withCredentials([usernamePassword(credentialsId: 'dockerhub-id', passwordVariable: 'DOCKER_PASSWORD', usernameVariable: 'DOCKER_USERNAME')]) {
                        sh '''
                            echo "$DOCKER_PASSWORD" | docker login -u "$DOCKER_USERNAME" --password-stdin
                            
                            echo "Pushing Backend Image..."
                            docker push ${DOCKER_IMAGE_BACKEND}:latest
                            
                            echo "Pushing Frontend Image..."
                            docker push ${DOCKER_IMAGE_FRONTEND}:latest
                            
                            echo "✅ Images successfully pushed to Docker Hub!"
                        '''
                    }
                }
            }
        }
    }

    post {
        success {
            echo '==================================================='
            echo 'DEPLOYMENT SUCCESSFUL'
            echo 'Access Admin at: http://192.168.176.128:3000/admin'
            echo '==================================================='
        }
        failure {
            echo 'Critical Failure during Deployment. Review Docker logs.'
        }
    }
}
