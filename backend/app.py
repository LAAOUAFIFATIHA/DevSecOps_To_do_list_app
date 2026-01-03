import eventlet
eventlet.monkey_patch()

from flask import Flask, jsonify, request
from flask_pymongo import PyMongo
from bson.objectid import ObjectId
from flask_cors import CORS
from flask_socketio import SocketIO, emit, join_room, leave_room
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
import os
import uuid
import datetime
import socket
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def get_local_ip():
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception as e:
        logger.error(f"Error detecting local IP: {e}")
        return "127.0.0.1"

@app.errorhandler(Exception)
def handle_error(e):
    logger.error(f'Server Error: {str(e)}')
    return jsonify({'error': str(e)}), 500

app = Flask(__name__)

# Config
app.config['MONGO_DBNAME'] = 'tododb'
app.config['MONGO_URI'] = os.environ.get('MONGO_URI', 'mongodb://mongo:27017/tododb')
app.config['JWT_SECRET_KEY'] = os.environ.get('JWT_SECRET_KEY', 'super-secret-key')
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'socket-secret')

mongo = PyMongo(app)
CORS(app, resources={r"/*": {"origins": "*"}})
socketio = SocketIO(app, cors_allowed_origins="*", async_mode='eventlet', logger=True, engineio_logger=True)
jwt = JWTManager(app)

def serialize_mongo(obj):
    if isinstance(obj, list):
        return [serialize_mongo(i) for i in obj]
    if isinstance(obj, dict):
        new_dict = {}
        for k, v in obj.items():
            if k == '_id':
                new_dict[k] = str(v)
            else:
                new_dict[k] = serialize_mongo(v)
        return new_dict
    return obj

# --- AUTH ROUTES ---
@app.route('/api/admin/login', methods=['POST'])
def admin_login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    
    if username == "admin" and password == "admin123":
        token = create_access_token(identity=username, expires_delta=datetime.timedelta(hours=24))
        return jsonify(access_token=token), 200
    return jsonify({"msg": "Bad username or password"}), 401

@app.route('/api/config', methods=['GET'])
def get_config():
    frontend_url = os.environ.get('FRONTEND_URL')
    if not frontend_url:
        ip = os.environ.get('SERVER_IP') or get_local_ip()
        port = os.environ.get('FRONTEND_PORT', '3000')
        frontend_url = f"http://{ip}:{port}"
    
    return jsonify({
        "frontend_url": frontend_url,
        "backend_url": os.environ.get('BACKEND_URL', frontend_url)
    }), 200

# --- STREAM ROUTES ---
@app.route('/api/streams', methods=['POST'])
@jwt_required()
def create_stream():
    data = request.get_json()
    name = data.get('name', 'New Stream')
    stream_id = str(uuid.uuid4())[:8]
    
    stream = {
        "stream_id": stream_id,
        "name": name,
        "created_at": datetime.datetime.utcnow(),
        "active": True
    }
    mongo.db.streams.insert_one(stream)
    return jsonify(serialize_mongo(stream)), 201

@app.route('/api/streams', methods=['GET'])
@jwt_required()
def get_all_streams():
    streams = list(mongo.db.streams.find().sort("created_at", -1))
    return jsonify(serialize_mongo(streams)), 200

@app.route('/api/streams/<stream_id>', methods=['GET'])
def get_stream_details(stream_id):
    stream = mongo.db.streams.find_one_or_404({"stream_id": stream_id})
    tasks = list(mongo.db.tasks.find({"stream_id": stream_id}).sort("votes", -1))
    return jsonify({
        "stream": serialize_mongo(stream),
        "tasks": serialize_mongo(tasks)
    }), 200

# --- TASK ROUTES ---
@app.route('/api/streams/<stream_id>/task', methods=['POST'])
def add_task_to_stream(stream_id):
    data = request.get_json()
    name = data.get('name', 'Anonymous')
    description = data.get('description')
    
    if not description:
        return jsonify({"error": "Description required"}), 400
    
    task = {
        "stream_id": stream_id,
        "user_name": name,
        "description": description,
        "votes": 0,
        "status": "pending",
        "created_at": datetime.datetime.utcnow()
    }
    result = mongo.db.tasks.insert_one(task)
    task['_id'] = str(result.inserted_id)
    
    # EMIT TO ROOM
    logger.info(f"Broadcasting new task in room {stream_id}")
    socketio.emit('new_task', serialize_mongo(task), room=stream_id)
    return jsonify(serialize_mongo(task)), 201

