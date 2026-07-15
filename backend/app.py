import os
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from pymongo import MongoClient
from bson.objectid import ObjectId

app = Flask(__name__, static_folder='../frontend', template_folder='../frontend')
CORS(app)

MONGODB_URI = os.environ.get("MONGODB_URI")

# ─── DB CONNECTION ───────────────────────────────────────────
client = MongoClient(MONGODB_URI)
db = client["cozytasks"]  # explicit database name, works regardless of what's in the URI

users_col = db["users"]
tasks_col = db["tasks"]

def init_db():
    # Enforce unique usernames (equivalent to UNIQUE constraint before)
    users_col.create_index("username", unique=True)

init_db()

# ─── SERVE FRONTEND ──────────────────────────────────────────
@app.route('/')
def index():
    return send_from_directory(app.static_folder, 'login.html')

@app.route('/<path:path>')
def static_files(path):
    return send_from_directory(app.static_folder, path)

# ─── SIGNUP ──────────────────────────────────────────────────
@app.route('/signup', methods=['POST'])
def signup():
    data = request.json
    try:
        users_col.insert_one({
            "username": data['username'],
            "password": data['password']
        })
        return jsonify({"message": "User created"})
    except Exception:
        return jsonify({"error": "Username exists"}), 400

# ─── LOGIN ───────────────────────────────────────────────────
@app.route('/login', methods=['POST'])
def login():
    data = request.json
    user = users_col.find_one({
        "username": data['username'],
        "password": data['password']
    })
    if user:
        return jsonify({"message": "Login success"})
    return jsonify({"error": "Invalid credentials"}), 401

# ─── GET TASKS ───────────────────────────────────────────────
@app.route('/tasks')
def get_tasks():
    username = request.args.get("username")

    def row(r):
        return {
            "id": str(r["_id"]),
            "username": r["username"],
            "task": r["task"],
            "deadline": r["deadline"],
            "completed": r["completed"]
        }

    active = [row(r) for r in tasks_col.find({"username": username, "completed": 0})]
    completed = [row(r) for r in tasks_col.find({"username": username, "completed": 1})]
    return jsonify({"active": active, "completed": completed})

# ─── ADD TASK ────────────────────────────────────────────────
@app.route('/add', methods=['POST'])
def add_task():
    data = request.json
    tasks_col.insert_one({
        "username": data['username'],
        "task": data['task'],
        "deadline": data['deadline'],
        "completed": 0
    })
    return jsonify({"message": "Added"})

# ─── COMPLETE TASK ───────────────────────────────────────────
@app.route('/complete', methods=['POST'])
def complete():
    task_id = request.json['id']
    tasks_col.update_one({"_id": ObjectId(task_id)}, {"$set": {"completed": 1}})
    return jsonify({"message": "Done"})

# ─── DELETE TASK ─────────────────────────────────────────────
@app.route('/delete', methods=['POST'])
def delete():
    task_id = request.json['id']
    tasks_col.delete_one({"_id": ObjectId(task_id)})
    return jsonify({"message": "Deleted"})

if __name__ == "__main__":
    app.run(debug=True)
