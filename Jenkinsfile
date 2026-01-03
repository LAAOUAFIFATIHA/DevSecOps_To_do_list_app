pipeline {
    agent any

    environment {
        DOCKER_IMAGE_BACKEND = "laaouafifatiha/todo-backend"
        DOCKER_IMAGE_FRONTEND = "laaouafifatiha/todo-frontend"
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Prune Old Data') {
            steps {
                script {
                    echo 'Cleaning up old containers and networks...'
                    sh "docker-compose down --remove-orphans"
                }
            }
        }

        stage('Build and Deploy') {
            steps {
                script {
                    echo 'Building and starting services with Docker Compose...'
                    // We use environment variables in docker-compose.yml
                    // Jenkins automatically provides BUILD_NUMBER
                    sh "docker-compose up -d --build"
                }
            }
        }

        stage('Verify Deployment') {
            steps {
                script {
                    echo 'Waiting for services to stabilize...'
                    sleep 10
                    echo 'Listing running containers...'
                    sh "docker ps"
                    echo 'Component status:'
                    sh "docker-compose ps"
                }
            }
        }
    }

    post {
        success {
            echo 'Pipeline finished successfully. All containers should be running.'
        }
        failure {
            echo 'Pipeline failed. Please check the logs.'
        }
    }
}

