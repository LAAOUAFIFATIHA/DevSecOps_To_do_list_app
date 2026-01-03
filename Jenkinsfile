pipeline {
    agent any

    environment {
        DOCKER_IMAGE_BACKEND = "my-backend-app"
        DOCKER_IMAGE_FRONTEND = "my-frontend-app"
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Build Backend') {
            steps {
                script {
                    echo 'Building Backend Image...'
                    sh "docker build -t ${DOCKER_IMAGE_BACKEND}:${BUILD_NUMBER} ./backend"
                }
            }
        }

        stage('Build Frontend') {
            steps {
                script {
                    echo 'Building Frontend Image...'
                    sh "docker build -t ${DOCKER_IMAGE_FRONTEND}:${BUILD_NUMBER} ./frontend"
                }
            }
        }

        stage('Test') {
            steps {
                script {
                    echo 'Running Tests...'
                    // Example: sh "docker-compose up -d"
                    // Add your actual test commands here
                }
            }
        }

        stage('Docker Compose Up') {
            steps {
                script {
                    echo 'Starting services with Docker Compose...'
                    sh "docker-compose up -d"
                }
            }
        }
    }

    post {
        always {
            echo 'Cleanup...'
            // sh "docker-compose down"
        }
    }
}