@app.route('/api/tasks/<task_id>/vote', methods=['PUT'])
def vote_task(task_id):
    mongo.db.tasks.update_one({"_id": ObjectId(task_id)}, {"$inc": {"votes": 1}})
    task = mongo.db.tasks.find_one({"_id": ObjectId(task_id)})
    if task:
        logger.info(f"Broadcasting task update in room {task['stream_id']}")
        socketio.emit('task_updated', serialize_mongo(task), room=task['stream_id'])
        return jsonify(serialize_mongo(task)), 200
    return jsonify({"msg": "Not found"}), 404

# --- ADMIN TASK CONTROLS (Protected by JWT) ---
@app.route('/api/tasks/<task_id>', methods=['DELETE'])
@jwt_required()
def delete_task(task_id):
    task = mongo.db.tasks.find_one({"_id": ObjectId(task_id)})
    if task:
        stream_id = task['stream_id']
        mongo.db.tasks.delete_one({"_id": ObjectId(task_id)})
        logger.info(f"Broadcasting task deletion in room {stream_id}")
        socketio.emit('task_deleted', {"task_id": task_id}, room=stream_id)
        return jsonify({"msg": "Task deleted"}), 200
    return jsonify({"msg": "Not found"}), 404

@app.route('/api/tasks/<task_id>/status', methods=['PATCH'])
@jwt_required()
def update_task_status(task_id):
    data = request.get_json()
    status = data.get('status')
    
    mongo.db.tasks.update_one({"_id": ObjectId(task_id)}, {"$set": {"status": status}})
    task = mongo.db.tasks.find_one({"_id": ObjectId(task_id)})
    if task:
        logger.info(f"Broadcasting task status update in room {task['stream_id']}")
        socketio.emit('task_updated', serialize_mongo(task), room=task['stream_id'])
        return jsonify(serialize_mongo(task)), 200
    return jsonify({"msg": "Not found"}), 404

# --- SOCKET EVENTS ---
@socketio.on('join')
def on_join(data):
    room = data.get('room')
    if room:
        join_room(room)
        logger.info(f"SOCKET: Client joined room {room}")
        emit('status', {'msg': f'Joined room {room}'})

@socketio.on('leave')
def on_leave(data):
    room = data.get('room')
    if room:
        leave_room(room)
        logger.info(f"SOCKET: Client left room {room}")

@app.route('/health', methods=['GET'])
def health():
    try:
        # Check DB connection
        mongo.cx.admin.command('ping')
        return jsonify({'status': 'healthy', 'db': 'connected'}), 200
    except Exception as e:
        return jsonify({'status': 'degraded', 'error': str(e)}), 500

if __name__ == '__main__':
    try:
        # Use standard run with eventlet
        logger.info("Initializing Enterprise Backend...")
        
        # Retry logic for MongoDB connection (TCP Check)
        import time
        import socket
        
        logger.info(f"Connecting to MongoDB at mongo:27017...")
        max_retries = 30
        for i in range(max_retries):
            try:
                s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
                s.settimeout(2)
                s.connect(('mongo', 27017))
                s.close()
                logger.info("MongoDB TCP connection successful!")
                break
            except Exception as e:
                logger.warning(f"Waiting for MongoDB TCP... ({i+1}/{max_retries})")
                time.sleep(2)
        else:
             logger.error("Could not connect to MongoDB port after multiple retries.")
             # Continue anyway, PyMongo might recover later
             
        logger.info("Starting Flask-SocketIO Server on 0.0.0.0:5000")
        socketio.run(app, debug=False, host='0.0.0.0', port=5000)
    except Exception as e:
        logger.critical(f"FATAL ERROR ON STARTUP: {str(e)}")
        import traceback
        traceback.print_exc()
