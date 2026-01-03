from flask import Flask, jsonify, request
from flask_pymongo import PyMongo
from bson.objectid import ObjectId
from flask_cors import CORS
import os

app = Flask(__name__)

app.config['MONGO_DBNAME'] = 'tododb'
app.config['MONGO_URI'] = os.environ.get('MONGO_URI', 'mongodb://mongo:27017/tododb')

mongo = PyMongo(app)

CORS(app)

@app.route('/health', methods=['GET'])
def health():
    return jsonify({"status": "up"}), 200

@app.route('/api/tasks', methods=['GET'])
def get_all_tasks():
    tasks = mongo.db.tasks
    result = []
    for field in tasks.find():
        result.append({'_id': str(field['_id']), 'title': field['title']})
    return jsonify(result)

@app.route('/api/task', methods=['POST'])
def add_task():
    tasks = mongo.db.tasks 
    data = request.get_json()
    if not data or 'title' not in data:
        return jsonify({'error': 'Title is required'}), 400
    
    title = data['title']
    result = tasks.insert_one({'title': title})
    new_task = tasks.find_one({'_id': result.inserted_id})
    
    return jsonify({'result': {'title': new_task['title'], '_id': str(new_task['_id'])}})

@app.route('/api/task/<id>', methods=['PUT'])
def update_task(id):
    tasks = mongo.db.tasks 
    data = request.get_json()
    if not data or 'title' not in data:
        return jsonify({'error': 'Title is required'}), 400
    
    title = data['title']
    tasks.find_one_and_update({'_id': ObjectId(id)}, {"$set": {"title": title}}, upsert=False)
    new_task = tasks.find_one({'_id': ObjectId(id)})
    
    if new_task:
        return jsonify({'result': {'title': new_task['title'], '_id': str(new_task['_id'])}})
    return jsonify({'error': 'Task not found'}), 404

@app.route('/api/task/<id>', methods=['DELETE'])
def delete_task(id):
    tasks = mongo.db.tasks 
    response = tasks.delete_one({'_id': ObjectId(id)})

    if response.deleted_count == 1:
        result = {'message': 'record deleted'}
    else: 
        result = {'message': 'no record found'}
    
    return jsonify({'result': result})

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0')
