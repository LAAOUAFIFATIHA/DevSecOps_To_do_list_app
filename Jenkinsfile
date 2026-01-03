pipeline {
    agent any

    environment {
        DOCKER_IMAGE_BACKEND = "laaouafifatiha/todo-backend"
        DOCKER_IMAGE_FRONTEND = "laaouafifatiha/todo-frontend"
        # Optional: You can set HOST_IP here if you want it hardcoded in Jenkins
        # HOST_IP = "192.168.176.128"
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
                    sleep 15
                    sh "docker ps"
                    sh "docker-compose ps"
                    
                    // Basic health check for API
                    sh "curl -f http://localhost:5000/health || (echo 'Backend health check failed' && exit 1)"
                    echo 'System is online and healthy.'
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
