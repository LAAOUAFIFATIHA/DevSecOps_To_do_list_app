import eventlet
eventlet.monkey_patch()

from flask import Flask, jsonify, request
from flask_pymongo import PyMongo
from bson.objectid import ObjectId
from flask_cors import CORS
from flask_socketio import SocketIO, emit, join_room
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
import os
import uuid
import datetime
import socket

def get_local_ip():
    try:
        # Create a dummy socket to detect the local network IP
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:
        return "127.0.0.1"

app = Flask(__name__)

# Config
app.config['MONGO_DBNAME'] = 'tododb'
app.config['MONGO_URI'] = os.environ.get('MONGO_URI', 'mongodb://mongo:27017/tododb')
app.config['JWT_SECRET_KEY'] = os.environ.get('JWT_SECRET_KEY', 'super-secret-key')
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'socket-secret')

mongo = PyMongo(app)
CORS(app, resources={r"/*": {"origins": "*"}})
socketio = SocketIO(app, cors_allowed_origins="*", async_mode='eventlet')
jwt = JWTManager(app)

# Helper to serialize Mongo objects
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
    
    # Hardcoded for demo/exercise purposes - in production use hashed passwords in DB
    if username == "admin" and password == "admin123":
        token = create_access_token(identity=username, expires_delta=datetime.timedelta(hours=24))
        return jsonify(access_token=token), 200
    return jsonify({"msg": "Bad username or password"}), 401

@app.route('/api/config', methods=['GET'])
def get_config():
    server_ip = os.environ.get('SERVER_IP') or get_local_ip()
    return jsonify({
        "server_ip": server_ip,
        "frontend_port": os.environ.get('FRONTEND_PORT', '3000')
    }), 200

# --- STREAM ROUTES ---
@app.route('/api/streams', methods=['POST'])
@jwt_required()
def create_stream():
    data = request.get_json()
    name = data.get('name', 'New Stream')
    stream_id = str(uuid.uuid4())[:8] # Short unique ID
    
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
        "status": "pending", # pending, accepted, refused
        "created_at": datetime.datetime.utcnow()
    }
    result = mongo.db.tasks.insert_one(task)
    task['_id'] = str(result.inserted_id)
    
    # Notify subscribers
    socketio.emit('new_task', serialize_mongo(task), room=stream_id)
    return jsonify(serialize_mongo(task)), 201

@app.route('/api/tasks/<task_id>/vote', methods=['PUT'])
def vote_task(task_id):
    mongo.db.tasks.update_one({"_id": ObjectId(task_id)}, {"$inc": {"votes": 1}})
    task = mongo.db.tasks.find_one({"_id": ObjectId(task_id)})
    socketio.emit('task_updated', serialize_mongo(task), room=task['stream_id'])
    return jsonify(serialize_mongo(task)), 200

# --- ADMIN TASK CONTROLS ---
@app.route('/api/tasks/<task_id>', methods=['DELETE'])
@jwt_required()
def delete_task(task_id):
    task = mongo.db.tasks.find_one({"_id": ObjectId(task_id)})
    if task:
        stream_id = task['stream_id']
        mongo.db.tasks.delete_one({"_id": ObjectId(task_id)})
        socketio.emit('task_deleted', {"task_id": task_id}, room=stream_id)
        return jsonify({"msg": "Task deleted"}), 200
    return jsonify({"msg": "Not found"}), 404

@app.route('/api/tasks/<task_id>/status', methods=['PATCH'])
@jwt_required()
def update_task_status(task_id):
    data = request.get_json()
    status = data.get('status') # accepted, refused
    
    mongo.db.tasks.update_one({"_id": ObjectId(task_id)}, {"$set": {"status": status}})
    task = mongo.db.tasks.find_one({"_id": ObjectId(task_id)})
    socketio.emit('task_updated', serialize_mongo(task), room=task['stream_id'])
    return jsonify(serialize_mongo(task)), 200

# --- SOCKET EVENTS ---
@socketio.on('join')
def on_join(data):
    room = data['room']
    join_room(room)
    print(f"User joined room: {room}")

@app.route('/health', methods=['GET'])
def health():
    return jsonify({"status": "up"}), 200

if __name__ == '__main__':
    socketio.run(app, debug=True, host='0.0.0.0', port=5000)
