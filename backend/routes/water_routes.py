"""Water intake tracking API routes."""

from flask import Blueprint, jsonify, request, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from bson import ObjectId
from datetime import datetime, timezone, timedelta

water_bp = Blueprint('water', __name__, url_prefix='/api/water')


@water_bp.route('/log', methods=['POST'])
@jwt_required()
def log_water():
    """Log a water intake entry."""
    db = current_app.config['db']
    user_id = get_jwt_identity()
    data = request.get_json()

    amount_ml = data.get('amount_ml', 250)
    if amount_ml <= 0 or amount_ml > 5000:
        return jsonify({"error": "Invalid amount"}), 400

    now = datetime.now(timezone.utc)
    entry = {
        "user_id": user_id,
        "amount_ml": amount_ml,
        "logged_at": now,
        "date": now.strftime("%Y-%m-%d")
    }

    db.water_logs.insert_one(entry)

    # Fetch updated daily total
    today = now.strftime("%Y-%m-%d")
    pipeline = [
        {"$match": {"user_id": user_id, "date": today}},
        {"$group": {"_id": None, "total": {"$sum": "$amount_ml"}, "count": {"$sum": 1}}}
    ]
    result = list(db.water_logs.aggregate(pipeline))
    daily_total = result[0]["total"] if result else amount_ml
    daily_count = result[0]["count"] if result else 1

    # Get user's water goal
    user = db.users.find_one({"_id": ObjectId(user_id)})
    water_goal = user.get("water_goal_ml", 2500) if user else 2500

    return jsonify({
        "message": "Water logged!",
        "amount_ml": amount_ml,
        "daily_total_ml": daily_total,
        "daily_count": daily_count,
        "goal_ml": water_goal,
        "progress": round(min(daily_total / water_goal * 100, 100), 1)
    }), 201


@water_bp.route('/today', methods=['GET'])
@jwt_required()
def get_today_water():
    """Get today's water intake summary + logs."""
    db = current_app.config['db']
    user_id = get_jwt_identity()
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")

    # Get individual logs
    logs = list(db.water_logs.find(
        {"user_id": user_id, "date": today},
        {"_id": 0, "amount_ml": 1, "logged_at": 1}
    ).sort("logged_at", -1))

    # Convert datetime to string for JSON
    for log in logs:
        log["logged_at"] = log["logged_at"].isoformat()

    # Get total
    pipeline = [
        {"$match": {"user_id": user_id, "date": today}},
        {"$group": {"_id": None, "total": {"$sum": "$amount_ml"}, "count": {"$sum": 1}}}
    ]
    result = list(db.water_logs.aggregate(pipeline))

    # Get user's water goal (default 2500ml)
    user = db.users.find_one({"_id": ObjectId(user_id)})
    water_goal = user.get("water_goal_ml", 2500) if user else 2500

    daily_total = result[0]["total"] if result else 0
    daily_count = result[0]["count"] if result else 0

    return jsonify({
        "date": today,
        "total_ml": daily_total,
        "goal_ml": water_goal,
        "count": daily_count,
        "progress": round(min(daily_total / water_goal * 100, 100), 1) if water_goal > 0 else 0,
        "logs": logs
    }), 200


@water_bp.route('/history', methods=['GET'])
@jwt_required()
def get_water_history():
    """Get water intake history for the last N days."""
    db = current_app.config['db']
    user_id = get_jwt_identity()

    days = int(request.args.get('days', 7))
    start_date = (datetime.now(timezone.utc) - timedelta(days=days)).strftime("%Y-%m-%d")

    pipeline = [
        {"$match": {"user_id": user_id, "date": {"$gte": start_date}}},
        {"$group": {"_id": "$date", "total": {"$sum": "$amount_ml"}, "count": {"$sum": 1}}},
        {"$sort": {"_id": -1}}
    ]
    result = list(db.water_logs.aggregate(pipeline))

    history = [{"date": r["_id"], "total_ml": r["total"], "count": r["count"]} for r in result]

    return jsonify({"history": history}), 200


@water_bp.route('/goal', methods=['PUT'])
@jwt_required()
def set_water_goal():
    """Set daily water intake goal."""
    db = current_app.config['db']
    user_id = get_jwt_identity()
    data = request.get_json()

    goal_ml = data.get('goal_ml', 2500)
    if goal_ml < 500 or goal_ml > 10000:
        return jsonify({"error": "Goal must be between 500ml and 10000ml"}), 400

    db.users.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": {"water_goal_ml": goal_ml, "updated_at": datetime.now(timezone.utc)}}
    )

    return jsonify({"message": "Water goal updated", "goal_ml": goal_ml}), 200
