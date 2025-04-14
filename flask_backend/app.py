# app.py
from binascii import Error
from flask import Flask, json, jsonify, request
from flask_cors import CORS
import pymysql.cursors
from datetime import datetime, timedelta
from typing import Optional, Dict, Any, List, Union
import logging
from werkzeug.utils import secure_filename
# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

from pathlib import Path
app = Flask(__name__)
# Configure CORS to allow requests from http://localhost:3000 with credentials
CORS(app, resources={r"/*": {"origins": "*"}}, supports_credentials=True)

import os
from dotenv import load_dotenv
import uuid
import boto3

# Load environment variables from .env file
env_path = Path('.') / '.local.env'
load_dotenv()
# def get_db_connection():
#     return pymysql.connect(
#         host='localhost',  # Your MySQL host
#         port=3306,             # MySQL port
#         user='root',           # MySQL username
#         password='Diamond0606***',  # MySQL password
#         database='lifeapp',    # Database name
#         cursorclass=pymysql.cursors.DictCursor
#     )

# DigitalOcean Spaces Config
DO_SPACES_KEY = os.getenv("DO_SPACES_KEY")
DO_SPACES_SECRET = os.getenv("DO_SPACES_SECRET")
DO_SPACES_REGION = os.getenv("DO_SPACES_REGION")
DO_SPACES_BUCKET = os.getenv("DO_SPACES_BUCKET")
DO_SPACES_ENDPOINT = os.getenv("DO_SPACES_ENDPOINT")

# Initialize Boto3 Client
s3_client = boto3.client(
    "s3",
    endpoint_url=DO_SPACES_ENDPOINT,
    aws_access_key_id=DO_SPACES_KEY,
    aws_secret_access_key=DO_SPACES_SECRET,
)


def get_db_connection():
    host=os.getenv('DB_HOST', 'localhost')
    port=int(os.getenv('DB_PORT', 3306))
    user=os.getenv('DB_USERNAME', 'root')
    password=os.getenv('DB_PASSWORD', '')
    database=os.getenv('DB_DATABASE', 'lifeapp')
    # print(host,port,user,password,database)
    return pymysql.connect(
        host = host,  # Fallback to 'localhost'
        port = port,     # Fallback to 3306
        user = user,        # Fallback to 'root'
        password=password,    # Fallback to empty
        database=database,
        cursorclass=pymysql.cursors.DictCursor
    )

# def get_db_connection():
#     return pymysql.connect(
#         host=os.getenv('DB_HOST', 'localhost'),
#         port=int(os.getenv('DB_PORT', 3306)),
#         user=os.getenv('DB_USERNAME', 'root'),
#         password=os.getenv('DB_PASSWORD', ''),
#         database=os.getenv('DB_DATABASE', 'lifeapp'),
#         cursorclass=pymysql.cursors.DictCursor
#     )


@app.route('/debug-env', methods = ['GET'])
def debug_env():
    host = os.getenv('DB_HOST')
    user = os.getenv('DB_USERNAME')
    password = os.getenv('DB_PASSWORD')
    return jsonify({
        'host': host,
        'user': user,
        'password': password
    })

@app.route('/')
def backup():
    return "Heya, thanks for checking"

@app.route('/api/user-type-chart',methods = ['GET'])
def get_user_type_fetch():
    try:
        connection = get_db_connection()
        with connection.cursor() as cursor:
            # Execute the SQL query
            sql = """
                select count(*) as count,
                case 
                when type = 1
                    then 'Admin'
                when type = 3
                    then 'Student'
                when type = 5
                    then 'Teacher'
                when type = 4
                    then 'Mentor'
                else 'Default'
                end as
                userType from lifeapp.users group by type;
            """
            cursor.execute(sql)
            result = cursor.fetchall()
        return jsonify(result)
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        connection.close()
@app.route('/api/user-signups', methods=['GET'])
def get_user_signups():
    try:
        connection = get_db_connection()
        with connection.cursor() as cursor:
            # Execute the SQL query
            sql = """
                SELECT 
                    DATE_FORMAT(created_at, '%Y-%m') AS month,
                    COUNT(*) AS count 
                FROM lifeapp.users 
                GROUP BY month
                HAVING month is not null
                ORDER BY month
            """
            cursor.execute(sql)
            result = cursor.fetchall()
        return jsonify(result)
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        connection.close()

def execute_query(query: str, params: tuple = None) -> List[Dict[str, Any]]:
    """
    Execute a database query and return results.
    
    Args:
        query (str): SQL query to execute
        params (tuple, optional): Query parameters
        
    Returns:
        List[Dict[str, Any]]: Query results
    """
    connection = None
    try:
        connection = get_db_connection()
        with connection.cursor() as cursor:
            cursor.execute(query, params or ())
            return cursor.fetchall()
    except Exception as e:
        logger.error(f"Query execution error: {str(e)}")
        raise
    finally:
        if connection:
            connection.close()
@app.route('/api/signing-user', methods=['POST'])
def get_user_signups2():
    """
    Get user signup statistics grouped by different time periods.
    Query parameters:
        grouping: str - Time grouping (daily, weekly, monthly, quarterly, yearly, lifetime)
        start_date: str - Start date for filtering (YYYY-MM-DD)
        end_date: str - End date for filtering (YYYY-MM-DD)
    """
    try:
        filters = request.get_json() or {}
        grouping = filters.get('grouping', 'monthly')
        start_date = filters.get('start_date')
        end_date = filters.get('end_date')

        # Base query with date filtering
        base_query = """
            SELECT 
                {date_format} AS period,
                COUNT(*) AS count,
                CASE 
                    WHEN `type` = 1 THEN 'Admin'
                    WHEN `type` = 3 THEN 'Student'
                    WHEN `type` = 4 THEN 'Mentor'
                    WHEN `type` = 5 THEN 'Teacher'
                    ELSE 'Unspecified'
                END AS user_type 
            FROM lifeapp.users 
            WHERE 1=1
        """
        params = []

        # Add date range filters if provided
        if start_date:
            base_query += " AND created_at >= %s"
            params.append(start_date)
        if end_date:
            base_query += " AND created_at <= %s"
            params.append(end_date)

        # Define date format based on grouping
        date_formats = {
            'daily': "DATE_FORMAT(created_at, '%%Y-%%m-%%d')",
            'weekly': "DATE_FORMAT(created_at, '%%Y-%%u')",  # ISO week number
            'monthly': "DATE_FORMAT(created_at, '%%Y-%%m')",
            'quarterly': "CONCAT(YEAR(created_at), '-Q', QUARTER(created_at))",
            'yearly': "YEAR(created_at)",
            'lifetime': "'Lifetime'"
        }

        if grouping not in date_formats:
            return jsonify({"error": "Invalid grouping parameter"}), 400

        # Format query with appropriate date format
        query = base_query.format(date_format=date_formats[grouping])
        
        # Add grouping and ordering
        if grouping != 'lifetime':
            query += f" GROUP BY period, user_type HAVING period IS NOT NULL ORDER BY period"
        else:
            query += " GROUP BY period, user_type"

        result = execute_query(query, tuple(params))

        # Add additional metadata for better client-side handling
        response = {
            "data": result,
            "grouping": grouping,
            "start_date": start_date,
            "end_date": end_date,
            "total_count": sum(row['count'] for row in result)
        }

        return jsonify(response)
    except Exception as e:
        logger.error(f"Error in get_user_signups: {str(e)}")
        return jsonify({"error": str(e)}), 500
    
@app.route('/api/mission-status-graph', methods=['POST'])
def get_mission_status_graph():
    """
    Get mission completion statistics grouped by period and status.
    """
    try:
        filters = request.get_json() or {}
        grouping = filters.get('grouping', 'monthly')
        start_date = filters.get('start_date')
        end_date = filters.get('end_date')

        # Define date format based on grouping
        date_formats = {
            'daily': "DATE_FORMAT(created_at, '%%Y-%%m-%%d')",
            'weekly': "CONCAT(YEAR(created_at), '-', WEEK(created_at))",
            'monthly': "DATE_FORMAT(created_at, '%%Y-%%m')",
            'quarterly': "CONCAT(YEAR(created_at), '-Q', QUARTER(created_at))",
            'yearly': "CAST(YEAR(created_at) AS CHAR)",
            'lifetime': "'Lifetime'"
        }

        if grouping not in date_formats:
            return jsonify({"error": "Invalid grouping parameter"}), 400

        date_format = date_formats[grouping]

        # SQL Query for mission status breakdown
        query = f"""
            SELECT 
                {date_format} AS period,
                COUNT(*) AS count,
                CASE 
                    WHEN approved_at IS NULL AND rejected_at IS NULL THEN 'Mission Requested'
                    WHEN approved_at IS NULL AND rejected_at IS NOT NULL THEN 'Mission Rejected'
                    WHEN approved_at IS NOT NULL THEN 'Mission Approved'
                END AS mission_status
            FROM lifeapp.la_mission_completes
            WHERE 1=1
        """

        # Apply date filtering if provided
        if start_date:
            query += f" AND created_at >= '{start_date}'"
        if end_date:
            query += f" AND created_at <= '{end_date}'"

        query += """
            GROUP BY period, mission_status
            HAVING period IS NOT NULL
            ORDER BY period
        """

        result = execute_query(query)

        return jsonify({"data": result, "grouping": grouping})
    except Exception as e:
        logger.error(f"Error in get_mission_status: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/new-signups', methods=['GET'])
def get_new_signups():
    try:
        connection = get_db_connection()
        with connection.cursor() as cursor:
            # Execute the SQL query
            sql = """
                SELECT 
                    DATE_FORMAT(created_at, '%Y-%m') AS month,
                    COUNT(*) AS count 
                FROM lifeapp.users 
                GROUP BY month
                HAVING month is not null
                ORDER BY month DESC
                LIMIT 1
            """
            cursor.execute(sql)
            result = cursor.fetchall()
        return jsonify(result)
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        connection.close()

@app.route('/api/user-count', methods=['GET'])
def get_user_count():
    try:
        connection = get_db_connection()
        with connection.cursor() as cursor:
            # Execute the SQL query
            sql = """
                SELECT count(*) as count from lifeapp.users
            """
            cursor.execute(sql)
            result = cursor.fetchall()
        return jsonify(result)
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        connection.close()

@app.route('/api/active-user-count', methods = ['GET'])
def get_active_user_count():
    try:
        connection = get_db_connection()
        with connection.cursor() as cursor:
            #execute sql query
            sql = """
                SELECT COUNT(DISTINCT user_id) AS active_users
                    FROM lifeapp.la_mission_completes
                    WHERE points > 0 OR approved_at IS NOT NULL;
                """
            cursor.execute(sql)
            result = cursor.fetchall()
        return jsonify(result)
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        connection.close()


@app.route('/api/approval-rate', methods= ['GET'])
def get_approval_rate():
    try:
        connection = get_db_connection()
        with connection.cursor() as cursor:
            #execute sql query
            sql = """
            select round(sum(case 
                            when approved_at is null
                             then 0 
                            else 1 
                        end)/count(*) * 100,2) 
            as Approval_Rate from lifeapp.la_mission_completes;

            """
            cursor.execute(sql)
            result = cursor.fetchall()
        return jsonify(result)
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        connection.close()


@app.route('/api/count-school-state', methods= ['GET'])
def get_count_school_rate():
    connection = get_db_connection()
    try:
       
        with connection.cursor() as cursor:
            #execute sql query
            sql = """
            select state, count(*) as count_state from lifeapp.schools 
            where state != 'null' and state != '2' group by state order by count_state desc limit 5;
            """
            cursor.execute(sql)
            result = cursor.fetchall()
        return jsonify(result)
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        connection.close()

@app.route('/api/teacher-assign-count', methods= ['GET'])
def get_teacher_assign_count():
    try:
        connection = get_db_connection()
        with connection.cursor() as cursor:
            #execute sql query
            sql = """
            select teacher_id, count(*) as assign_count from lifeapp.la_mission_assigns group by teacher_id;
            """
            cursor.execute(sql)
            result = cursor.fetchall()
        return jsonify(result)
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        connection.close()

@app.route('/api/coupons-used-count', methods=['GET'])
def get_coupons_used_count():
    try:
        connection = get_db_connection()
        with connection.cursor() as cursor:
            sql = """
            select -amount as amount, count(*) as coupon_count from lifeapp.coin_transactions group by coinable_type,amount having amount < 0 order by amount asc ;
            """
            cursor.execute(sql)
            result = cursor.fetchall()
            print("Query Result:", result)  # Debugging statement
        return jsonify(result)
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        connection.close()

@app.route('/api/histogram_level_subject_challenges_complete', methods=['POST'])
def get_histogram_data_level_subject_challenges_complete():
    """
    Returns data for a histogram that shows mission completes grouped by period,
    subject, and level.
    Accepts a JSON payload with a "grouping" key. Allowed values:
      daily, weekly, monthly, quarterly, yearly, lifetime.
    """
    try:
        data = request.get_json() or {}
        grouping = data.get('grouping', 'monthly').lower()
        allowed_groupings = ['daily', 'weekly', 'monthly', 'quarterly', 'yearly', 'lifetime']
        if grouping not in allowed_groupings:
            grouping = 'monthly'

        # Construct the period expression based on the grouping
        if grouping == 'daily':
            period_expr = "DATE(lamc.created_at)"
        elif grouping == 'weekly':
            period_expr = "CONCAT(YEAR(lamc.created_at), '-W', WEEK(lamc.created_at, 1))"
        elif grouping == 'monthly':
            period_expr = "DATE_FORMAT(lamc.created_at, '%Y-%m')"
        elif grouping == 'quarterly':
            period_expr = "CONCAT(YEAR(lamc.created_at), '-Q', QUARTER(lamc.created_at))"
        elif grouping == 'yearly':
            period_expr = "YEAR(lamc.created_at)"
        else:  # lifetime
            period_expr = "'lifetime'"

        connection = get_db_connection()
        with connection.cursor() as cursor:
            sql = f"""
                SELECT 
                    {period_expr} AS period,
                    COUNT(*) AS count, 
                    las.title AS subject_title, 
                    lal.title AS level_title
                FROM lifeapp.la_mission_completes lamc 
                INNER JOIN lifeapp.la_missions lam ON lam.id = lamc.la_mission_id
                INNER JOIN lifeapp.la_subjects las ON lam.la_subject_id = las.id
                INNER JOIN lifeapp.la_levels lal ON lam.la_level_id = lal.id
                GROUP BY period, lam.la_subject_id, lam.la_level_id
                ORDER BY period, lam.la_subject_id, lam.la_level_id;
            """
            cursor.execute(sql)
            results = cursor.fetchall()
        return jsonify(results), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        connection.close()

@app.route('/api/histogram_topic_level_subject_quizgames', methods=['POST'])
def get_histogram_topic_level_subject_quizgames():
    try:
        connection = get_db_connection()
        with connection.cursor() as cursor:
            sql = """
                SELECT 
                    COUNT(*) AS count,
                    las.title AS subject_title,
                    lal.title AS level_title
                FROM lifeapp.la_quiz_games laqg
                INNER JOIN lifeapp.la_subjects las ON laqg.la_subject_id = las.id
                INNER JOIN lifeapp.la_topics lat ON lat.id = laqg.la_topic_id
                INNER JOIN lifeapp.la_levels lal ON lat.la_level_id = lal.id  -- use topic’s level
                WHERE las.status = 1
                GROUP BY laqg.la_subject_id, lat.la_level_id
                ORDER BY las.title, lal.title;
                """

            cursor.execute(sql)
            result = cursor.fetchall()
        return jsonify(result)
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        connection.close()

@app.route('/api/histogram_topic_level_subject_quizgames_2', methods=['POST'])
def get_histogram_topic_level_subject_quizgames_2():
    connection = None
    try:
        data = request.get_json() or {}
        grouping = data.get('grouping', 'monthly').lower()
        allowed_groupings = ['daily', 'weekly', 'monthly', 'quarterly', 'yearly', 'lifetime']
        if grouping not in allowed_groupings:
            grouping = 'monthly'
        
        # Build the period expression using completed_at
        if grouping == 'daily':
            period_expr = "DATE(laqg.completed_at)"
        elif grouping == 'weekly':
            period_expr = "CONCAT(YEAR(laqg.completed_at), '-W', WEEK(laqg.completed_at, 1))"
        elif grouping == 'monthly':
            period_expr = "DATE_FORMAT(laqg.completed_at, '%Y-%m')"
        elif grouping == 'quarterly':
            period_expr = "CONCAT(YEAR(laqg.completed_at), '-Q', QUARTER(laqg.completed_at))"
        elif grouping == 'yearly':
            period_expr = "YEAR(laqg.completed_at)"
        else:
            period_expr = "'lifetime'"
        
        connection = get_db_connection()
        with connection.cursor() as cursor:
            sql = f"""
                SELECT 
                    {period_expr} AS period,
                    COUNT(*) AS count,
                    las.title AS subject_title,
                    lal.title AS level_title
                FROM lifeapp.la_quiz_games laqg
                INNER JOIN lifeapp.la_subjects las ON laqg.la_subject_id = las.id
                INNER JOIN lifeapp.la_topics lat ON lat.id = laqg.la_topic_id
                INNER JOIN lifeapp.la_levels lal ON lat.la_level_id = lal.id
                WHERE las.status = 1 AND laqg.completed_at IS NOT NULL
                GROUP BY period, laqg.la_subject_id, lat.la_level_id
                ORDER BY period, las.title, lal.title;
            """
            cursor.execute(sql)
            result = cursor.fetchall()
        return jsonify(result), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        connection.close()



@app.route('/api/total-student-count', methods=['GET'])
def get_total_student_count():
    connection = None  # Initialize connection to None
    try:
        connection = get_db_connection()
        with connection.cursor() as cursor:
            sql = """
                SELECT count(*) as count from lifeapp.users where `type` = 3;
            """
            cursor.execute(sql)
            result = cursor.fetchall()
            print("Query Result:", result)  # Debugging statement
        return jsonify(result)
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        if connection:  # Only close connection if it was established
            connection.close()



@app.route('/api/school_list', methods=['GET'])
def get_school_list():
    try:
        connection = get_db_connection()
        with connection.cursor() as cursor:
            sql = """
                select distinct(name) from lifeapp.schools;
            """
            cursor.execute(sql)
            result = cursor.fetchall()
            
            # print("Query Result:", result)  # Debugging statement
        return jsonify(result)
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        connection.close()


@app.route('/api/state_list', methods=['GET'])
def get_state_list():
    connection = get_db_connection()
    try:
        
        with connection.cursor() as cursor:
            sql = """
                select distinct(state) from lifeapp.schools where state != 'null' and state != '2';
            """
            cursor.execute(sql)
            result = cursor.fetchall()
            
            # print("Query Result:", result)  # Debugging statement
        return jsonify(result)
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        connection.close()

@app.route('/api/state_list_teachers', methods=['GET'])
def get_state_list_teachers():
    connection = get_db_connection()
    try:
        
        with connection.cursor() as cursor:
            sql = """
                select distinct(state) from lifeapp.users where state != 'null' and state != '2';
            """
            cursor.execute(sql)
            result = cursor.fetchall()
            
            # print("Query Result:", result)  # Debugging statement
        return jsonify(result)
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        connection.close()

@app.route('/api/city_list', methods=['GET'])
def get_city_list():
    state = request.args.get('state')
    if not state:
        return jsonify({"error": "Query param 'state' is required"}), 400
    try:
        connection = get_db_connection()
        with connection.cursor() as cursor:
            sql = """
                SELECT DISTINCT city 
                FROM lifeapp.schools
                WHERE state = %s 
                  AND deleted_at IS NULL
                  AND city IS NOT NULL AND city != ''
            """
            cursor.execute(sql, (state,))
            result = cursor.fetchall()
            cities = [row['city'] for row in result]
        return jsonify(cities), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        connection.close()

@app.route('/api/city_list_teachers', methods=['POST'])
def get_city_list_teachers():
    filters = request.get_json() or {}
    state = filters.get('state')
    if not state:
        return jsonify({"error": "Query param 'state' is required"}), 400
    try:
        connection = get_db_connection()
        with connection.cursor() as cursor:
            sql = """
                SELECT DISTINCT city 
                FROM lifeapp.users
                WHERE state = %s 
                  AND city IS NOT NULL AND city != ''
            """
            cursor.execute(sql, (state))
            result = cursor.fetchall()
            cities = [row['city'] for row in result]
        return jsonify(cities), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        connection.close()


# New endpoint for filtering/searching the mission completes data
@app.route('/api/student_dashboard_search', methods=['POST'])
def search():
    filters = request.get_json() or {}
    state = filters.get('state')
    school = filters.get('school')
    city = filters.get('city')
    grade = filters.get('grade')
    mission_type = filters.get('mission_type')
    mission_acceptance = filters.get('mission_acceptance')
    requested_count = filters.get('mission_requested_no')
    accepted_count = filters.get('mission_accepted_no')
    earn_coins = filters.get('earn_coins')  # Add this line
    from_date = filters.get('from_date')  # New filter: starting date
    to_date = filters.get('to_date')      # New filter: ending date
    mobile_no = filters.get('mobile_no')
    schoolCode = filters.get('schoolCode')
    
    # Build the base query with the CTE, including mission count aggregations
    sql = """
    WITH user_mission_stats AS (
        SELECT 
            user_id,
            COUNT(*) AS total_missions_requested,
            SUM(CASE WHEN approved_at IS NOT NULL THEN 1 ELSE 0 END) AS total_missions_accepted
        FROM lifeapp.la_mission_completes
        GROUP BY user_id
    ),
    cte AS (
        SELECT 
            u.id, u.name, ls.name AS school_name, u.guardian_name, u.email, u.username, 
            u.mobile_no, u.dob, u.type AS user_type, u.grade, u.city, u.state, 
            u.address, u.earn_coins, u.heart_coins, u.brain_coins, u.school_id, u.school_code, u.created_at as registered_at, 
            ums.total_missions_requested, ums.total_missions_accepted
        FROM lifeapp.users u
        INNER JOIN lifeapp.schools ls ON ls.id = u.school_id
        LEFT JOIN user_mission_stats ums ON ums.user_id = u.id
        WHERE u.type = 3 
    """
    params = []
    
    # Append additional filter conditions if provided.
    if state:
        sql += " AND u.state = %s"
        params.append(state)
    if school:
        if isinstance(school, list):
            if len(school) == 1:
                sql += " AND ls.name = %s"
                params.append(school[0])
            else:
                sql += " AND ls.name IN %s"
                params.append(tuple(school))
        else:
            sql += " AND ls.name = %s"
            params.append(school)
    if city:
        sql += " AND u.city = %s"
        params.append(city)
    if grade:
        sql += " AND u.grade = %s"
        params.append(grade)
    if mission_type:
        sql += " AND m.type = %s"
        if mission_type == 'Mission':
            params.append(1)
        elif mission_type == 'Pragya':
            params.append(6)
        else:
            params.append(5)
    if mission_acceptance:
        if mission_acceptance == 'accepted':
            sql += " AND ums.total_missions_accepted > 0 "
        else :
            sql += " AND ums.total_missions_accepted = 0 "
    
    # Add filters for mission counts if provided
    if requested_count:
        sql += " AND ums.total_missions_requested = %s"
        params.append(int(requested_count))
    if accepted_count:
        sql += " AND ums.total_missions_accepted = %s"
        params.append(int(accepted_count))

    if earn_coins:
        if earn_coins == "0-100":
            sql += " AND u.earn_coins BETWEEN 0 AND 100"
        elif earn_coins == "101-500":
            sql += " AND u.earn_coins BETWEEN 101 AND 500"
        elif earn_coins == "501-1000":
            sql += " AND u.earn_coins BETWEEN 501 AND 1000"
        elif earn_coins == "1000+":
            sql += " AND u.earn_coins > 1000"

    if schoolCode:
        sql += " AND u.school_id = %s OR u.school_code = %s"
        params.append(schoolCode)
        params.append(int(schoolCode))
    
    if mobile_no:
        sql+= " AND u.mobile_no = %s"
        params.append(mobile_no)
    # Add date range filters
    if from_date:
        sql += " AND u.created_at >= %s"
        params.append(from_date)
    if to_date:
        sql += " AND u.created_at <= %s"
        params.append(to_date)

    sql += " ) SELECT * FROM cte ORDER BY registered_at;"
    
    try:
        connection = get_db_connection()
        with connection.cursor() as cursor:
            cursor.execute(sql, tuple(params))
            result = cursor.fetchall()
        return jsonify(result)
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        connection.close()


@app.route('/api/add_student', methods=['POST'])
def add_student():
    data = request.get_json() or {}

    # Basic student fields
    name         = data.get('name')
    guardian     = data.get('guardian_name')
    email        = data.get('email')
    username     = data.get('username')
    mobile_no    = data.get('mobile_no')
    dob          = data.get('dob')
    grade        = data.get('grade')
    city         = data.get('city')
    state        = data.get('state')
    school_id    = data.get('school_id')
    school_name  = data.get('school_name')
    school_code  = data.get('school_code')

    # Validate required
    if not all([name, email, username, mobile_no]):
        return jsonify({'error': 'Missing required fields'}), 400

    conn = get_db_connection()
    try:
        # If user passed school_name instead of ID, look it up
        if not school_id and school_name:
            with conn.cursor() as cur:
                cur.execute("SELECT id FROM lifeapp.schools WHERE name = %s", (school_name,))
                row = cur.fetchone()
                if not row:
                    return jsonify({'error': f"Unknown school '{school_name}'"}), 400
                school_id = row['id']

        sql = """
          INSERT INTO lifeapp.users
            (name, guardian_name, email, username, mobile_no, dob,
             grade, city, state, school_id, school_code, type, created_at)
          VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,3,NOW())
        """
        params = (
          name, guardian, email, username, mobile_no, dob,
          grade, city, state, school_id, school_code
        )
        with conn.cursor() as cur:
            cur.execute(sql, params)
            conn.commit()
            new_id = cur.lastrowid

        return jsonify({'success': True, 'id': new_id}), 201

    except Exception as e:
        return jsonify({'error': str(e)}), 500

    finally:
        conn.close()

@app.route('/api/edit_student/<int:user_id>', methods=['PUT'])
def edit_student(user_id):
    data = request.get_json() or {}
    # Fields we allow editing
    name         = data.get('name')
    guardian     = data.get('guardian_name')
    email        = data.get('email')
    username     = data.get('username')
    mobile_no    = data.get('mobile_no')
    dob          = data.get('dob')
    grade        = data.get('grade')
    city         = data.get('city')
    state        = data.get('state')
    school_id    = data.get('school_id')
    school_name  = data.get('school_name')
    school_code  = data.get('school_code')

    conn = get_db_connection()
    try:
        # resolve school_name → school_id if needed
        if not school_id and school_name:
            with conn.cursor() as cur:
                cur.execute("SELECT id FROM lifeapp.schools WHERE name = %s", (school_name,))
                row = cur.fetchone()
                if not row:
                    return jsonify({'error': f"Unknown school '{school_name}'"}), 400
                school_id = row['id']

        # Build dynamic SET clause
        updates = []
        params = []
        for field, val in [
            ('name', name), ('guardian_name', guardian),
            ('email', email), ('username', username),
            ('mobile_no', mobile_no), ('dob', dob),
            ('grade', grade), ('city', city), ('state', state),
            ('school_id', school_id), ('school_code', school_code)
        ]:
            if val is not None:
                updates.append(f"{field} = %s")
                params.append(val)
        if not updates:
            return jsonify({'error': 'No fields to update'}), 400

        sql = f"""
          UPDATE lifeapp.users
             SET {', '.join(updates)}
           WHERE id = %s
        """
        params.append(user_id)

        with conn.cursor() as cur:
            cur.execute(sql, tuple(params))
            conn.commit()

        return jsonify({'success': True}), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500

    finally:
        conn.close()

@app.route('/api/delete_student', methods=['POST'])
def delete_student():
    data = request.get_json() or {}
    user_id = data.get('id')
    if not user_id:
        return jsonify({'error': 'Missing student ID'}), 400

    try:
        conn = get_db_connection()
        with conn.cursor() as cur:
            cur.execute("DELETE FROM lifeapp.users WHERE id = %s", (user_id,))
            conn.commit()
        return jsonify({'success': True}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()


@app.route('/api/coupon_redeem_search', methods=['GET'])
def fetch_coupon_redeem_list():
    search = request.args.get('search')  # Get search term from query parameters
    sql = """
            SELECT 
                u.name AS 'Student Name', 
                ls.name AS 'School Name', 
                u.mobile_no AS 'Mobile Number', 
                u.state, 
                u.city, 
                u.grade,
                lc.title as 'Coupon Title', 
                cr.coins AS 'Coins Redeemed', 
                cr.user_id, 
                cr.created_at AS 'Coupon Redeemed Date' 
            FROM lifeapp.coupon_redeems cr 
            INNER JOIN lifeapp.users u ON u.id = cr.user_id 
            INNER JOIN lifeapp.schools ls ON ls.id = u.school_id
            inner join lifeapp.coupons lc on lc.id = cr.coupon_id
            """
    params = []
    if search:
        sql += " WHERE u.name LIKE %s OR ls.name LIKE %s OR u.state LIKE %s OR u.city LIKE %s"
        params.extend([f"%{search}%", f"%{search}%", f"%{search}%", f"%{search}%"])
        
    try:
        connection = get_db_connection()
        with connection.cursor() as cursor:
            cursor.execute(sql, tuple(params))
            result = cursor.fetchall()
        return jsonify(result)
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        connection.close()


@app.route('/api/student_mission_search', methods=['POST'])
def mission_search():
    filters = request.get_json() or {}
    mission_acceptance = filters.get('mission_acceptance')
    assigned_by = filters.get('assigned_by')
    from_date = filters.get('from_date')  # New filter: starting date
    to_date = filters.get('to_date')      # New filter: ending date
    
    # Build the base query with the CTE, including mission count aggregations
    sql = """
            WITH cte AS (
                SELECT 
                    m.id AS Mission_ID,
                    m.title AS Mission_Title,
                    CASE 
                        WHEN ma.teacher_id IS NULL OR ma.teacher_id = u.id THEN 'Self'
                        ELSE t.name 
                    END AS Assigned_By,
                    u.id AS Student_ID,
                    u.name AS Student_Name,
                    u.school_id AS School_ID,
                    s.name AS School_Name,
                    CASE 
                        WHEN mc.approved_at IS NOT NULL THEN 'Approved'
                        WHEN mc.rejected_at IS NOT NULL THEN 'Rejected'
                        ELSE 'Requested'
                    END AS Status,
                    mc.created_at AS Requested_At,
                    mc.points AS Total_Points,
                    mc.timing AS Each_Mission_Timing,
                    u.mobile_no,
                    u.dob,
                    u.grade,
                    u.city,
                    u.state,
                    u.address,
                    u.earn_coins,
                    u.heart_coins,
                    u.brain_coins
                FROM lifeapp.la_missions m
                LEFT JOIN lifeapp.la_mission_assigns ma ON m.id = ma.la_mission_id
                LEFT JOIN lifeapp.users t ON ma.teacher_id = t.id
                LEFT JOIN lifeapp.users u ON ma.user_id = u.id
                LEFT JOIN lifeapp.la_mission_completes mc 
                    ON m.id = mc.la_mission_id AND mc.user_id = u.id
                LEFT JOIN lifeapp.schools s ON u.school_id = s.id
            )
            SELECT * FROM cte
            WHERE 1=1

    """
    params = []
    
    if mission_acceptance and mission_acceptance in ("Approved", "Requested", "Rejected"):
        sql += " AND cte.Status = %s"
        params.append(mission_acceptance)

    if assigned_by:
        if assigned_by.lower() == "self":
            sql += " AND cte.Assigned_By = 'Self'"
        elif assigned_by.lower() == "teacher":
            sql += " AND cte.Assigned_By <> 'Self'"

    # Filter for creation date range
    if from_date:
        sql += " AND cte.Requested_At >= %s"
        params.append(from_date)
    if to_date:
        sql += " AND cte.Requested_At <= %s"
        params.append(to_date)

    # NEW: Add filter for School ID and Mobile No.
    school_id = filters.get('school_id')
    if school_id:
        sql += " AND cte.School_ID = %s"
        params.append(school_id)
    mobile_no = filters.get('mobile_no')
    if mobile_no:
        sql += " AND cte.mobile_no = %s"
        params.append(mobile_no)

    sql += " ORDER BY cte.Requested_At DESC ;"
    
    try:
        connection = get_db_connection()
        with connection.cursor() as cursor:
            cursor.execute(sql, tuple(params))
            result = cursor.fetchall()
        return jsonify(result)
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        connection.close()

@app.route('/api/teacher_schools', methods = ['POST'])
def get_teacher_states():
    sql = """
        select distinct ls.name as school from lifeapp.schools ls inner join lifeapp.users u on u.school_id = ls.id where u.type = 5;
    """
    try:
        connection = get_db_connection()
        with connection.cursor() as cursor:
            cursor.execute(sql)
            result = cursor.fetchall()
        return jsonify(result)
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        connection.close()


@app.route('/api/teachers-by-grade-subject-section', methods=['POST'])
def teachers_by_grade_subject_section():
    """
    This endpoint returns teacher counts broken down by la_grade_id (grade),
    by subject (from las.title), and further by section (from lass.name).
    """
    connection = get_db_connection()
    try:
        with connection.cursor() as cursor:
            sql = """
                SELECT COUNT(*) AS count, 
                       las.title, 
                       la_grade_id, 
                       lass.name AS section
                FROM lifeapp.la_teacher_grades latg 
                INNER JOIN lifeapp.la_subjects las ON las.id = latg.la_subject_id 
                INNER JOIN lifeapp.la_sections lass ON lass.id = latg.la_section_id
                WHERE las.status = 1
                GROUP BY la_subject_id, la_grade_id, la_section_id
                ORDER BY la_subject_id, la_grade_id, la_section_id;
            """
            cursor.execute(sql)
            rows = cursor.fetchall()
            # Optionally, if las.title is stored as a JSON string, convert it.
            # For example, if rows[0]['title'] is '{"en": "Science"}':
            for row in rows:
                try:
                    title_json = json.loads(row['title'])
                    # Use "en" language if available, else fallback.
                    row['subject'] = title_json.get('en', row['title'])
                except Exception:
                    row['subject'] = row['title']
            
            # Return only the keys we care about: grade, subject, section and count
            result = [{
                'grade': row['la_grade_id'],
                'subject': row['subject'],
                'section': row['section'],
                'count': row['count']
            } for row in rows]

            return jsonify(result)
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        connection.close()

@app.route('/api/teacher_dashboard_search', methods=['POST'])
def fetch_teacher_dashboard():
    filters = request.get_json() or {}
    state = filters.get('state')
    city = filters.get('city')
    school_code = filters.get('school_code')  # School code filter
    is_life_lab = filters.get('is_life_lab')
    school = filters.get('school')
    from_date = filters.get('from_date')  # Starting date filter
    to_date = filters.get('to_date')      # Ending date filter
    # New filters for teacher subject and grade:
    teacher_subject = filters.get('teacher_subject')
    teacher_grade = filters.get('teacher_grade')
    
    # Start with base SQL. We join to la_teacher_grades (ltg), la_grades (lgr), and la_sections (lsct)
    sql = """
        WITH cte AS (
            SELECT count(*) as mission_assign_count, teacher_id 
            FROM lifeapp.la_mission_assigns 
            GROUP BY teacher_id
        )
        SELECT 
            u.id, u.name, u.email,
            u.mobile_no, u.state, 
            u.city, ls.name as school_name, u.school_id, 
            cte.mission_assign_count,
            CASE 
                WHEN ls.is_life_lab = 1 THEN 'Yes' 
                ELSE 'No' 
            END AS is_life_lab,
            u.created_at, u.updated_at,
            las.title,
            lgr.name as grade_name, 
            lsct.name as section_name
        FROM lifeapp.users u
        INNER JOIN lifeapp.schools ls ON ls.id = u.school_id
        LEFT JOIN cte ON cte.teacher_id = u.id
        LEFT JOIN lifeapp.la_teacher_grades ltg ON ltg.user_id = u.id
        LEFT JOIN lifeapp.la_subjects las on las.id = ltg.la_subject_id
        LEFT JOIN lifeapp.la_grades lgr ON ltg.la_grade_id = lgr.id
        LEFT JOIN lifeapp.la_sections lsct ON ltg.la_section_id = lsct.id
        WHERE u.type = 5
    """
    params = []
    
    if state and state.strip():
        sql += " AND u.state = %s"
        params.append(state)
    if school_code and school_code.strip():
        sql += " AND u.school_id = %s"
        params.append(school_code)
    if city and city.strip():
        sql += " AND u.city = %s"
        params.append(city)
    if is_life_lab:
        if is_life_lab == "Yes":
            sql += " AND ls.is_life_lab = 1"
        elif is_life_lab == "No":
            sql += " AND ls.is_life_lab = 0"
    if school:
        sql += " AND ls.name = %s"
        params.append(school)
    if teacher_subject:
        # Filter by teacher subject using la_teacher_grades table join.
        sql += " AND ltg.la_subject_id = %s"
        params.append(teacher_subject)
    if teacher_grade:
        # Filter by teacher grade using la_teacher_grades and la_grades join.
        sql += " AND ltg.la_grade_id = %s"
        params.append(int(teacher_grade))
    if from_date:
        sql += " AND u.created_at >= %s"
        params.append(from_date)
    if to_date:
        sql += " AND u.created_at <= %s"
        params.append(to_date)
    
    try:
        connection = get_db_connection()
        with connection.cursor() as cursor:
            cursor.execute(sql, tuple(params))
            result = cursor.fetchall()
        return jsonify(result if result else [])
    except Exception as e:
        print("Error in teacher_dashboard_search:", str(e))
        return jsonify({'error': str(e)}), 500
    finally:
        connection.close()

@app.route('/api/add_teacher', methods=['POST'])
def add_teacher():
    """
    Expects a JSON payload with teacher details.
    Example payload:
    {
        "name": "John Doe",
        "email": "john@example.com",
        "mobile_no": "9876543210",
        "state": "SomeState",
        "city": "SomeCity",
        "school_id": "1234",
        "teacher_subject": "1",       # subject id (as string or number)
        "teacher_grade": "3",         # grade number (as string, will be converted)
        "teacher_section": "A"        # section identifier
    }
    Inserts a new teacher record (with u.type = 5) in lifeapp.users using
    the current datetime for created_at and updated_at, and if teacher_subject, teacher_grade,
    and teacher_section are provided, inserts an entry into la_teacher_grades.
    """
    data = request.get_json() or {}
    try:
        name = data.get("name")
        email = data.get("email")
        mobile_no = data.get("mobile_no")
        state = data.get("state")
        city = data.get("city")
        school_id = data.get("school_id")
        
        # New fields for teacher_grade details:
        teacher_subject = data.get("teacher_subject")
        teacher_grade = data.get("teacher_grade")
        teacher_section = data.get("teacher_section")
        
        # Basic validation
        if not name or not mobile_no or not school_id:
            return jsonify({"error": "Name, mobile_no, and school_id are required"}), 400

        # Use datetime.now() with the desired format
        datetime_str = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        
        connection = get_db_connection()
        with connection:
            with connection.cursor() as cursor:
                # Insert teacher record into lifeapp.users (u.type = 5 for teachers)
                sql = """
                INSERT INTO lifeapp.users
                (name, email, mobile_no, state, city, school_id, type, created_at, updated_at)
                VALUES (%s, %s, %s, %s, %s, %s, 5, %s, %s)
                """
                params = (name, email, mobile_no, state, city, school_id, datetime_str, datetime_str)
                cursor.execute(sql, params)
                teacher_id = cursor.lastrowid

                # If teacher_subject, teacher_grade and teacher_section are provided, insert into la_teacher_grades.
                if teacher_subject and teacher_grade and teacher_section:
                    sql2 = """
                    INSERT INTO lifeapp.la_teacher_grades
                    (user_id, la_subject_id, la_grade_id, la_section_id, created_at, updated_at)
                    VALUES (%s, %s, %s, %s, %s, %s)
                    """
                    params2 = (
                        teacher_id, 
                        teacher_subject, 
                        int(teacher_grade), 
                        teacher_section, 
                        datetime_str, 
                        datetime_str
                    )
                    cursor.execute(sql2, params2)
                connection.commit()
        return jsonify({"message": "Teacher added successfully", "id": teacher_id})
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
@app.route('/api/teacher_update', methods=['POST'])
def update_teacher():
    """
    Expects a JSON payload:
    {
      "id": 43253,
      "name": "Updated Name",
      "email": "updated@example.com",
      "mobile_no": "9876543210",
      "state": "NewState",
      "city": "NewCity",
      "school_id": "1234",
      "teacher_subject": "1",      # subject id
      "teacher_grade": "3",        # grade (will be converted to int)
      "teacher_section": "A"       # section identifier
    }
    
    Updates the teacher (users.type = 5) record and then
    updates or inserts into la_teacher_grades.
    """
    data = request.get_json() or {}
    try:
        teacher_id = data.get("id")
        if not teacher_id:
            return jsonify({"error": "Teacher id is required."}), 400

        # Extract updated teacher fields
        name = data.get("name")
        email = data.get("email")
        mobile_no = data.get("mobile_no")
        state = data.get("state")
        city = data.get("city")
        school_id = data.get("school_id")
        teacher_subject = data.get("teacher_subject")
        teacher_grade = data.get("teacher_grade")
        teacher_section = data.get("teacher_section")
        
        # Use current datetime for updates
        datetime_str = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        
        connection = get_db_connection()
        with connection:
            with connection.cursor() as cursor:
                # Update the teacher record in users
                sql = """
                UPDATE lifeapp.users
                SET name = %s, email = %s, mobile_no = %s, state = %s, city = %s, school_id = %s, updated_at = %s
                WHERE id = %s AND type = 5
                """
                params = (name, email, mobile_no, state, city, school_id, datetime_str, teacher_id)
                cursor.execute(sql, params)
                
                # Update the la_teacher_grades record if grade-related fields are provided.
                if teacher_subject and teacher_grade and teacher_section:
                    # Check if a record already exists for this teacher
                    cursor.execute("SELECT id FROM lifeapp.la_teacher_grades WHERE user_id = %s", (teacher_id,))
                    existing = cursor.fetchone()
                    if existing:
                        # Update the existing record
                        sql2 = """
                        UPDATE lifeapp.la_teacher_grades
                        SET la_subject_id = %s, la_grade_id = %s, la_section_id = %s, updated_at = %s
                        WHERE user_id = %s
                        """
                        params2 = (teacher_subject, int(teacher_grade), teacher_section, datetime_str, teacher_id)
                        cursor.execute(sql2, params2)
                    else:
                        # Insert a new record if none exists
                        sql2 = """
                        INSERT INTO lifeapp.la_teacher_grades
                        (user_id, la_subject_id, la_grade_id, la_section_id, created_at, updated_at)
                        VALUES (%s, %s, %s, %s, %s, %s)
                        """
                        params2 = (teacher_id, teacher_subject, int(teacher_grade), teacher_section, datetime_str, datetime_str)
                        cursor.execute(sql2, params2)
                connection.commit()
        return jsonify({"message": "Teacher updated successfully"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
@app.route('/api/teacher_delete', methods=['POST'])
def delete_teacher():
    """
    Expects a JSON payload:
    {
      "id": 43253
    }
    Deletes the teacher from lifeapp.users (type 5) and optionally its record from la_teacher_grades.
    """
    data = request.get_json() or {}
    try:
        teacher_id = data.get("id")
        if not teacher_id:
            return jsonify({"error": "Teacher id is required."}), 400
        
        connection = get_db_connection()
        with connection:
            with connection.cursor() as cursor:
                # Delete from la_teacher_grades first if exists.
                sql2 = "DELETE FROM lifeapp.la_teacher_grades WHERE user_id = %s"
                cursor.execute(sql2, (teacher_id,))
                
                # Delete from users table
                sql = "DELETE FROM lifeapp.users WHERE id = %s AND type = 5"
                cursor.execute(sql, (teacher_id,))
                connection.commit()
        return jsonify({"message": "Teacher deleted successfully"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/api/grades_list', methods=['POST'])
def get_grades_list():
    try:
        connection = get_db_connection()
        with connection.cursor() as cursor:
            # Fetch active grades from the la_grades table
            sql = """
                SELECT id, name, status, created_at, updated_at
                FROM lifeapp.la_grades
                WHERE status = 1
            """
            cursor.execute(sql)
            result = cursor.fetchall()
        return jsonify(result)
    except Exception as e:
        print("Error in get_grades_list:", str(e))
        return jsonify({'error': str(e)}), 500
    finally:
        connection.close()


@app.route('/api/teacher_concept_cartoons', methods=['POST'])
def fetch_teacher_concept_cartoons():
    filters = request.get_json() or {}
    subject = filters.get('subject')
    status = filters.get('status')

    # Start with base SQL without WHERE clause
    sql = """
            SELECT 
                CASE 
                    WHEN lacc.la_subject_id = 1 
                        THEN 'Science'
                    WHEN lacc.la_subject_id = 2
                        THEN 'Maths' 
                END AS la_subject,
                lacc.la_level_id, lacc.title, lacc.document,
                CASE
                    WHEN lacc.status = 1
                        THEN 'Published'
                    ELSE 'Drafted'
                END AS status
            FROM lifeapp.la_concept_cartoons lacc
        """
    params = []
    
    # Add WHERE clause only if filters are provided
    conditions = []
    
    if subject and subject.strip():
        conditions.append("(CASE WHEN lacc.la_subject_id = 1 THEN 'Science' WHEN lacc.la_subject_id = 2 THEN 'Maths' END) = %s")
        params.append(subject)
    if status and status.strip():
        conditions.append("(CASE WHEN lacc.status = 1 THEN 'Published' ELSE 'Drafted' END) = %s")
        params.append(status)
    
    # Add WHERE clause if there are conditions
    if conditions:
        sql += " WHERE " + " AND ".join(conditions)

    sql +=";"
    try:
        connection = get_db_connection()
        with connection.cursor() as cursor:
            cursor.execute(sql, tuple(params))
            result = cursor.fetchall()
            return jsonify(result if result else [])
    except Exception as e:
        print("Error in teacher_concept_cartoons:", str(e))
        return jsonify({'error': str(e)}), 500
    finally:
        connection.close()

@app.route('/api/update_concept_cartoon', methods=['POST'])
def update_concept_cartoon():
    data = request.get_json() or {}
    cartoon_id = data.get('id')
    la_subject_id = data.get('la_subject_id')
    la_level_id = data.get('la_level_id')
    title = data.get('title')
    document = data.get('document')
    status = data.get('status')
    
    if not cartoon_id:
        return jsonify({'error': 'Cartoon ID is required'}), 400

    try:
        connection = get_db_connection()
        with connection.cursor() as cursor:
            sql = """
                UPDATE lifeapp.la_concept_cartoons
                SET la_subject_id = %s,
                    la_level_id = %s,
                    title = %s,
                    document = %s,
                    status = %s,
                    updated_at = NOW()
                WHERE id = %s
            """
            cursor.execute(sql, (la_subject_id, la_level_id, title, document, status, cartoon_id))
        connection.commit()
        return jsonify({'message': 'Concept cartoon updated successfully'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        connection.close()

@app.route('/api/add_concept_cartoon', methods=['POST'])
def add_concept_cartoon():
    data = request.get_json() or {}
    la_subject_id = data.get('la_subject_id')
    la_level_id = data.get('la_level_id')
    title = data.get('title')
    document = data.get('document')
    status = data.get('status')

    try:
        connection = get_db_connection()
        with connection.cursor() as cursor:
            sql = """
                INSERT INTO lifeapp.la_concept_cartoons (la_subject_id, la_level_id, title, document, status, created_at, updated_at)
                VALUES (%s, %s, %s, %s, %s, NOW(), NOW())
            """
            cursor.execute(sql, (la_subject_id, la_level_id, title, document, status))
        connection.commit()
        return jsonify({'message': 'Concept cartoon added successfully'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        connection.close()


@app.route('/api/lesson_plan_language', methods=["GET"])
def fetch_lesson_plan_language():
    sql = """
        SELECT id, name as title,
            CASE WHEN status = 1
                THEN 'Publish' 
            ELSE 'Draft'
            END as status
        FROM lifeapp.la_lession_plan_languages 
        ORDER BY created_at DESC;    
    """
    try:
        connection = get_db_connection()
        with connection.cursor() as cursor:
            cursor.execute(sql)
            result = cursor.fetchall()
            return jsonify(result if result else [])
    except Exception as e:
        print("Error in lesson_plan_language:", str(e))
        return jsonify({'error': str(e)}), 500
    finally:
        connection.close()

@app.route('/api/update_lesson_plan_language', methods=['POST'])
def update_lesson_plan_language():
    data = request.get_json()
    status_value = 1 if data["status"] == "Publish" else 0
    
    sql = "UPDATE lifeapp.la_lession_plan_languages SET name = %s, status = %s, updated_at = NOW() WHERE id = %s"
    try:
        connection = get_db_connection()
        with connection.cursor() as cursor:
            cursor.execute(sql, (data["title"], status_value, data["id"]))
        connection.commit()
        return jsonify({'message': 'Updated successfully'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        connection.close()

@app.route('/api/add_lesson_plan_language', methods=['POST'])
def add_lesson_plan_language():
    data = request.get_json()
    status_value = 1 if data["status"] == "Publish" else 0
    
    sql = "INSERT INTO lifeapp.la_lession_plan_languages (name, status, created_at, updated_at) VALUES (%s, %s, NOW(), NOW())"
    try:
        connection = get_db_connection()
        with connection.cursor() as cursor:
            cursor.execute(sql, (data["title"], status_value))
        connection.commit()
        return jsonify({'message': 'Added successfully'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        connection.close()

@app.route('/api/lesson_plan_languages_2', methods =['GET'])
def get_lesson_plan_langauges_2():
    sql = """
    select id, name from lifeapp.la_lession_plan_languages;
    """
    try:
        connection = get_db_connection()
        with connection.cursor() as cursor:
            cursor.execute(sql)
            result = cursor.fetchall()
            return jsonify(result if result else [])
    except Exception as e:
        print("Error in lesson_plan_language:", str(e))
        return jsonify({'error': str(e)}), 500
    finally:
        connection.close()

@app.route('/api/lesson_plans_search', methods=['POST'])
def fetch_lesson_plans_search():
    filters = request.get_json() or {}
    language = filters.get('language')
    status = filters.get('status')
    title = filters.get('title')

    sql = """
    SELECT 
        lalp.id,
        lall.name AS language,
        CASE
            WHEN lalp.type = 1 THEN 'Life Lab - Demo Models'
            WHEN lalp.type = 2 THEN 'Jigyasa - Self DIY Activities'
            WHEN lalp.type = 3 THEN 'Pragya - DIY Activities With Life Lab KITS'
            WHEN lalp.type = 4 THEN 'Life Lab - Activities Lesson Plans'
            ELSE 'Default type (None Mentioned)'
        END AS type,
        lalp.title AS title,
        CASE
            WHEN lalp.status = 1 THEN 'Published'
            ELSE 'Drafted'
        END AS status
    FROM lifeapp.la_lession_plans lalp
    INNER JOIN lifeapp.la_lession_plan_languages lall 
        ON lall.id = lalp.la_lession_plan_language_id
    """

    # Build WHERE clause if filters are provided
    where_clauses = []
    params = []

    if language and language.strip():
        where_clauses.append("lall.name = %s")
        params.append(language)
    if status and status.strip():
        # Convert 'Published'/'Drafted' to numeric
        where_clauses.append("lalp.status = %s")
        params.append(1 if status == "Published" else 0)
    if title and title.strip():
        where_clauses.append("lalp.title LIKE %s")
        params.append(f"%{title}%")

    if where_clauses:
        sql += " WHERE " + " AND ".join(where_clauses)

    # Order by most recently updated
    sql += " ORDER BY lalp.updated_at DESC"

    try:
        connection = get_db_connection()
        with connection.cursor() as cursor:
            cursor.execute(sql, tuple(params))
            result = cursor.fetchall()
        return jsonify(result if result else [])
    except Exception as e:
        print("Error in fetch_lesson_plans_search:", str(e))
        return jsonify({'error': str(e)}), 500
    finally:
        connection.close()


@app.route('/api/update_lesson_plan', methods=['POST'])
def update_lesson_plan():
    data = request.get_json()
    lesson_plan_id = data.get('id')
    la_lesson_plan_language_id = data.get('la_lesson_plan_language_id')
    title = data.get('title')
    document = data.get('document')
    plan_type = data.get('type')   # numeric TINYINT (0..4)
    status = data.get('status')    # numeric TINYINT (0 or 1)

    if not lesson_plan_id:
        return jsonify({'error': 'Lesson Plan ID is required'}), 400

    try:
        connection = get_db_connection()
        with connection.cursor() as cursor:
            sql = """
                UPDATE lifeapp.la_lession_plans
                SET la_lession_plan_language_id = %s,
                    title = %s,
                    document = %s,
                    `type` = %s,
                    status = %s,
                    updated_at = NOW()
                WHERE id = %s
            """
            cursor.execute(sql, (la_lesson_plan_language_id, title, document, plan_type, status, lesson_plan_id))
        connection.commit()
        return jsonify({'message': 'Lesson Plan updated successfully'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        connection.close()


@app.route('/api/add_lesson_plan', methods=['POST'])
def add_lesson_plan():
    data = request.get_json()
    la_lesson_plan_language_id = data.get('la_lesson_plan_language_id')
    title = data.get('title')
    document = data.get('document')
    plan_type = data.get('type')   # numeric TINYINT
    status = data.get('status')    # numeric TINYINT

    try:
        connection = get_db_connection()
        with connection.cursor() as cursor:
            sql = """
                INSERT INTO lifeapp.la_lession_plans 
                (la_lession_plan_language_id, title, document, `type`, status, created_at, updated_at)
                VALUES (%s, %s, %s, %s, %s, NOW(), NOW())
            """
            cursor.execute(sql, (la_lesson_plan_language_id, title, document, plan_type, status))
        connection.commit()
        return jsonify({'message': 'Lesson Plan added successfully'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        connection.close()



##########################################
# NEW: WORKSHEETS ENDPOINTS
##########################################

# 1) SEARCH / FILTER Worksheets
@app.route('/api/work_sheets_search', methods=['POST'])
def fetch_work_sheets_search():
    """
    Expects JSON filters, e.g.:
    {
      "subject": "Science" or "Maths" or "",
      "grade": 1..12 or "" (string),
      "status": "Published" or "Drafted" or "",
      "title": "some partial text" or ""
    }
    """
    filters = request.get_json() or {}
    subject = filters.get('subject', '').strip()
    grade = filters.get('grade', '').strip()
    status = filters.get('status', '').strip()
    title = filters.get('title', '').strip()

    sql = """
        SELECT
            w.id,
            CASE WHEN w.la_subject_id = 1 THEN 'Science' ELSE 'Maths' END AS subject,
            w.la_grade_id AS grade,
            w.title,
            w.document,
            CASE WHEN w.status = 1 THEN 'Published' ELSE 'Drafted' END AS status
        FROM lifeapp.la_work_sheets w
        WHERE 1=1
    """
    params = []

    # Subject filter
    if subject:
        if subject == "Science":
            sql += " AND w.la_subject_id = 1"
        elif subject == "Maths":
            sql += " AND w.la_subject_id = 2"

    # Grade filter
    if grade:
        # ensure it's an integer, if provided
        try:
            grade_val = int(grade)
            sql += " AND w.la_grade_id = %s"
            params.append(grade_val)
        except ValueError:
            pass  # if it's not an integer, ignore

    # Status filter
    if status:
        sql += " AND w.status = %s"
        status_val = 1 if status == "Published" else 0
        params.append(status_val)

    # Title filter
    if title:
        sql += " AND w.title LIKE %s"
        params.append(f"%{title}%")

    # Sort by newest updated
    sql += " ORDER BY w.updated_at DESC;"

    try:
        connection = get_db_connection()
        with connection.cursor() as cursor:
            cursor.execute(sql, tuple(params))
            result = cursor.fetchall()
        return jsonify(result if result else [])
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        connection.close()


# 2) ADD a new Worksheet
@app.route('/api/add_work_sheet', methods=['POST'])
def add_work_sheet():
    """
    Expects JSON body like:
    {
      "subject": "Science" or "Maths",
      "grade": 1..12,
      "title": "...",
      "document": "...",
      "status": "Published" or "Drafted"
    }
    """
    data = request.get_json() or {}
    subject = data.get('subject')
    grade = data.get('grade')
    title = data.get('title', '')
    document = data.get('document', '')
    status_str = data.get('status', 'Drafted')

    # Convert subject to la_subject_id
    la_subject_id = 1 if subject == "Science" else 2

    # Convert status to 1 or 0
    status_val = 1 if status_str == "Published" else 0

    try:
        connection = get_db_connection()
        with connection.cursor() as cursor:
            sql = """
                INSERT INTO lifeapp.la_work_sheets 
                (la_subject_id, la_grade_id, title, document, status, created_at, updated_at)
                VALUES (%s, %s, %s, %s, %s, NOW(), NOW())
            """
            cursor.execute(sql, (la_subject_id, grade, title, document, status_val))
        connection.commit()
        return jsonify({'message': 'Worksheet added successfully'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        connection.close()


# 3) UPDATE an existing Worksheet
@app.route('/api/update_work_sheet', methods=['POST'])
def update_work_sheet():
    """
    Expects JSON body like:
    {
      "id": <worksheet_id>,
      "subject": "Science" or "Maths",
      "grade": 1..12,
      "title": "...",
      "document": "...",
      "status": "Published" or "Drafted"
    }
    """
    data = request.get_json() or {}
    worksheet_id = data.get('id')
    subject = data.get('subject')
    grade = data.get('grade')
    title = data.get('title', '')
    document = data.get('document', '')
    status_str = data.get('status', 'Drafted')

    if not worksheet_id:
        return jsonify({'error': 'Worksheet ID is required'}), 400

    # Convert subject to la_subject_id
    la_subject_id = 1 if subject == "Science" else 2

    # Convert status to 1 or 0
    status_val = 1 if status_str == "Published" else 0

    try:
        connection = get_db_connection()
        with connection.cursor() as cursor:
            sql = """
                UPDATE lifeapp.la_work_sheets
                SET la_subject_id = %s,
                    la_grade_id = %s,
                    title = %s,
                    document = %s,
                    status = %s,
                    updated_at = NOW()
                WHERE id = %s
            """
            cursor.execute(sql, (la_subject_id, grade, title, document, status_val, worksheet_id))
        connection.commit()
        return jsonify({'message': 'Worksheet updated successfully'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        connection.close()



##########################################
# NEW: ASSESSMENTS ENDPOINTS
##########################################

@app.route('/api/assessments_search', methods=['POST'])
def assessments_search():
    """
    Expects JSON filters (all optional), for example:
    {
      "subject": "Science" or "Maths" or "",
      "grade": "1" to "12" or "",
      "title": "partial text" or "",
      "status": "Published" or "Drafted" or ""
    }
    Returns the list of assessments from lifeapp.la_assessments.
    """
    filters = request.get_json() or {}
    subject = filters.get('subject', '').strip()
    grade = filters.get('grade', '').strip()
    title = filters.get('title', '').strip()
    status = filters.get('status', '').strip()

    sql = """
        SELECT
            a.id,
            CASE WHEN a.la_subject_id = 1 THEN 'Science' ELSE 'Maths' END AS subject,
            a.la_grade_id AS grade,
            a.title,
            a.document,
            CASE WHEN a.status = 1 THEN 'Published' ELSE 'Drafted' END AS status
        FROM lifeapp.la_assessments a
        WHERE 1=1
    """
    params = []

    # Filter by subject
    if subject:
        if subject == "Science":
            sql += " AND a.la_subject_id = 1"
        elif subject == "Maths":
            sql += " AND a.la_subject_id = 2"
    # Filter by grade (if provided and is integer)
    if grade:
        try:
            grade_val = int(grade)
            sql += " AND a.la_grade_id = %s"
            params.append(grade_val)
        except ValueError:
            pass
    # Filter by title (partial match)
    if title:
        sql += " AND a.title LIKE %s"
        params.append(f"%{title}%")
    # Filter by status
    if status:
        status_val = 1 if status == "Published" else 0
        sql += " AND a.status = %s"
        params.append(status_val)

    sql += " ORDER BY a.updated_at DESC;"

    try:
        connection = get_db_connection()
        with connection.cursor() as cursor:
            cursor.execute(sql, tuple(params))
            result = cursor.fetchall()
        return jsonify(result if result else [])
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        connection.close()


@app.route('/api/add_assessment', methods=['POST'])
def add_assessment():
    """
    Expects JSON body like:
    {
      "subject": "Science" or "Maths",
      "grade": 1..12,
      "title": "...",
      "document": "...",
      "status": "Published" or "Drafted"
    }
    """
    data = request.get_json() or {}
    subject = data.get('subject')
    grade = data.get('grade')
    title = data.get('title', '')
    document = data.get('document', '')
    status_str = data.get('status', 'Drafted')

    # Map subject and status
    la_subject_id = 1 if subject == "Science" else 2
    status_val = 1 if status_str == "Published" else 0

    try:
        connection = get_db_connection()
        with connection.cursor() as cursor:
            sql = """
                INSERT INTO lifeapp.la_assessments 
                (la_subject_id, la_grade_id, title, document, status, created_at, updated_at)
                VALUES (%s, %s, %s, %s, %s, NOW(), NOW())
            """
            cursor.execute(sql, (la_subject_id, grade, title, document, status_val))
        connection.commit()
        return jsonify({'message': 'Assessment added successfully'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        connection.close()


@app.route('/api/update_assessment', methods=['POST'])
def update_assessment():
    """
    Expects JSON body like:
    {
      "id": <assessment_id>,
      "subject": "Science" or "Maths",
      "grade": 1..12,
      "title": "...",
      "document": "...",
      "status": "Published" or "Drafted"
    }
    """
    data = request.get_json() or {}
    assessment_id = data.get('id')
    subject = data.get('subject')
    grade = data.get('grade')
    title = data.get('title', '')
    document = data.get('document', '')
    status_str = data.get('status', 'Drafted')

    if not assessment_id:
        return jsonify({'error': 'Assessment ID is required'}), 400

    la_subject_id = 1 if subject == "Science" else 2
    status_val = 1 if status_str == "Published" else 0

    try:
        connection = get_db_connection()
        with connection.cursor() as cursor:
            sql = """
                UPDATE lifeapp.la_assessments
                SET la_subject_id = %s,
                    la_grade_id = %s,
                    title = %s,
                    document = %s,
                    status = %s,
                    updated_at = NOW()
                WHERE id = %s
            """
            cursor.execute(sql, (la_subject_id, grade, title, document, status_val, assessment_id))
        connection.commit()
        return jsonify({'message': 'Assessment updated successfully'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        connection.close()


# --------------------- School Data Endpoints ---------------------

@app.route('/api/get_schools_data', methods=['POST'])
def get_schools_data():
    """
    Returns rows from lifeapp.schools with columns:
    id, name, state, city, district, pin_code, app_visible, is_life_lab, status.
    Numeric flags are converted to user-friendly text.
    """
    data = request.get_json() or {}
    name = data.get('name')
    state = data.get('state')
    city = data.get('city')
    district = data.get('district')
    status = data.get('status')
    try:
        connection = get_db_connection()
        with connection.cursor() as cursor:
            sql = """
                SELECT 
                    id, 
                    name, 
                    state, 
                    city, 
                    district, 
                    pin_code,
                    app_visible,
                    is_life_lab,
                    status
                FROM lifeapp.schools
                WHERE deleted_at IS NULL
            """
            params = []
            if status:
                status_val = 1 if status == "Active" else 0
                sql += " AND status = %s"
                params.append(status_val)

            if district:
                sql += " AND district = %s"
                params.append(district)
            
            if city:
                sql += " AND city = %s"
                params.append(city)

            if state:
                sql += " AND state = %s"
                params.append(state)

            if name:
                sql += " AND name = %s"
                params.append(name)

            # connection = get_db_connection()

            cursor.execute(sql, tuple(params))
            rows = cursor.fetchall()
            for row in rows:
                row["app_visible"] = "Yes" if row["app_visible"] == 1 else "No"
                row["is_life_lab"] = "Yes" if row["is_life_lab"] == 1 else "No"
                row["status"] = "Active" if row["status"] == 1 else "Inactive"
            return jsonify(rows), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        connection.close()

@app.route('/api/schools_data', methods=['POST'])
def add_school_data():
    """
    Adds a new school row.
    Expected JSON keys: name, state, city, district, pin_code, app_visible, is_life_lab, status.
    app_visible and is_life_lab are "Yes"/"No", and status "Active"/"Inactive".
    """
    data = request.get_json() or {}
    try:
        connection = get_db_connection()
        with connection.cursor() as cursor:
            name = data.get("name")
            state = data.get("state")
            city = data.get("city")
            district = data.get("district")
            pin_code = data.get("pin_code")
            app_visible_val = 1 if data.get("app_visible") == "Yes" else 0
            is_life_lab_val = 1 if data.get("is_life_lab") == "Yes" else 0
            status_val = 1 if data.get("status") == "Active" else 0
            sql = """
                INSERT INTO lifeapp.schools 
                (name, state, city, district, pin_code, app_visible, is_life_lab, status, created_at, updated_at)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, NOW(), NOW())
            """
            cursor.execute(sql, (name, state, city, district, pin_code, app_visible_val, is_life_lab_val, status_val))
            connection.commit()
        return jsonify({"message": "School added successfully"}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        connection.close()

@app.route('/api/schools_data/<int:school_id>', methods=['PUT'])
def update_school_data(school_id):
    """
    Updates an existing school row.
    Expected JSON keys: name, state, city, district, pin_code, app_visible, is_life_lab, status.
    """
    data = request.get_json() or {}
    try:
        connection = get_db_connection()
        with connection.cursor() as cursor:
            name = data.get("name")
            state = data.get("state")
            city = data.get("city")
            district = data.get("district")
            pin_code = data.get("pin_code")
            app_visible_val = 1 if data.get("app_visible") == "Yes" else 0
            is_life_lab_val = 1 if data.get("is_life_lab") == "Yes" else 0
            status_val = 1 if data.get("status") == "Active" else 0
            sql = """
                UPDATE lifeapp.schools
                SET 
                    name = %s,
                    state = %s,
                    city = %s,
                    district = %s,
                    pin_code = %s,
                    app_visible = %s,
                    is_life_lab = %s,
                    status = %s,
                    updated_at = NOW()
                WHERE id = %s
            """
            cursor.execute(sql, (name, state, city, district, pin_code, app_visible_val, is_life_lab_val, status_val, school_id))
            connection.commit()
        return jsonify({"message": "School updated successfully"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        connection.close()

@app.route('/api/schools_data/<int:school_id>', methods=['DELETE'])
def delete_school_data(school_id):
    """
    Soft-deletes a school row by setting deleted_at.
    """
    try:
        connection = get_db_connection()
        with connection.cursor() as cursor:
            sql = """
                UPDATE lifeapp.schools
                SET deleted_at = NOW()
                WHERE id = %s
            """
            cursor.execute(sql, (school_id,))
            connection.commit()
        return jsonify({"message": "School deleted successfully"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        connection.close()

# @app.route('/api/state_list', methods=['GET'])
# def get_state_list():
#     """
#     Returns distinct states from the schools table.
#     """
#     try:
#         connection = get_db_connection()
#         with connection.cursor() as cursor:
#             sql = """
#                 SELECT DISTINCT(state) 
#                 FROM lifeapp.schools 
#                 WHERE state IS NOT NULL AND state != '' AND state != '2'
#             """
#             cursor.execute(sql)
#             result = cursor.fetchall()
#             states = [row['state'] for row in result]
#         return jsonify(states)
#     except Exception as e:
#         return jsonify({"error": str(e)}), 500
#     finally:
#         connection.close()

@app.route('/api/cities_for_state', methods=['GET'])
def get_cities_for_state():
    """
    Returns distinct city values for the given state.
    Example: GET /api/cities_for_state?state=Maharashtra
    """
    state = request.args.get('state')
    if not state:
        return jsonify({"error": "Query param 'state' is required"}), 400
    try:
        connection = get_db_connection()
        with connection.cursor() as cursor:
            sql = """
                SELECT DISTINCT city 
                FROM lifeapp.schools
                WHERE state = %s 
                  AND deleted_at IS NULL
                  AND city IS NOT NULL AND city != ''
            """
            cursor.execute(sql, (state,))
            result = cursor.fetchall()
            cities = [row['city'] for row in result]
        return jsonify(cities), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        connection.close()

@app.route('/api/demograph-students', methods=['POST'])
def get_demograph_students():
    """
    Returns Count of students in each state with normalized state names.
    Ensures unique state entries and consistent naming.
    """
    try:
        connection = get_db_connection()
        with connection.cursor() as cursor:
            # Normalize state names and aggregate counts
            sql = """
            SELECT 
                CASE 
                    WHEN state IN ('Gujrat', 'Gujarat') THEN 'Gujarat'
                    WHEN state IN ('Tamilnadu', 'Tamil Nadu') THEN 'Tamil Nadu'
                    ELSE state 
                END AS normalized_state,
                SUM(count) as total_count
            FROM (
                SELECT state, COUNT(*) as count 
                FROM lifeapp.users 
                WHERE `type` = 3 AND state != 2 
                GROUP BY state
            ) AS subquery
            GROUP BY normalized_state
            ORDER BY total_count DESC
            """
            cursor.execute(sql)
            result = cursor.fetchall()
            
            # Convert to list of dictionaries with consistent keys
            normalized_result = [
                {"count": row['total_count'], "state": row['normalized_state']} 
                for row in result
            ]
            
            return jsonify(normalized_result), 200
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        connection.close()

@app.route('/api/demograph-teachers' , methods = ['POST'])
def get_teacher_demograph():
    try:
        connection = get_db_connection()
        with connection.cursor() as cursor:
            # Normalize state names and aggregate counts
            sql = """
            SELECT 
                CASE 
                    WHEN state IN ('Gujrat', 'Gujarat') THEN 'Gujarat'
                    WHEN state IN ('Tamilnadu', 'Tamil Nadu') THEN 'Tamil Nadu'
                    ELSE state 
                END AS normalized_state,
                SUM(count) as total_count
            FROM (
                SELECT state, COUNT(*) as count 
                FROM lifeapp.users 
                WHERE `type` = 5 AND state != 2 
                GROUP BY state
            ) AS subquery
            GROUP BY normalized_state
            ORDER BY total_count DESC
            """
            cursor.execute(sql)
            result = cursor.fetchall()
            
            # Convert to list of dictionaries with consistent keys
            normalized_result = [
                {"count": row['total_count'], "state": row['normalized_state']} 
                for row in result
            ]
            
            return jsonify(normalized_result), 200
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        connection.close()

@app.route('/api/demograph-students-2', methods=['POST'])
def get_demograph_students_2():
    """
    Returns the count of students (type = 3) in each normalized state 
    grouped by a time period derived from the created_at column.
    Accepts a JSON payload with key "grouping" (daily, weekly, monthly, quarterly, yearly, lifetime)
    """
    try:
        data = request.get_json() or {}
        grouping = data.get('grouping', 'monthly').lower()
        allowed_groupings = ['daily', 'weekly', 'monthly', 'quarterly', 'yearly', 'lifetime']
        if grouping not in allowed_groupings:
            grouping = 'monthly'
        
        # Build the period expression based on the grouping value using created_at
        if grouping == 'daily':
            period_expr = "DATE(created_at)"
        elif grouping == 'weekly':
            period_expr = "CONCAT(YEAR(created_at), '-W', WEEK(created_at, 1))"
        elif grouping == 'monthly':
            period_expr = "DATE_FORMAT(created_at, '%Y-%m')"
        elif grouping == 'quarterly':
            period_expr = "CONCAT(YEAR(created_at), '-Q', QUARTER(created_at))"
        elif grouping == 'yearly':
            period_expr = "YEAR(created_at)"
        else:  # lifetime grouping: all rows in one group
            period_expr = "'lifetime'"
        
        connection = get_db_connection()
        with connection.cursor() as cursor:
            # First, group by state and created_at (so each row represents one state on a given day, week, etc.)
            # Then, in an outer query, group by the computed period and state.
            sql = f"""
                SELECT 
                    {period_expr} AS period,
                    normalized_state,
                    SUM(student_count) AS total_count
                FROM (
                    SELECT 
                        created_at,
                        CASE 
                            WHEN state IN ('Gujrat', 'Gujarat') THEN 'Gujarat'
                            WHEN state IN ('Tamilnadu', 'Tamil Nadu') THEN 'Tamil Nadu'
                            ELSE state 
                        END AS normalized_state,
                        COUNT(*) AS student_count
                    FROM lifeapp.users
                    WHERE `type` = 3 AND state != 2
                    GROUP BY state, created_at
                ) AS subquery
                GROUP BY period, normalized_state
                ORDER BY period, total_count DESC;
            """
            cursor.execute(sql)
            result = cursor.fetchall()
            
            formatted_result = [
                {"period": row['period'], "state": row['normalized_state'], "count": row['total_count']}
                for row in result
            ]
        return jsonify(formatted_result), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        connection.close()

@app.route('/api/demograph-teachers-2', methods=['POST'])
def get_teacher_demograph_2():
    """
    Returns count of teachers (type = 5) in each normalized state grouped by time period,
    based on the created_at column. Accepts a JSON payload with the key "grouping", which 
    can be daily, weekly, monthly, quarterly, yearly, or lifetime.
    """
    try:
        data = request.get_json() or {}
        grouping = data.get('grouping', 'monthly').lower()
        allowed_groupings = ['daily', 'weekly', 'monthly', 'quarterly', 'yearly', 'lifetime']
        if grouping not in allowed_groupings:
            grouping = 'monthly'
        
        # Build the period expression using created_at
        if grouping == 'daily':
            period_expr = "DATE(created_at)"
        elif grouping == 'weekly':
            period_expr = "CONCAT(YEAR(created_at), '-W', WEEK(created_at, 1))"
        elif grouping == 'monthly':
            period_expr = "DATE_FORMAT(created_at, '%Y-%m')"
        elif grouping == 'quarterly':
            period_expr = "CONCAT(YEAR(created_at), '-Q', QUARTER(created_at))"
        elif grouping == 'yearly':
            period_expr = "YEAR(created_at)"
        else:  # lifetime
            period_expr = "'lifetime'"
        
        connection = get_db_connection()
        with connection.cursor() as cursor:
            # First group by state and the individual created_at date, then in an outer query group by the computed period.
            sql = f"""
                SELECT 
                    {period_expr} AS period,
                    normalized_state,
                    SUM(teacher_count) AS total_count
                FROM (
                    SELECT 
                        created_at,
                        CASE 
                            WHEN state IN ('Gujrat', 'Gujarat') THEN 'Gujarat'
                            WHEN state IN ('Tamilnadu', 'Tamil Nadu') THEN 'Tamil Nadu'
                            ELSE state 
                        END AS normalized_state,
                        COUNT(*) AS teacher_count
                    FROM lifeapp.users 
                    WHERE `type` = 5 AND state != 2
                    GROUP BY state, created_at
                ) AS subquery
                GROUP BY period, normalized_state
                ORDER BY period, total_count DESC;
            """
            cursor.execute(sql)
            result = cursor.fetchall()
            
            formatted_result = [
                {"period": row['period'], "state": row['normalized_state'], "count": row['total_count']}
                for row in result
            ]
            
        return jsonify(formatted_result), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        connection.close()


@app.route('/api/student_count_by_level_778', methods=['POST'])
def student_count_by_level_778():
    """
    POST body (JSON) can include an optional "level" filter.
    If level is not provided or is 'all', then return counts for all levels:
      level1: type=3 and grade >= 1
      level2: type=3 and grade >= 6
      level3: type=3 and grade >= 7
      level4: type=3 and grade >= 8

    If level is specified (as "1", "2", "3" or "4"), then return:
      for level 1: count of students with type=3 and grade>=1,
      for level 2: count of students with type=3 and grade>=6,
      for level 3: count of students with type=3 and grade>=7,
      for level 4: count of students with type=3 and grade>=8.
    """
    level = None
    # if request.method == 'POST':
    data = request.get_json() or {}
    level = data.get('level', 'all')  # default to all

    try:
        connection = get_db_connection()
        with connection:
            with connection.cursor() as cursor:
                if level in [None, '', 'all']:
                    # Return counts for all levels
                    query = """
                    SELECT 
                        SUM(CASE WHEN type = 3 AND grade >= 1 THEN 1 ELSE 0 END) AS level1_count,
                        SUM(CASE WHEN type = 3 AND grade >= 6 THEN 1 ELSE 0 END) AS level2_count,
                        SUM(CASE WHEN type = 3 AND grade >= 7 THEN 1 ELSE 0 END) AS level3_count,
                        SUM(CASE WHEN type = 3 AND grade >= 8 THEN 1 ELSE 0 END) AS level4_count
                    FROM lifeapp.users;
                    """
                    cursor.execute(query)
                    result = cursor.fetchone()
                    return jsonify(result)
                else:
                    # For a specified level, choose condition accordingly.
                    if level == "1":
                        cond = "grade >= 1"
                    elif level == "2":
                        cond = "grade >= 6"
                    elif level == "3":
                        cond = "grade >= 7"
                    elif level == "4":
                        cond = "grade >= 8"
                    else:
                        return jsonify({"error": "Invalid level parameter"}), 400

                    query = f"""
                    SELECT COUNT(*) AS count 
                    FROM lifeapp.users
                    WHERE type = 3 AND {cond};
                    """
                    cursor.execute(query)
                    result = cursor.fetchone()
                    return jsonify({
                        'level1_count': result[0],
                        'level2_count': result[1],
                        'level3_count': result[2],
                        'level4_count': result[3]
                    })
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    

#### permission denied in digital ocean,
@app.route('/api/correct-tamil-nadu-users', methods=['POST'])
def correction_tamil_nadu_users():
    sql = """
        UPDATE lifeapp.users 
        SET state = 'Tamil Nadu' 
        WHERE state = 'Tamilnadu';
    """
    try:
        connection = get_db_connection()
        with connection.cursor() as cursor:
            cursor.execute(sql)
            connection.commit()  # Commit the transaction
        return jsonify({"message": "Success in correcting the name"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        connection.close()

@app.route('/api/students-by-grade', methods = ['POST'])
def get_students_by_grade():
    sql = """
        select count(*) as count, grade 
	        from lifeapp.users 
		    where `type` = 3 
            group by grade 
            order by grade;

    """
    try:
        connection = get_db_connection()
        with connection.cursor() as cursor:
            cursor.execute(sql)
            result = cursor.fetchall()  
        return jsonify(result), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        connection.close()

@app.route('/api/teachers-by-grade', methods = ['POST'])
def get_teachers_by_grade() :
    sql= """
        select count(distinct user_id) as count, la_grade_id as grade 
            from lifeapp.la_teacher_grades 
            group by la_grade_id 
            order by la_grade_id;

    """
    try:
        connection = get_db_connection()
        with connection.cursor() as cursor:
            cursor.execute(sql)
            result = cursor.fetchall()  
        return jsonify(result), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        connection.close()

@app.route('/api/school_count', methods = ['POST'])
def get_school_count():
    sql = """
        select count(distinct name) as count from lifeapp.schools where is_life_lab = 1 and deleted_at is null;
    """
    try:
        connection = get_db_connection()
        with connection.cursor() as cursor:
            cursor.execute(sql)
            result = cursor.fetchall()  
        return jsonify(result), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        connection.close()

@app.route('/api/challenges-completed-per-mission', methods= ['POST'])
def get_challenges_completed_per_mission():
    sql = """
        select count(*) as count , lac.la_mission_id, lam.title, lev.description  
            from lifeapp.la_mission_completes lac 
                inner join lifeapp.la_missions lam 
                on 
                lam.id = lac.la_mission_id 
                inner join lifeapp.la_levels lev
                on
                lam.la_level_id = lev.id
        group by lac.la_mission_id 
        order by lac.la_mission_id;

    """
    try:
        connection = get_db_connection()
        with connection.cursor() as cursor:
            cursor.execute(sql)
            result = cursor.fetchall()  
        return jsonify(result), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        connection.close()

@app.route('/api/total-points-earned', methods = ['POST'])
def get_total_points_earned():
    sql = """
        select sum(points) as total_points from lifeapp.la_mission_completes;
    """
    try:
        connection = get_db_connection()
        with connection.cursor() as cursor:
            cursor.execute(sql)
            result = cursor.fetchall()  
        return jsonify(result), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        connection.close()

@app.route('/api/total-points-redeemed', methods = ['POST'])
def get_total_points_redeemed():
    sql  = """
        select sum(coins) as total_coins_redeemed from lifeapp.coupon_redeems;
    """
    try:
        connection = get_db_connection()
        with connection.cursor() as cursor:
            cursor.execute(sql)
            result = cursor.fetchall()  
        return jsonify(result), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        connection.close()

@app.route('/api/total-missions-completed-assigned-by-teacher', methods = ['POST'])
def get_total_missions_completed_assigned_by_teacher():
    sql  = """
        SELECT count(*) as count FROM lifeapp.la_mission_assigns lama INNER JOIN lifeapp.la_mission_completes lamc 
            ON lamc.la_mission_id = lama.la_mission_id
                and lamc.user_id =lama.user_id;
    """
    try:
        connection = get_db_connection()
        with connection.cursor() as cursor:
            cursor.execute(sql)
            result = cursor.fetchall()  
        return jsonify(result), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        connection.close()

@app.route('/api/teacher-count', methods = ['POST'])
def get_teacher_count():
    # select count(*) as total_count from lifeapp.users where `type` = 5;
    sql = """
        
        select sum(total_count) as total_count from (
            select count(distinct user_id) as total_count, la_grade_id
                from lifeapp.la_teacher_grades
                group by la_grade_id
        ) as teacher_count; 
    """
    try:
        connection = get_db_connection()
        with connection.cursor() as cursor:
            cursor.execute(sql)
            result = cursor.fetchall()  
        return jsonify(result), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        connection.close()


###################################################################################
###################################################################################
################# MENTOR DASHBOARD AND SESSION APIs ###############################
###################################################################################
###################################################################################
@app.route('/api/mentor_dashboard_table', methods = ['POST'])
def get_mentor_dashboard_table():
    sql = """
        select id, name, email, mobile_no, pin as mentor_code from lifeapp.users where `type` = 4;
    """
    try:
        connection = get_db_connection()
        with connection.cursor() as cursor:
            cursor.execute(sql)
            result = cursor.fetchall()  
        return jsonify(result), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        connection.close()

@app.route('/api/update_mentor', methods=['POST'])
def update_mentor():
    filters = request.get_json()
    mentor_id = filters.get('id')

    if not mentor_id:
        return jsonify({'error': 'Mentor ID is required'}), 400

    # Extracting fields to update
    name = filters.get('name')
    email = filters.get('email')
    mobile_no = filters.get('mobile_no')
    city = filters.get('city')
    state = filters.get('state')
    pin = filters.get('pin')
    updated_at = datetime.now().strftime('%Y-%m-%d %H:%M:%S')  # Get current timestamp

    try:
        connection = get_db_connection()
        cursor = connection.cursor()

        query = """
            UPDATE lifeapp.users
            SET name = %s, email = %s, mobile_no = %s, city = %s, state = %s, pin = %s, updated_at = %s
            WHERE id = %s
        """
        values = (name, email, mobile_no, city, state, pin, updated_at, mentor_id)
        
        cursor.execute(query, values)
        connection.commit()
        cursor.close()
        connection.close()
        
        return jsonify({'success': True, 'message': 'Mentor updated successfully'}), 200
    except Error as e:
        print("Error updating mentor:", e)
        return jsonify({'error': 'Internal server error', 'details': str(e)}), 500

@app.route('/api/delete_mentor', methods=['DELETE'])
def delete_mentor():
    filters = request.get_json()
    mentor_id = filters.get('id')

    if not mentor_id:
        return jsonify({'error': 'Mentor ID is required'}), 400

    try:
        connection = get_db_connection()
        cursor = connection.cursor()

        query = "DELETE FROM lifeapp.users WHERE id = %s"
        cursor.execute(query, (mentor_id,))
        connection.commit()
        cursor.close()
        connection.close()
        
        return jsonify({'success': True, 'message': 'Mentor deleted successfully'}), 200
    except Error as e:
        print("Error deleting mentor:", e)
        return jsonify({'error': 'Internal server error', 'details': str(e)}), 500



###################################################################################



###################################################################################
###################################################################################
######################## SETTINGS/SUBJECTS APIs ###################################
###################################################################################
###################################################################################

# @app.route('/api/subjects_list', methods=['POST'])
# def get_subjects():
#     """Fetch all subjects."""
#     try:
#         connection = get_db_connection()
#         with connection.cursor() as cursor:
#             sql = "SELECT id, title, heading, image, status FROM lifeapp.la_subjects ORDER BY id;"
#             cursor.execute(sql)
#             subjects = cursor.fetchall()
#         return jsonify(subjects)
#     except Exception as e:
#         return jsonify({'error': str(e)}), 500
#     finally:
#         connection.close()

@app.route('/api/subjects_list', methods=['POST'])
def get_subjects():
    """Fetch subjects with an optional status filter.
       Expects a JSON payload with key 'status' that can be "1", "0", or "all".
       "all" returns all subjects.
    """
    try:
        data = request.get_json() or {}
        status = data.get('status', 'all')  # Default to "all" if not provided

        connection = get_db_connection()
        with connection.cursor() as cursor:
            sql = "SELECT id, title, heading, image, status FROM lifeapp.la_subjects WHERE 1=1"
            filters = []
            if status != "all":
                sql += " AND status = %s"
                filters.append(int(status))
            sql += " ORDER BY id;"
            cursor.execute(sql, filters)
            subjects = cursor.fetchall()
        return jsonify(subjects)
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        connection.close()





@app.route('/api/subjects_new', methods=['POST'])
def create_subject():
    """Create a new subject."""
    try:
        filters = request.get_json or {}
        title = filters.get('title')
        heading = filters.get('heading')
        created_by  = filters.get('created_by')
        imageId = filters.get('imageId')

        if created_by == 'Admin':
            created_no = 1
        elif created_by == 'Mentor':
            created_no  = 4
        elif created_by == 'Teacher':
            created_no  = 5
        connection = get_db_connection()
        with connection.cursor() as cursor:
            sql = """
                INSERT INTO lifeapp.la_subjects (title, heading, created_by, image)
                VALUES (%s, %s, %s, %s, %s)
            """
            cursor.execute(sql, (title, heading, created_no, imageId))
            connection.commit()
        return jsonify({'message': 'Subject Created'}), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        connection.close()


@app.route('/api/subjects/<int:subject_id>', methods=['PUT'])
def update_subject(subject_id):
    """Update a subject."""
    try:
        filters = request.get_json or {}
        title = filters.get('title')
        heading = filters.get('heading')
        created_by  = filters.get('created_by')
        subject_id = filters.get('id')
        imageId = filters.get('imageId')
        if created_by == 'Admin':
            created_no = 1
        elif created_by == 'Mentor':
            created_no  = 4
        elif created_by == 'Teacher':
            created_no  = 5

        connection = get_db_connection()
        with connection.cursor() as cursor:
            sql = """
                UPDATE lifeapp.la_subjects
                SET title = %s, heading = %s, image = %s
                WHERE id = %s
            """
            cursor.execute(sql, (title, heading, created_no, imageId, subject_id))
            connection.commit()
        return jsonify({'message': 'Subject Updated'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        connection.close()


@app.route('/api/subjects/<int:subject_id>/status', methods=['PATCH'])
def change_subject_status(subject_id):
    """Change the status of a subject."""
    try:
        filters =  request.get_json() or {}
        status  = filters.get('status')
        if status == 'ACTIVE':
            status_no = 1
        else:
            status_no = 0
        connection = get_db_connection()

        with connection.cursor() as cursor:
            sql = "UPDATE lifeapp.la_subjects SET status = IF(%s=1, 0, 1) WHERE id = %s"
            cursor.execute(sql, (status_no,subject_id,))
            connection.commit()
        return jsonify({'message': 'Subject Status Changed'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        connection.close()


###################################################################################
###################################################################################
######################## SETTINGS/LEVELS APIs ###################################
###################################################################################
###################################################################################
@app.route('/api/levels', methods=['POST'])
def get_levels():
    """Fetch all levels with pagination."""
    connection = None
    try:
        filters = request.get_json() or {}
        page = filters.get('page', 1)
        per_page = 25  # Default pagination limit
        offset = (page - 1) * per_page

        connection = get_db_connection()
        if connection is None:
            raise Exception("Database connection failed")

        with connection.cursor() as cursor:
            sql = "SELECT * FROM lifeapp.la_levels ORDER BY id ASC LIMIT %s OFFSET %s"
            cursor.execute(sql, (per_page, offset))
            levels = cursor.fetchall()
        
        return jsonify(levels)

    except Exception as e:
        return jsonify({'error': str(e)}), 500

    finally:
        if connection:  # Check if connection is not None
            connection.close()



@app.route('/api/levels_new', methods=['POST'])
def create_level():
    """Create a new level."""
    try:
        data = request.get_json() or {}
        title_data = data.get('title', {})
        description_data = data.get('description', {})
        jigyasa_points= data.get('jigyasa_points')
        mission_points= data.get('mission_points')
        pragya_points=data.get('pragya_points')
        puzzle_points= data.get('puzzle_points')
        puzzle_time =data.get('puzzle_time')
        quiz_points=  data.get('quiz_points')
        quiz_time= data.get('quiz_time')
        riddle_points= data.get('riddle_points')
        riddle_time= data.get('riddle_time')
        status= data.get('status')
        datetime_str = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        params = [json.dumps(title_data), json.dumps(description_data),jigyasa_points,mission_points,
                    pragya_points,puzzle_points, puzzle_time,quiz_points,quiz_time, riddle_points,riddle_time,status, datetime_str]
        connection = get_db_connection()
        with connection.cursor() as cursor:
            sql = """
                INSERT INTO la_levels (title, description,jigyasa_points,mission_points,
                    pragya_points,puzzle_points, puzzle_time,quiz_points,quiz_time, riddle_points,riddle_time,status, created_by)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """
            cursor.execute(sql, params)
            connection.commit()
        return jsonify({'message': 'Level Created'}), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        connection.close()


@app.route('/api/levels_update', methods=['POST'])
def update_level(level_id):
    """Update a level."""
    try:
        data = request.get_json() or {}
        id = data.get('id')
        title_data = data.get('title', {})
        description_data = data.get('description', {})
        jigyasa_points= data.get('jigyasa_points')
        mission_points= data.get('mission_points')
        pragya_points=data.get('pragya_points')
        puzzle_points= data.get('puzzle_points')
        puzzle_time =data.get('puzzle_time')
        quiz_points=  data.get('quiz_points')
        quiz_time= data.get('quiz_time')
        riddle_points= data.get('riddle_points')
        riddle_time= data.get('riddle_time')
        status= data.get('status')
        datetime_str = datetime.now().strftime('%Y-%m-%d %H:%M:%S')

        params = [json.dumps(title_data), json.dumps(description_data),jigyasa_points,mission_points,
                    pragya_points,puzzle_points, puzzle_time,quiz_points,quiz_time, riddle_points,riddle_time,status, datetime_str, id]
        
        connection = get_db_connection()
        with connection.cursor() as cursor:
            sql = """
                UPDATE lifeapp.la_levels
                SET 
                    title = %s, description = %s,
                    jigyasa_points = %s, mission_points = %s,  pragya_points =%s,
                    puzzle_points = %s, puzzle_time = %s, quiz_points = %s,
                    quiz_time = %s, riddle_points = %s, riddle_time = %s,
                    status = %s, updated_at = %s
                WHERE id = %s
            """
            cursor.execute(sql, params)
            connection.commit()
        return jsonify({'message': 'Level Updated'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        connection.close()


@app.route('/api/levels_delete', methods=['POST'])
def delete_level():
    """Delete a level."""
    try:
        data = request.get_json() or {}
        level_id = data.get('id')

        if not level_id:
            return jsonify({'error': 'Missing level ID'}), 400

        connection = get_db_connection()
        with connection.cursor() as cursor:
            sql = "DELETE FROM lifeapp.la_levels WHERE id = %s"
            cursor.execute(sql, (level_id,))
            connection.commit()

        return jsonify({'message': 'Level deleted successfully'}), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        connection.close()



###################################################################################
###################################################################################
######################## SETTINGS/LANGUAGES APIs ###################################
###################################################################################
###################################################################################

@app.route('/api/languages', methods=['POST'])
def get_languages():
    """Fetch all languages with pagination."""
    try:
        filters = request.get_json() or {}
        page = filters.get('page', 1)
        per_page = 25  # Default pagination limit
        offset = (page - 1) * per_page

        connection = get_db_connection()
        with connection.cursor() as cursor:
            sql = "SELECT * FROM lifeapp.languages ORDER BY title LIMIT %s OFFSET %s"
            cursor.execute(sql, (per_page, offset))
            languages = cursor.fetchall()
        return jsonify(languages)
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        connection.close()


@app.route('/api/languages_new', methods=['POST'])
def create_language():
    """Create a new language."""
    try:
        data = request.get_json() or {}
        title = data.get('title', '')
        slug = data.get('slug', '').strip().lower()
        status = data.get('status')
        if not slug:
            return jsonify({'error': 'Slug is required'}), 400

        connection = get_db_connection()
        with connection.cursor() as cursor:
            # Check if slug already exists
            cursor.execute("SELECT COUNT(*) FROM lifeapp.languages WHERE slug = %s", (slug,))
            exists = cursor.fetchone()
            if exists and exists[0] > 0:
                return jsonify({'error': 'Slug already exists'}), 400

            sql = "INSERT INTO lifeapp.languages (slug, title, status) VALUES (%s, %s, %s)"
            cursor.execute(sql, (slug, title, status))  # 1 for Active status
            connection.commit()
        return jsonify({'message': 'Language Created'}), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        connection.close()


@app.route('/api/languages_update', methods=['POST'])
def update_language():
    """Update a language."""
    try:
        data = request.get_json() or {}
        language_id = data.get('id')
        title = data.get('title', '').strip()
        status = data.get('status').strip()
        slug = data.get('slug', '').strip().lower()

        if not language_id or not slug:
            return jsonify({'error': 'ID and Slug are required'}), 400

        connection = get_db_connection()
        with connection.cursor() as cursor:
            # Check if slug already exists for another language
            cursor.execute("SELECT COUNT(*) FROM lifeapp.languages WHERE slug = %s AND id != %s", (slug, language_id))
            exists = cursor.fetchone()
            if exists and exists[0] > 0:
                return jsonify({'error': 'Slug already exists'}), 400

            sql = "UPDATE lifeapp.languages SET slug = %s, title = %s, status = %s WHERE id = %s"
            cursor.execute(sql, (slug, title, status, language_id))
            connection.commit()
        return jsonify({'message': 'Language Updated'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        connection.close()


@app.route('/api/languages_delete/<int:language_id>', methods=['DELETE'])
def delete_language(language_id):
    """Delete a language."""
    try:
        connection = get_db_connection()
        with connection.cursor() as cursor:
            sql = "DELETE FROM lifeapp.languages WHERE id = %s"
            cursor.execute(sql, (language_id,))
            connection.commit()
        return jsonify({'message': 'Language Deleted'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        connection.close()


@app.route('/api/languages/<int:language_id>/status', methods=['PATCH'])
def change_language_status(language_id):
    """Change the status of a language."""
    try:
        connection = get_db_connection()
        with connection.cursor() as cursor:
            sql = "UPDATE languages SET status = IF(status='ACTIVE', 'DEACTIVE', 'ACTIVE') WHERE id = %s"
            cursor.execute(sql, (language_id,))
            connection.commit()
        return jsonify({'message': 'Language Status Changed'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        connection.close()




###################################################################################
###################################################################################
######################## SETTINGS/SECTIONS APIs ###################################
###################################################################################
###################################################################################

@app.route('/api/sections', methods=['POST'])
def get_sections():
    """Fetch list of sections."""
    try:
        filters = request.get_json() or {}
        status = filters.get('status')
        connection = get_db_connection()
        with connection.cursor() as cursor:
            sql = "SELECT * FROM lifeapp.la_sections"
            if status is not None:  # Ensure status=0 is also considered
                sql += " WHERE status = %s"
                cursor.execute(sql, (status,))
            else:
                cursor.execute(sql)

            result = cursor.fetchall()
        return jsonify(result)
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        connection.close()

@app.route('/api/sections_new', methods=['POST'])
def create_section():
    """Create a new section."""
    try:
        data = request.get_json() or {}
        status = data.get('status')
        name = data.get('name')
        datetime_str = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        if not name:
            return jsonify({'error': 'Name is required'}), 400
        connection = get_db_connection()
        with connection.cursor() as cursor:
            cursor.execute("INSERT INTO lifeapp.la_sections (name, status, created_at, updated_at) VALUES (%s, %s)", (name,status, datetime_str, datetime_str))
            connection.commit()
        return jsonify({'message': 'Section created successfully'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        connection.close()

@app.route('/api/sections_update', methods=['POST'])
def update_section(section_id):
    """Update section details."""
    try:
        data = request.get_json() or {}
        name = data.get('name')
        section_id = data.get('id')
        status = data.get('status')
        datetime_str = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        if not name:
            return jsonify({'error': 'Name is required'}), 400
        connection = get_db_connection()
        with connection.cursor() as cursor:
            cursor.execute("UPDATE lifeapp.la_sections SET name = %s, status = %s, updated_at = %s WHERE id = %s", (name,status, datetime_str, section_id))
            connection.commit()
        return jsonify({'message': 'Section updated successfully'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        connection.close()

@app.route('/api/sections_delete', methods=['POST'])
def delete_section():
    """Delete a section."""
    try:
        data = request.get_json() or {}
        section_id = data.get('id')

        if not section_id:
            return jsonify({'error': 'Section ID is required'}), 400

        connection = get_db_connection()
        with connection.cursor() as cursor:
            cursor.execute("DELETE FROM lifeapp.la_sections WHERE id = %s", (section_id,))
            connection.commit()

        return jsonify({'message': 'Section deleted successfully'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        connection.close()


@app.route('/api/sections/<int:section_id>/status', methods=['PATCH'])
def toggle_section_status(section_id):
    """Toggle the status of a section."""
    try:
        connection = get_db_connection()
        with connection.cursor() as cursor:
            cursor.execute("SELECT status FROM la_sections WHERE id = %s", (section_id,))
            section = cursor.fetchone()
            if not section:
                return jsonify({'error': 'Section not found'}), 404
            new_status = 'inactive' if section['status'] == 'active' else 'active'
            cursor.execute("UPDATE la_sections SET status = %s WHERE id = %s", (new_status, section_id))
            connection.commit()
        return jsonify({'message': 'Section status changed', 'status': new_status})
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        connection.close()



###################################################################################
###################################################################################
######################## SCHOOLS/DASHBOARD APIs ###################################
###################################################################################
###################################################################################
@app.route('/api/count_school_state_dashboard', methods= ['POST'])
def get_count_school_rate_dashboard():
    connection = get_db_connection()
    try:
       
        with connection.cursor() as cursor:
            #execute sql query
            sql = """
            select state, count(*) as count from lifeapp.schools 
            where state != 'null' and state != '2' group by state order by count desc;
            """
            cursor.execute(sql)
            result = cursor.fetchall()
        return jsonify(result)
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        connection.close()

@app.route('/api/demograph-schools', methods=['POST'])
def get_schools_demograph():
    data = request.get_json() or {}
    grouping = data.get('grouping', 'monthly').lower()
    allowed_groupings = ['daily', 'weekly', 'monthly', 'quarterly', 'yearly', 'lifetime']
    if grouping not in allowed_groupings:
        grouping = 'monthly'
    
    # Build the period expression based on the grouping value using created_at.
    if grouping == 'daily':
        period_expr = "DATE(created_at)"
    elif grouping == 'weekly':
        period_expr = "CONCAT(YEAR(created_at), '-W', WEEK(created_at, 1))"
    elif grouping == 'monthly':
        period_expr = "DATE_FORMAT(created_at, '%Y-%m')"
    elif grouping == 'quarterly':
        period_expr = "CONCAT(YEAR(created_at), '-Q', QUARTER(created_at))"
    elif grouping == 'yearly':
        period_expr = "YEAR(created_at)"
    else:  # lifetime grouping: group all records together
        period_expr = "'lifetime'"
    
    connection = get_db_connection()
    try:
        with connection.cursor() as cursor:
            # First, group by state and created_at, then group that in an outer query.
            sql = f"""
                SELECT 
                    {period_expr} AS period,
                    normalized_state,
                    SUM(school_count) AS total_count
                FROM (
                    SELECT 
                        created_at,
                        CASE 
                            WHEN state IN ('Gujrat', 'Gujarat') THEN 'Gujarat'
                            WHEN state IN ('Tamilnadu', 'Tamil Nadu') THEN 'Tamil Nadu'
                            ELSE state 
                        END AS normalized_state,
                        COUNT(*) AS school_count
                    FROM lifeapp.schools
                    WHERE state != 'null' AND state != '2'
                    GROUP BY state, created_at
                ) AS subquery
                GROUP BY period, normalized_state
                ORDER BY period, total_count DESC;
            """
            cursor.execute(sql)
            result = cursor.fetchall()
            formatted_result = [
                {"period": row['period'], "state": row['normalized_state'], "count": row['total_count']}
                for row in result
            ]
        return jsonify(formatted_result), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        connection.close()

###################################################################################
###################################################################################
######################## MENTORS/DASHBOARD APIs ###################################
###################################################################################
###################################################################################
@app.route('/api/mentors', methods=['POST'])
def get_mentors():
    """Fetch list of mentors with optional filters for state, mobile number, and mentor_code."""
    try:
        filters = request.get_json() or {}
        state_filter = filters.get('state')
        mobile_filter = filters.get('mobile_no')
        mentor_code_filter = filters.get('mentor_code')
        
        connection = get_db_connection()
        with connection.cursor() as cursor:
            # Base query: selecting mentors (type 4)
            sql = """
                SELECT id, name, email, mobile_no, pin, gender, dob, state, city 
                FROM lifeapp.users 
                WHERE `type` = 4
            """
            conditions = []
            params = []
            if state_filter:
                conditions.append(" state = %s")
                params.append(state_filter)
            if mobile_filter:
                conditions.append(" mobile_no = %s")
                params.append(mobile_filter)
            if mentor_code_filter:
                conditions.append(" pin = %s")
                params.append(mentor_code_filter)
            if conditions:
                sql += " AND " + " AND ".join(conditions)
            cursor.execute(sql, tuple(params))
            result = cursor.fetchall()
        return jsonify(result)
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        connection.close()


@app.route('/api/add_mentor', methods=['POST'])
def add_mentor():
    """Add a new mentor to the database."""
    try:
        data = request.get_json()
        datetime_str = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        connection = get_db_connection()
        with connection.cursor() as cursor:
            sql = """
                INSERT INTO lifeapp.users 
                (name, email, mobile_no, pin, board_name, school_code, user_rank, created_by, la_grade_id, la_board_id, 
                 la_section_id, device_token, device, updated_at, created_at, remember_token, otp, image_path, 
                 profile_image, brain_coins, heart_coins, earn_coins, password, address, state, city, grade, 
                 gender, dob, `type`, username, guardian_name, school_id)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, 
                        %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """
            cursor.execute(sql, (
                data['name'], data['email'], data['mobile_no'], data['pin'], None, None,
                None, None, None, None, None,
                None, None, datetime_str, datetime_str, None,
                None, None, None, None, None, 
                None, None, None, data['state'], data['city'], None, 
                data['gender'], data['dob'], 4, None, None, None
            ))
            connection.commit()
        return jsonify({'message': 'Mentor added successfully'}), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        connection.close()

@app.route('/api/update_mentor', methods=['POST'])
def do_update_mentor():
    """Update an existing mentor in the database."""
    try:
        data = request.get_json()
        datetime_str = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        connection = get_db_connection()
        with connection.cursor() as cursor:
            sql = """
                UPDATE lifeapp.users
                SET name = %s,
                    email = %s,
                    mobile_no = %s,
                    pin = %s,
                    state = %s,
                    city = %s,
                    gender = %s,
                    dob = %s,
                    updated_at = %s
                WHERE id = %s AND `type` = 4
            """
            cursor.execute(sql, (
                data['name'],
                data['email'],
                data['mobile_no'],
                data['pin'],
                data['state'],
                data['city'],
                data['gender'],
                data['dob'],
                datetime_str,
                data['id']
            ))
            connection.commit()
        return jsonify({'message': 'Mentor updated successfully'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        connection.close()

@app.route('/api/delete_mentor', methods=['POST'])
def do_delete_mentor():
    """Delete a mentor from the database."""
    try:
        data = request.get_json()
        mentor_id = data.get('id')

        if not mentor_id:
            return jsonify({'error': 'Mentor ID is required'}), 400

        connection = get_db_connection()
        with connection.cursor() as cursor:
            sql = "DELETE FROM lifeapp.users WHERE id = %s AND `type` = 4"
            cursor.execute(sql, (mentor_id,))
            connection.commit()

        return jsonify({'message': 'Mentor deleted successfully'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        connection.close()


###################################################################################
###################################################################################
######################## MENTORS/SESSIONS APIs ###################################
###################################################################################
###################################################################################
@app.route('/api/sessions', methods=['POST'])
def get_sessions():
    """Fetch all mentor sessions with user name and status."""
    try:
        connection = get_db_connection()
        with connection.cursor() as cursor:
            sql = """
                SELECT 
                    las.id,
                    u.name,
                    las.heading,
                    las.zoom_link,
                    las.zoom_password,
                    las.date_time,
                    las.status
                FROM 
                    lifeapp.la_sessions las
                INNER JOIN 
                    lifeapp.users u ON las.user_id = u.id
                ORDER BY las.date_time DESC
            """
            cursor.execute(sql)
            sessions = cursor.fetchall()

        return jsonify(sessions), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        connection.close()

@app.route('/api/update_session', methods=['POST'])
def update_session():
    """Update an existing session's heading, description, and status."""
    try:
        data = request.get_json()
        session_id = data.get('id')
        heading = data.get('heading')
        description = data.get('description')
        status = data.get('status')

        connection = get_db_connection()
        with connection.cursor() as cursor:
            sql = """
                UPDATE lifeapp.la_sessions
                SET heading = %s, description = %s, status = %s
                WHERE id = %s
            """
            cursor.execute(sql, (heading, description, status, session_id))
            connection.commit()
        return jsonify({'message': 'Session updated successfully'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        connection.close()

@app.route('/api/session_participants', methods=['POST'])
def get_session_participants():
    """Get all participants of a given session ID."""
    try:
        data = request.get_json()
        session_id = data.get('session_id')

        connection = get_db_connection()
        with connection.cursor() as cursor:
            sql = """
                SELECT 
                    u.school_id, 
                    u.name, 
                    u.mobile_no, 
                    u.grade, 
                    u.city, 
                    u.state,
                    lasp.la_session_id 
                FROM 
                    lifeapp.users u 
                INNER JOIN 
                    lifeapp.la_session_participants lasp 
                ON 
                    u.id = lasp.user_id
                WHERE
                    lasp.la_session_id = %s;
            """
            cursor.execute(sql, (session_id,))
            participants = cursor.fetchall()
        return jsonify(participants), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        connection.close()

@app.route('/api/session_participants_total', methods = ['POST'])
def get_session_participants_total():
    connection = get_db_connection()
    try:
        with connection.cursor() as cursor:
            sql = """
                select count(*) as count from lifeapp.la_session_participants;
            """
            cursor.execute(sql)
            count = cursor.fetchall()
        return jsonify(count), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        connection.close()

@app.route('/api/mentor_participated_in_sessions_total', methods = ['POST'])
def get_mentor_participated_in_sessions_total():
    connection = get_db_connection()
    try:
        with connection.cursor() as cursor:
            sql = """
                select count(*) as count from lifeapp.la_session_participants lasp 
                inner join lifeapp.users u on u.id = lasp.user_id where u.type = 4 or u.type = 5;
            """
            cursor.execute(sql)
            count = cursor.fetchall()
        return jsonify(count), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        connection.close()
    


###################################################################################
###################################################################################
############### RESOURCES/STUDENT_RELATED/QUIZ SESSIONS APIs ######################
###################################################################################
###################################################################################
@app.route('/api/quiz_sessions', methods=['POST'])
def get_quiz_sessions():
    try:
        connection = get_db_connection()
        with connection.cursor() as cursor:
            sql = """
                SELECT 
                    laqg.id,
                    laqg.user_id,
                    laqg.game_code AS game_id,
                    las.title AS subject_title,
                    lal.title AS level_title,
                    lat.title AS topic_title,
                    laqg.time AS time_taken,
                    laqgr.total_questions,
                    laqgr.total_correct_answers,
                    u.name AS user_name,
                    ls.name AS school_name,
                    u.earn_coins,
                    u.heart_coins,
                    u.brain_coins
                FROM lifeapp.la_quiz_games laqg
                INNER JOIN lifeapp.la_quiz_game_results laqgr 
                    ON laqg.game_code = laqgr.la_quiz_game_id
                    AND laqg.user_id = laqgr.user_id
                INNER JOIN lifeapp.users u 
                    ON u.id = laqg.user_id
                INNER JOIN lifeapp.la_subjects las 
                    ON las.id = laqg.la_subject_id
                INNER JOIN lifeapp.la_levels lal 
                    ON lal.id = laqg.la_level_id
                INNER JOIN lifeapp.la_topics lat 
                    ON lat.id = laqg.la_topic_id
                INNER JOIN lifeapp.schools ls 
                    ON ls.id = u.school_id;
            """
            cursor.execute(sql)
            result = cursor.fetchall()
        return jsonify(result), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        connection.close()

# @app.route('/api/quiz_sessions', methods=['POST'])
# def get_quiz_sessions():
#     try:
#         data = request.get_json()
#         page = int(data.get('page', 1))
#         limit = int(data.get('limit', 10))
#         offset = (page - 1) * limit

#         connection = get_db_connection()
#         with connection.cursor() as cursor:
#             # Main paginated data
#             cursor.execute(f"""
#                 WITH sessionized_data AS (
#                     SELECT 
#                         *,
#                         @session_group := CASE 
#                             WHEN TIMESTAMPDIFF(SECOND, @prev_created_at, created_at) > 5 
#                                  OR @prev_user_id != user_id 
#                                  OR @prev_game_id != la_quiz_game_id 
#                             THEN @session_group + 1 
#                             ELSE @session_group 
#                         END AS session_group,
#                         @prev_created_at := created_at,
#                         @prev_user_id := user_id,
#                         @prev_game_id := la_quiz_game_id
#                     FROM 
#                         lifeapp.la_quiz_game_results,
#                         (SELECT @prev_created_at := NULL, @prev_user_id := NULL, @prev_game_id := NULL, @session_group := 0) vars
#                     ORDER BY 
#                         user_id, la_quiz_game_id, created_at
#                 ),
#                 ranked_entries AS (
#                     SELECT 
#                         *,
#                         ROW_NUMBER() OVER (
#                             PARTITION BY user_id, la_quiz_game_id, session_group 
#                             ORDER BY created_at
#                         ) AS session_rank
#                     FROM sessionized_data
#                 )
#                 SELECT 
#                     id,
#                     la_quiz_game_id,
#                     user_id,
#                     total_questions,
#                     total_correct_answers,
#                     coins,
#                     created_at,
#                     updated_at
#                 FROM ranked_entries
#                 WHERE session_rank = 1
#                 ORDER BY user_id, la_quiz_game_id, created_at
#                 LIMIT %s OFFSET %s;
#             """, (limit, offset))
#             results = cursor.fetchall()

#             # Total count of grouped sessions
#             cursor.execute("""
#                 WITH sessionized_data AS (
#                     SELECT 
#                         *,
#                         @session_group := CASE 
#                             WHEN TIMESTAMPDIFF(SECOND, @prev_created_at, created_at) > 5 
#                                  OR @prev_user_id != user_id 
#                                  OR @prev_game_id != la_quiz_game_id 
#                             THEN @session_group + 1 
#                             ELSE @session_group 
#                         END AS session_group,
#                         @prev_created_at := created_at,
#                         @prev_user_id := user_id,
#                         @prev_game_id := la_quiz_game_id
#                     FROM 
#                         lifeapp.la_quiz_game_results,
#                         (SELECT @prev_created_at := NULL, @prev_user_id := NULL, @prev_game_id := NULL, @session_group := 0) vars
#                     ORDER BY 
#                         user_id, la_quiz_game_id, created_at
#                 ),
#                 ranked_entries AS (
#                     SELECT 
#                         *,
#                         ROW_NUMBER() OVER (
#                             PARTITION BY user_id, la_quiz_game_id, session_group 
#                             ORDER BY created_at
#                         ) AS session_rank
#                     FROM sessionized_data
#                 )
#                 SELECT COUNT(*) AS total FROM ranked_entries WHERE session_rank = 1;
#             """)
#             total = cursor.fetchone()['total']

#         return jsonify({'data': results, 'total': total}), 200

#     except Exception as e:
#         return jsonify({'error': str(e)}), 500
#     finally:
#         connection.close()


@app.route('/api/game_questions', methods=['POST'])
def get_game_questions():
    try:
        data = request.get_json()
        game_code = data.get("game_code")

        connection = get_db_connection()
        with connection.cursor(pymysql.cursors.DictCursor) as cursor:
            sql = """
            WITH RECURSIVE split_questions AS (
                SELECT 
                    game_code,
                    TRIM(BOTH '[]' FROM questions) AS cleaned_questions,
                    1 AS pos,
                    SUBSTRING_INDEX(TRIM(BOTH '[]' FROM questions), ',', 1) AS question_id,
                    SUBSTRING(TRIM(BOTH '[]' FROM questions), LENGTH(SUBSTRING_INDEX(TRIM(BOTH '[]' FROM questions), ',', 1)) + 2) AS remaining
                FROM lifeapp.la_quiz_games
                WHERE questions != '0' AND game_code = %s

                UNION ALL

                SELECT 
                    game_code,
                    cleaned_questions,
                    pos + 1,
                    SUBSTRING_INDEX(remaining, ',', 1),
                    SUBSTRING(remaining, LENGTH(SUBSTRING_INDEX(remaining, ',', 1)) + 2)
                FROM split_questions
                WHERE remaining != ''
            )

            SELECT 
                sq.game_code,
                laq.id AS question_id,
                laq.title AS question_title,
                laq.la_level_id,
                laq.la_topic_id,
                CASE 
                    WHEN laq.type = 2 THEN 'Quiz'
                    WHEN laq.type = 3 THEN 'Riddle'
                    WHEN laq.type = 4 THEN 'Puzzle'
                    ELSE 'Default'
                END AS game_type,
                CASE
                    WHEN laq.question_type = 1 THEN 'Text'
                    WHEN laq.question_type = 2 THEN 'Image'
                    ELSE 'Default'
                END AS question_type,
                CASE
                    WHEN laq.answer_option_id = laqo.id THEN 1
                    ELSE 0
                END AS is_answer,
                laqo.title AS answer_option
            FROM split_questions sq
            INNER JOIN lifeapp.la_questions laq ON laq.id = CAST(TRIM(sq.question_id) AS UNSIGNED)
            INNER JOIN lifeapp.la_question_options laqo ON laq.id = laqo.question_id
            ORDER BY sq.game_code, sq.pos;
            """
            cursor.execute(sql, (game_code,))
            questions = cursor.fetchall()

        return jsonify(questions), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        connection.close()

@app.route('/api/game_questions_with_answers', methods=['POST'])
def get_game_questions_with_answers():
    try:
        data = request.get_json()
        game_id = data.get("game_id")
        user_id = data.get("user_id")

        connection = get_db_connection()
        with connection.cursor(pymysql.cursors.DictCursor) as cursor:
            sql = """
            WITH RECURSIVE split_questions AS (
                SELECT 
                    game_code,
                    TRIM(BOTH '[]' FROM questions) AS cleaned_questions,
                    1 AS pos,
                    SUBSTRING_INDEX(TRIM(BOTH '[]' FROM questions), ',', 1) AS question_id,
                    SUBSTRING(TRIM(BOTH '[]' FROM questions), LENGTH(SUBSTRING_INDEX(TRIM(BOTH '[]' FROM questions), ',', 1)) + 2) AS remaining
                FROM lifeapp.la_quiz_games
                WHERE questions != '0' AND game_code = %s

                UNION ALL

                SELECT 
                    game_code,
                    cleaned_questions,
                    pos + 1,
                    SUBSTRING_INDEX(remaining, ',', 1),
                    SUBSTRING(remaining, LENGTH(SUBSTRING_INDEX(remaining, ',', 1)) + 2)
                FROM split_questions
                WHERE remaining != ''
            )

            SELECT 
                sq.pos                                  AS question_position,
                sq.question_id                          AS question_id,
                laq.title                               AS question_title,
                laqo.id                                 AS option_id,
                laqo.title                              AS option_text,
                laqo.id = laq.answer_option_id          AS is_correct_option,
                ans.la_question_option_id = laqo.id     AS selected_by_user,
                COALESCE(ans.is_correct, 0)             AS user_is_correct,
                ans.coins                               AS coins_awarded
            FROM split_questions sq
            JOIN lifeapp.la_questions laq 
              ON laq.id = CAST(TRIM(sq.question_id) AS UNSIGNED)
            JOIN lifeapp.la_question_options laqo 
              ON laq.id = laqo.question_id
            LEFT JOIN lifeapp.la_quiz_game_question_answers ans
              ON ans.la_quiz_game_id = %s
             AND ans.user_id = %s
             AND ans.la_question_id = laq.id
            ORDER BY sq.pos, laqo.id;
            """
            cursor.execute(sql, (game_id, game_id, user_id))
            rows = cursor.fetchall()

        return jsonify(rows), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        connection.close()




###################################################################################
###################################################################################
##################### RESOURCES/STUDENT_RELATED/MISSION APIs ######################
###################################################################################
###################################################################################
@app.route('/api/missions_resource', methods=['POST'])
def get_missions_resource():
    try:
        connection = get_db_connection()
        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT 
                    lam.id, 
                    lam.title, 
                    lam.description, 
                    lam.question,
                    CASE 
                        WHEN lam.type = 1 THEN 'Mission'
                        WHEN lam.type = 2 THEN 'Quiz'
                        WHEN lam.type = 3 THEN 'Riddle'
                        WHEN lam.type = 4 THEN 'Puzzle'
                        WHEN lam.type = 5 THEN 'Jigyasa'
                        WHEN lam.type = 6 THEN 'Pragya'
                        ELSE 'Default'
                    END AS type,
                    CASE 
                        WHEN lam.allow_for = 1 THEN 'All'
                        ELSE 'Teacher'
                    END AS allow_for,
                    las.title AS subject,
                    lal.title AS level,
                    lam.status As status
                FROM lifeapp.la_missions lam
                INNER JOIN lifeapp.la_subjects las ON las.id = lam.la_subject_id 
                INNER JOIN lifeapp.la_levels lal ON lal.id = lam.la_level_id
            """)
            data = cursor.fetchall()
        return jsonify(data), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        connection.close()


@app.route('/api/add_mission', methods=['POST'])
def add_mission():
    try:
        connection = get_db_connection()
        with connection.cursor() as cursor:
            form = request.form
            subject_id = form.get('subject')
            level_id = form.get('level')
            type_id = form.get('type')
            allow_for = form.get('allow_for')
            title = form.get('title')
            description = form.get('description')
            question = form.get('question')

            # Handle files
            image = request.files.get('image')
            document = request.files.get('document')
            datetime_str = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
            image_path = None
            doc_path = None
            status = form.get('status')

            if image:
                image_path = f"uploads/images/{image.filename}"
                image.save(image_path)
            if document:
                doc_path = f"uploads/docs/{document.filename}"
                document.save(doc_path)

            sql = """
                INSERT INTO lifeapp.la_missions 
                (la_subject_id, la_level_id, type, allow_for, title, description, question, image, document, created_at, updated_at, status)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """
            cursor.execute(sql, (subject_id, level_id, type_id, allow_for, title, description, question, image_path, doc_path, datetime_str, datetime_str, int(status)))
            connection.commit()
            new_id = cursor.lastrowid

            return jsonify({'id': new_id, 'title': title, 'subject': subject_id, 'level': level_id, 'type': type_id})
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        connection.close()


@app.route('/api/delete_mission', methods=['POST'])
def delete_mission():
    try:
        connection = get_db_connection()
        mission_id = request.json.get('id')
        with connection.cursor() as cursor:
            cursor.execute("DELETE FROM lifeapp.la_missions WHERE id = %s", (mission_id,))
            connection.commit()
        return jsonify({'success': True}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        connection.close()

@app.route('/api/update_mission', methods=['POST'])
def update_mission():
    try:
        connection = get_db_connection()
        with connection.cursor() as cursor:
            form = request.form
            mission_id = form.get('id')
            subject_id = form.get('subject')
            level_id = form.get('level')
            type_id = form.get('type')
            allow_for = form.get('allow_for')
            title = form.get('title')
            description = form.get('description')
            question = form.get('question')
            status = form.get('status')

            # Handle optional files
            image = request.files.get('image')
            document = request.files.get('document')

            image_path = None
            doc_path = None

            if image:
                image_path = f"uploads/images/{image.filename}"
                image.save(image_path)
            if document:
                doc_path = f"uploads/docs/{document.filename}"
                document.save(doc_path)
            datetime_str = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
            # Base update query
            update_sql = """
                UPDATE lifeapp.la_missions
                SET la_subject_id=%s, la_level_id=%s, type=%s, allow_for=%s, 
                    title=%s, description=%s, question=%s, updated_at=%s, status=%s
            """
            params = [subject_id, level_id, type_id, allow_for, title, description, question, datetime_str, status]

            # Add image/document only if provided
            if image_path:
                update_sql += ", image=%s"
                params.append(image_path)
            if doc_path:
                update_sql += ", document=%s"
                params.append(doc_path)

            update_sql += " WHERE id=%s"
            params.append(mission_id)

            cursor.execute(update_sql, tuple(params))
            connection.commit()

            return jsonify({'success': True}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        connection.close()


###################################################################################
###################################################################################
############## RESOURCES/STUDENT_RELATED/QUIZ questions APIs ######################
###################################################################################
###################################################################################

# @app.route('/api/quiz_questions', methods=['POST'])
# def get_quiz_questions():
#     data =  request.get_json() or {}
#     subject_id = data.get('subject_id')
#     level_id = data.get('level_id')
#     status = data.get('status')

#     connection = get_db_connection()
#     try: 
#         with connection.cursor() as cursor:

#             base_query = """
#                 SELECT laq.id, laq.title as question_title, lal.title as level_title, las.title as subject_title,
#                     CASE WHEN laq.status = 0 THEN 'Inactive' ELSE 'Active' END as status,
#                     laq.la_topic_id,
#                     CASE 
#                         WHEN laq.type = 2 THEN 'Quiz'
#                         WHEN laq.type = 3 THEN 'Riddle'
#                         WHEN laq.type = 4 THEN 'Puzzle'
#                         ELSE 'Default'
#                     END as game_type,
#                     CASE 
#                         WHEN laq.question_type = 1 THEN 'Text'
#                         WHEN laq.question_type = 2 THEN 'Image'
#                         ELSE 'Default'
#                     END as question_type,
#                     CASE 
#                         WHEN laq.answer_option_id = laqo.id THEN 1 ELSE 0
#                     END as is_answer,
#                     laqo.title as answer_option
#                 FROM lifeapp.la_question_options laqo
#                 INNER JOIN lifeapp.la_questions laq ON laq.id = laqo.question_id
#                 INNER JOIN lifeapp.la_levels lal ON lal.id = laq.la_level_id
#                 INNER JOIN lifeapp.la_subjects las ON las.id = laq.la_subject_id
#                 WHERE 1 = 1
#             """
#             filters = []
#             if subject_id:
#                 base_query += " AND laq.la_subject_id = %s"
#                 filters.append(subject_id)
#             if level_id:
#                 base_query += " AND laq.la_level_id = %s"
#                 filters.append(level_id)

#             if status in ('0', '1'):
#                 base_query += " AND laq.status = %s"
#                 filters.append(int(status))

#             cursor.execute(base_query, filters)
#             results = cursor.fetchall()

#             return jsonify(results)
#     except Exception as e:
#         return jsonify({'error': str(e)}), 500
#     finally:
#         connection.close()

@app.route('/api/quiz_questions', methods=['POST'])
def get_quiz_questions():
    data = request.get_json() or {}
    subject_id = data.get('subject_id')
    level_id = data.get('level_id')
    status = data.get('status')
    topic_id = data.get('topic_id')
    game_type_filter = data.get('type')
    connection = get_db_connection()
    try:
        with connection.cursor() as cursor:
            base_query = """
                SELECT laq.id, laq.title as question_title, lal.title as level_title, las.title as subject_title,
                    CASE WHEN laq.status = 0 THEN 'Inactive' ELSE 'Active' END as status, laq.index,
                    laq.la_topic_id,
                    lat.title as topic_title,
                    CASE 
                        WHEN laq.type = 2 THEN 'Quiz'
                        WHEN laq.type = 3 THEN 'Riddle'
                        WHEN laq.type = 4 THEN 'Puzzle'
                        ELSE 'Default'
                    END as game_type,
                    CASE 
                        WHEN laq.question_type = 1 THEN 'Text'
                        WHEN laq.question_type = 2 THEN 'Image'
                        ELSE 'Default'
                    END as question_type,
                    CASE 
                        WHEN laq.answer_option_id = laqo.id THEN 1 ELSE 0
                    END as is_answer,
                    laqo.title as answer_option
                FROM lifeapp.la_question_options laqo
                INNER JOIN lifeapp.la_questions laq ON laq.id = laqo.question_id
                INNER JOIN lifeapp.la_levels lal ON lal.id = laq.la_level_id
                INNER JOIN lifeapp.la_subjects las ON las.id = laq.la_subject_id
                LEFT JOIN lifeapp.la_topics lat ON laq.la_topic_id = lat.id
                WHERE 1 = 1
            """
            filters = []
            if subject_id:
                base_query += " AND laq.la_subject_id = %s"
                filters.append(subject_id)
            if level_id:
                base_query += " AND laq.la_level_id = %s"
                filters.append(level_id)
            if status is not None and status != "" and status.lower() != "all":
                base_query += " AND laq.status = %s"
                filters.append(status)
            if topic_id:
                base_query += " AND laq.la_topic_id = %s"
                filters.append(topic_id)
            if game_type_filter:
                base_query += " AND laq.type = %s"
                filters.append(game_type_filter) 
            cursor.execute(base_query, filters)
            results = cursor.fetchall()
            return jsonify(results)
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        connection.close()

@app.route('/api/add_quiz_question', methods=['POST'])
def add_quiz_question():
    data = request.get_json() or {}
    question_title = data['question_title']
    subject_id = data['subject_id']
    level_id = data['level_id']
    topic_id = data.get('topic_id', 1)
    created_by = data.get('created_by', 1)
    question_type = data.get('question_type', 1)
    game_type = data.get('type', 2)
    status = data.get('status', 1)
    options = data['options']  # list of dicts: [{"title": "Option 1", "is_correct": true}, ...]
    datetime_str = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    connection = get_db_connection()
    try:
        cursor = connection.cursor()

        cursor.execute("""
            INSERT INTO lifeapp.la_questions (title, la_subject_id, la_level_id, la_topic_id, created_by, question_type, type, status, created_at, updated_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """, (question_title, subject_id, level_id, topic_id, created_by, question_type, game_type, status, datetime_str, datetime_str))
        question_id = cursor.lastrowid

        answer_option_id = None
        for option in options:
            cursor.execute("INSERT INTO lifeapp.la_question_options (question_id, title, created_at, updated_at) VALUES (%s, %s, %s, %s)",
                        (question_id, option['title'], datetime_str, datetime_str))
            option_id = cursor.lastrowid
            if option.get('is_correct'):
                answer_option_id = option_id

        # update the correct answer id in the question
        cursor.execute("UPDATE lifeapp.la_questions SET answer_option_id = %s WHERE id = %s",
                    (answer_option_id, question_id))

        connection.commit()
        #connection.close()

        return jsonify({"success": True, "question_id": question_id})
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        connection.close()

@app.route('/api/update_quiz_question/<int:question_id>', methods=['PUT'])
def update_quiz_question(question_id):
    from datetime import datetime
    data = request.get_json() or {}
    question_title = data.get('question_title')
    subject_id = data.get('subject_id')
    level_id = data.get('level_id')
    topic_id = data.get('topic_id')
    status = data.get('status', 1)
    question_type = data.get('question_type', 1)
    game_type = data.get('type', 2)
    options = data.get('options')  # list of dicts, e.g. [{"title": "Option 1", "is_correct": 1}, ...]
    datetime_str = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    
    connection = get_db_connection()
    try:
        cursor = connection.cursor()
        # Update the question record
        cursor.execute("""
            UPDATE lifeapp.la_questions 
            SET title = %s, la_subject_id = %s, la_level_id = %s, la_topic_id = %s, status = %s,
                question_type = %s, type = %s, updated_at = %s
            WHERE id = %s
        """, (question_title, subject_id, level_id, topic_id, int(status), question_type, game_type, datetime_str, question_id))
        connection.commit()
        
        # Remove existing options
        cursor.execute("DELETE FROM lifeapp.la_question_options WHERE question_id = %s", (question_id,))
        connection.commit()
        
        answer_option_id = None
        for option in options:
            cursor.execute("""
                INSERT INTO lifeapp.la_question_options (question_id, title, created_at, updated_at)
                VALUES (%s, %s, %s, %s)
            """, (question_id, option['title'], datetime_str, datetime_str))
            option_id = cursor.lastrowid
            if option.get('is_correct'):
                answer_option_id = option_id
        
        # Update the correct answer id
        cursor.execute("UPDATE lifeapp.la_questions SET answer_option_id = %s WHERE id = %s",
                       (answer_option_id, question_id))
        connection.commit()
        return jsonify({"success": True, "question_id": question_id})
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        connection.close()

@app.route('/api/quiz_completes', methods= ['POST'])
def get_quiz_completes():
    connection = get_db_connection()
    try:
        with connection.cursor() as cursor:
            sql = """
                select count(*) as count from lifeapp.la_quiz_games where completed_at is not null;
            """
            cursor.execute(sql)
            count = cursor.fetchall()
        return jsonify(count)
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        connection.close()

@app.route('/api/topics', methods=['POST'])
def get_topics():
    data = request.get_json() or {}
    la_subject_id = data.get('la_subject_id')
    la_level_id = data.get('la_level_id')
    status = data.get('status', '')  # Expect "1", "0", or "all"

    connection = get_db_connection()
    try:
        with connection.cursor() as cursor:
            sql = """
                SELECT * 
                FROM lifeapp.la_topics 
                WHERE 1=1
            """
            filters = []
            if la_subject_id:
                sql += " AND la_subject_id = %s"
                filters.append(la_subject_id)
            if la_level_id:
                sql += " AND la_level_id = %s"
                filters.append(la_level_id)
            if status and status.lower() != "all":
                sql += " AND status = %s"
                filters.append(status)
            sql += " ORDER BY id"
            cursor.execute(sql, filters)
            topics = cursor.fetchall()
        return jsonify(topics)
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        connection.close()



@app.route('/api/add_topic', methods=['POST'])
def add_topic():
    data = request.get_json() or {}
    title = data.get('title')
    la_subject_id = data.get('la_subject_id')
    la_level_id = data.get('la_level_id')
    status = data.get('status', 1)
    allow_for = data.get('allow_for', 1)
    topic_type = data.get('type', 2)
    datetime_str = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    connection = get_db_connection()
    try:
        with connection.cursor() as cursor:
            sql = """
            INSERT INTO lifeapp.la_topics (title, status, created_at, updated_at, allow_for, type, la_subject_id, la_level_id)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            """
            cursor.execute(sql, (title, int(status), datetime_str, datetime_str, allow_for, int(topic_type), la_subject_id, la_level_id))
            topic_id = cursor.lastrowid
            connection.commit()
            return jsonify({"success": True, "topic_id": topic_id})
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        connection.close()

# Similarly, you can create update_topic and delete_topic endpoints.

@app.route('/api/update_topic/<int:topic_id>', methods=['PUT'])
def update_topic(topic_id):
    from datetime import datetime
    data = request.get_json() or {}
    title = data.get('title')
    la_subject_id = data.get('la_subject_id')
    la_level_id = data.get('la_level_id')
    status = data.get('status', 1)
    allow_for = data.get('allow_for', 1)
    topic_type = data.get('type', 2)
    datetime_str = datetime.now().strftime('%Y-%m-%d %H:%M:%S')

    connection = get_db_connection()
    try:
        with connection.cursor() as cursor:
            sql = """
                UPDATE lifeapp.la_topics
                SET title = %s,
                    la_subject_id = %s,
                    la_level_id = %s,
                    status = %s,
                    allow_for = %s,
                    type = %s,
                    updated_at = %s
                WHERE id = %s
            """
            cursor.execute(sql, (title, la_subject_id, la_level_id, int(status), allow_for, topic_type, datetime_str, topic_id))
            connection.commit()
            return jsonify({"success": True, "topic_id": topic_id})
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        connection.close()

@app.route('/api/delete_topic/<int:topic_id>', methods=['DELETE'])
def delete_topic(topic_id):
    connection = get_db_connection()
    try:
        with connection.cursor() as cursor:
            sql = "DELETE FROM lifeapp.la_topics WHERE id = %s"
            cursor.execute(sql, (topic_id,))
            connection.commit()
            return jsonify({"success": True, "topic_id": topic_id})
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        connection.close()


###################################################################################
###################################################################################
####################### SETTINGS/BOARDS APIs ######################################
###################################################################################
###################################################################################

@app.route('/api/boards', methods=['POST'])
def get_boards():
    """Return all boards."""
    connection = get_db_connection()
    try:
        with connection.cursor() as cursor:
            sql = "SELECT id, name, status, created_at, updated_at FROM lifeapp.la_boards ORDER BY id;"
            cursor.execute(sql)
            boards = cursor.fetchall()
        return jsonify(boards)
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        connection.close()

@app.route('/api/add_board', methods=['POST'])
def add_board():
    """Add a new board."""
    data = request.get_json() or {}
    name = data.get("name")
    status = data.get("status", 1)
    datetime_str = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    connection = get_db_connection()
    try:
        with connection.cursor() as cursor:
            sql = """
                INSERT INTO lifeapp.la_boards (name, status, created_at, updated_at)
                VALUES (%s, %s, %s, %s)
            """
            cursor.execute(sql, (name, status, datetime_str, datetime_str))
            board_id = cursor.lastrowid
            connection.commit()
        return jsonify({"success": True, "board_id": board_id})
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        connection.close()

@app.route('/api/update_board/<int:board_id>', methods=['PUT'])
def update_board(board_id):
    """Update an existing board."""
    data = request.get_json() or {}
    name = data.get("name")
    status = data.get("status", 1)
    datetime_str = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    connection = get_db_connection()
    try:
        with connection.cursor() as cursor:
            sql = """
                UPDATE lifeapp.la_boards
                SET name = %s,
                    status = %s,
                    updated_at = %s
                WHERE id = %s
            """
            cursor.execute(sql, (name, status, datetime_str, board_id))
            connection.commit()
        return jsonify({"success": True, "board_id": board_id})
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        connection.close()

@app.route('/api/delete_board/<int:board_id>', methods=['DELETE'])
def delete_board(board_id):
    """Delete a board."""
    connection = get_db_connection()
    try:
        with connection.cursor() as cursor:
            sql = "DELETE FROM lifeapp.la_boards WHERE id = %s"
            cursor.execute(sql, (board_id,))
            connection.commit()
        return jsonify({"success": True, "board_id": board_id})
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        connection.close()


###################################################################################
###################################################################################
####################### SETTINGS/GAME ENROLLMENTS APIs ############################
###################################################################################
###################################################################################

# 1. List Enrollments - GET /enrollments
@app.route('/api/enrollments', methods=['GET'])
def list_enrollments():
    try:
        connection = get_db_connection()
        with connection.cursor() as cursor:
            query = "SELECT * FROM lifeapp.la_game_enrollments"
            cursor.execute(query)
            enrollments = cursor.fetchall()
        connection.close()
        return jsonify(enrollments), 200
    except Exception as e:
        logger.error("Error listing enrollments: %s", e)
        return jsonify({"error": str(e)}), 500

# 2. Add Enrollment - POST /enrollments
@app.route('/api/enrollments', methods=['POST'])
def add_enrollment():
    try:
        data = request.get_json() or {}
        # Removed enrollment_code input; it is now generated automatically.
        type_val = data.get('type')
        user_id = data.get('user_id')
        unlock_enrollment_at = data.get('unlock_enrollment_at')  # Expecting ISO datetime string if provided

        if type_val is None or not user_id:
            return jsonify({"error": "Missing required fields: type and user_id"}), 400

        # Parse unlock_enrollment_at if provided
        unlock_time = None
        if unlock_enrollment_at:
            try:
                unlock_time = datetime.fromisoformat(unlock_enrollment_at)
            except ValueError:
                return jsonify({"error": "Incorrect date format for unlock_enrollment_at. Use ISO format."}), 400

        created_at = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        updated_at = created_at

        connection = get_db_connection()
        try:
            cursor = connection.cursor()
            # Insert without enrollment_code
            sql = """
                INSERT INTO lifeapp.la_game_enrollments 
                (type, user_id, unlock_enrollment_at, created_at, updated_at)
                VALUES (%s, %s, %s, %s, %s)
            """
            cursor.execute(sql, (type_val, user_id, unlock_time, created_at, updated_at))
            enrollment_id = cursor.lastrowid

            # Generate enrollment_code as a 4-digit string (with leading zeroes)
            enrollment_code = f"{enrollment_id:04d}"
            # Update the same record with the enrollment_code
            cursor.execute(
                "UPDATE lifeapp.la_game_enrollments SET enrollment_code = %s WHERE id = %s",
                (enrollment_code, enrollment_id)
            )
            connection.commit()
        finally:
            connection.close()

        return jsonify({"message": "Enrollment created", "id": enrollment_id, "enrollment_code": enrollment_code}), 201

    except Exception as e:
        logger.error("Error adding enrollment: %s", e)
        return jsonify({"error": str(e)}), 500

# 3. Edit Enrollment - PUT /enrollments/<id>
@app.route('/api/enrollments/<int:enrollment_id>', methods=['PUT'])
def edit_enrollment(enrollment_id):
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No input data provided"}), 400

        update_fields = []
        params = []

        if "enrollment_code" in data:
            update_fields.append("enrollment_code = %s")
            params.append(data["enrollment_code"])
        if "type" in data:
            update_fields.append("`type` = %s")
            params.append(data["type"])
        if "user_id" in data:
            update_fields.append("user_id = %s")
            params.append(data["user_id"])
        if "unlock_enrollment_at" in data:
            unlock_enrollment_at = data["unlock_enrollment_at"]
            if unlock_enrollment_at:
                try:
                    unlock_dt = datetime.fromisoformat(unlock_enrollment_at)
                except ValueError:
                    return jsonify({"error": "Incorrect date format for unlock_enrollment_at. Use ISO format."}), 400
            else:
                unlock_dt = None
            update_fields.append("unlock_enrollment_at = %s")
            params.append(unlock_dt)

        if not update_fields:
            return jsonify({"error": "No valid fields provided for update"}), 400

        # Always update the updated_at column
        updated_at = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        update_fields.append("updated_at = %s")
        params.append(updated_at)

        # Add enrollment id to the parameters for WHERE clause
        params.append(enrollment_id)

        set_clause = ", ".join(update_fields)
        connection = get_db_connection()
        with connection.cursor() as cursor:
            sql = f"UPDATE lifeapp.la_game_enrollments SET {set_clause} WHERE id = %s"
            cursor.execute(sql, tuple(params))
        connection.commit()
        connection.close()

        return jsonify({"message": "Enrollment updated"}), 200

    except Exception as e:
        logger.error("Error editing enrollment: %s", e)
        return jsonify({"error": str(e)}), 500

# 4. Delete Enrollment - DELETE /enrollments/<id>
@app.route('/api/enrollments/<int:enrollment_id>', methods=['DELETE'])
def delete_enrollment(enrollment_id):
    try:
        connection = get_db_connection()
        with connection.cursor() as cursor:
            sql = "DELETE FROM lifeapp.la_game_enrollments WHERE id = %s"
            cursor.execute(sql, (enrollment_id,))
        connection.commit()
        connection.close()
        return jsonify({"message": "Enrollment deleted"}), 200
    except Exception as e:
        logger.error("Error deleting enrollment: %s", e)
        return jsonify({"error": str(e)}), 500
    

###################################################################################
###################################################################################
####################### SETTINGS/GAME ENROLLMENTS APIs ############################
###################################################################################
###################################################################################
# ===============================================
# 1. List Enrollment Requests with Filters
# ===============================================
@app.route('/api/game_enrollment_requests', methods=['POST'])
def list_game_enrollment_requests():
    data = request.get_json() or {}
    # Filter by status: "approved", "not_approved", "all"
    status = data.get('status', 'all').lower()
    # Filter by type: "1", "2", "3", "4", "5", "6", or "all"
    req_type = data.get('type', 'all')
    
    sql = "SELECT * FROM lifeapp.la_request_game_enrollments WHERE 1=1"
    params = []
    
    if status != "all":
        if status == "approved":
            sql += " AND approved_at IS NOT NULL"
        elif status == "not_approved":
            sql += " AND approved_at IS NULL"
    
    if req_type != "all" and req_type:
        sql += " AND type = %s"
        params.append(req_type)
    
    sql += " ORDER BY created_at DESC"
    
    connection = get_db_connection()
    try:
        with connection.cursor() as cursor:
            cursor.execute(sql, tuple(params))
            result = cursor.fetchall()
        return jsonify(result), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        connection.close()

# ===============================================
# 2. Add a New Enrollment Request
# ===============================================
@app.route('/api/game_enrollment_requests/add', methods=['POST'])
def add_game_enrollment_request():
    data = request.get_json() or {}
    user_id = data.get('user_id')
    req_type = data.get('type')
    la_game_enrollment_id = data.get('la_game_enrollment_id')
    # approved_at can be provided (if approved) or None for pending request.
    approved_at = data.get('approved_at', None)
    
    connection = get_db_connection()
    try:
        with connection.cursor() as cursor:
            sql = """
            INSERT INTO lifeapp.la_request_game_enrollments 
            (user_id, type, la_game_enrollment_id, approved_at, created_at, updated_at)
            VALUES (%s, %s, %s, %s, NOW(), NOW())
            """
            cursor.execute(sql, (user_id, req_type, la_game_enrollment_id, approved_at))
            connection.commit()
        return jsonify({'message': 'Request added successfully'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        connection.close()

# ===============================================
# 3. Edit an Existing Enrollment Request
# ===============================================
@app.route('/api/game_enrollment_requests/<int:request_id>', methods=['PUT'])
def edit_game_enrollment_request(request_id):
    data = request.get_json() or {}
    user_id = data.get('user_id')
    req_type = data.get('type')
    la_game_enrollment_id = data.get('la_game_enrollment_id')
    approved_at = data.get('approved_at')  # may be null if not approved
    connection = get_db_connection()
    try:
        with connection.cursor() as cursor:
            sql = """
            UPDATE lifeapp.la_request_game_enrollments
            SET user_id = %s, type = %s, la_game_enrollment_id = %s, approved_at = %s, updated_at = NOW()
            WHERE id = %s
            """
            cursor.execute(sql, (user_id, req_type, la_game_enrollment_id, approved_at, request_id))
            connection.commit()
        return jsonify({'message': 'Request updated successfully'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        connection.close()

# ===============================================
# 4. Delete an Enrollment Request
# ===============================================
@app.route('/api/game_enrollment_requests/<int:request_id>', methods=['DELETE'])
def delete_game_enrollment_request(request_id):
    connection = get_db_connection()
    try:
        with connection.cursor() as cursor:
            sql = "DELETE FROM lifeapp.la_request_game_enrollments WHERE id = %s"
            cursor.execute(sql, (request_id,))
            connection.commit()
        return jsonify({'message': 'Request deleted successfully'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        connection.close()

###################################################################################
###################################################################################
####################### TEACHER/COMPETENCIES APIs #################################
###################################################################################
###################################################################################
@app.route('/admin/competencies', methods=['GET'])
def get_competencies():
    """
    Fetch competencies along with subject and level information.
    Optional query parameters:
      - la_subject_id (filter by subject)
      - status (filter by competency status; e.g. 1 for ACTIVE, 0 for DEACTIVE)
      - page (for pagination, default: 1)
    """
    try:
        # Get filters from query string (or use defaults)
        la_subject_id = request.args.get('la_subject_id')
        status = request.args.get('status')  # expected as a string, e.g. "1" or "0"
        page = int(request.args.get('page', 1))
        per_page = 25
        offset = (page - 1) * per_page

        connection = get_db_connection()
        with connection.cursor() as cursor:
            # Build the SQL with JOINs:
            sql = """
            SELECT 
              comp.id,
              comp.title AS competency_title,
              comp.document,
              comp.status,
              comp.created_at,
              s.title AS subject_title,
              l.title AS level_title
            FROM lifeapp.la_competencies comp
            INNER JOIN lifeapp.la_subjects s ON comp.la_subject_id = s.id
            INNER JOIN lifeapp.la_levels l ON comp.la_level_id = l.id
            WHERE 1 = 1 
            """
            params = []
            if la_subject_id:
                sql += " AND comp.la_subject_id = %s"
                params.append(la_subject_id)
            if status is not None and status != "":
                sql += " AND comp.status = %s"
                params.append(int(status))
            sql += " ORDER BY comp.id DESC LIMIT %s OFFSET %s"
            params.extend([per_page, offset])
            cursor.execute(sql, params)
            competencies = cursor.fetchall()

        # Also fetch the subjects list (for filter dropdowns)
        with connection.cursor() as cursor:
            cursor.execute("SELECT id, title FROM lifeapp.la_subjects WHERE status = 1 ORDER BY id;")
            subjects = cursor.fetchall()

        connection.close()

        # Return both competencies and subjects
        return jsonify({"competencies": competencies, "subjects": subjects})
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/admin/competencies', methods=['POST'])
def create_competency():
    """
    Expects a multipart/form-data POST request (for file upload) and other fields in form data.
    Required fields: name (for competency title), la_subject_id, la_level_id, status
    Document is expected as a file input named 'document'
    """
    data = request.form.to_dict()
    document_file = request.files.get('document')
    if not document_file:
        return jsonify({'message': 'Document file is required'}), 400

    # Replace this with your actual media upload function:
    media_id = upload_media(document_file)
    data['document'] = media_id

    connection = get_db_connection()
    try:
        cursor = connection.cursor()
        sql = """
            INSERT INTO lifeapp.la_competencies 
            (title, la_subject_id, la_level_id, status, document, created_at, updated_at)
            VALUES (%s, %s, %s, %s, %s, NOW(), NOW())
        """
        # Here 'title' is the competency title.
        cursor.execute(sql, (
            data.get('name'),
            data.get('la_subject_id'),
            data.get('la_level_id'),
            data.get('status', 'ACTIVE'),
            data['document']
        ))
        connection.commit()
        return jsonify({'message': 'Competency created successfully'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()
        connection.close()

# Update an existing competency (Edit)
@app.route('/admin/competencies/<int:competency_id>', methods=['PUT'])
def update_competency(competency_id):
    try:
        data = request.get_json() or {}
        connection = get_db_connection()
        with connection.cursor() as cursor:
            sql = """
                UPDATE lifeapp.la_competencies 
                SET title = %s, la_subject_id = %s, la_level_id = %s, 
                    status = %s, document = %s, updated_at = NOW()
                WHERE id = %s
            """
            cursor.execute(sql, (
                data.get('name'),
                data.get('la_subject_id'),
                data.get('la_level_id'),
                data.get('status'),
                data.get('document'),
                competency_id
            ))
            connection.commit()
        return jsonify({'message': 'Competency updated successfully'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        connection.close()

# Delete a competency
@app.route('/admin/competencies/<int:competency_id>', methods=['DELETE'])
def delete_competency(competency_id):
    try:
        connection = get_db_connection()
        with connection.cursor() as cursor:
            sql = "DELETE FROM lifeapp.la_competencies WHERE id = %s"
            cursor.execute(sql, (competency_id,))
            connection.commit()
        return jsonify({'message': 'Competency deleted successfully'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        connection.close()


###################################################################################
###################################################################################
####################### CAMPAIGNS APIs ############################################
###################################################################################
###################################################################################

@app.route('/admin/push-notification-campaigns', methods=['GET'])
def list_push_notification_campaigns():
    try:
        # Optional: support pagination
        page = int(request.args.get('page', 1))
        per_page = int(request.args.get('per_page', 50))
        offset = (page - 1) * per_page

        connection = get_db_connection()
        with connection.cursor() as cursor:
            # Join push_notification_campaigns (alias p) with schools (alias s) to display the school name.
            sql = """
                SELECT 
                  p.id,
                  p.created_by,
                  p.name,
                  p.title,
                  p.body,
                  p.media_id,
                  p.school_id,
                  s.name AS school_name,
                  p.city,
                  p.state,
                  p.scheduled_date,
                  p.scheduled_at,
                  p.completed_at,
                  p.users,
                  p.success_users,
                  p.failed_users,
                  p.created_at,
                  p.updated_at
                FROM lifeapp.push_notification_campaigns p
                INNER JOIN lifeapp.schools s ON p.school_id = s.id
                ORDER BY p.id DESC
                LIMIT %s OFFSET %s
            """
            cursor.execute(sql, (per_page, offset))
            campaigns = cursor.fetchall()
        connection.close()
        return jsonify({"campaigns": campaigns}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# -------------------------
# Endpoint: Add Campaign
# -------------------------
@app.route('/admin/push-notification-campaigns', methods=['POST'])
def add_push_notification_campaign():
    try:
        # Get campaign data from form and file from request
        data = request.form.to_dict()
        file = request.files.get('media')

        # Required fields: name, title, and body
        if not data.get('name') or not data.get('title') or not data.get('body'):
            return jsonify({'error': 'Name, title, and body are required.'}), 400

        # Process schedule if provided (for instance, a scheduled date/time in ISO format)
        scheduled_date = data.get('scheduled_date')  # Should be a full datetime string or empty

        # Process media file (if provided)
        media_id = None
        if file:
            filename = secure_filename(file.filename)
            upload_folder = app.config['UPLOAD_FOLDER']
            if not os.path.exists(upload_folder):
                os.makedirs(upload_folder)
            path = os.path.join(upload_folder, filename)
            file.save(path)
            # Here you could insert into your media table and retrieve the inserted ID.
            connection = get_db_connection()
            with connection.cursor() as cursor:
                cursor.execute("INSERT INTO media (name, path) VALUES (%s, %s)", (filename, path))
                media_id = cursor.lastrowid
                connection.commit()
            connection.close()

        # Insert the campaign row.
        created_at = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        connection = get_db_connection()
        with connection.cursor() as cursor:
            sql = """
                INSERT INTO lifeapp.push_notification_campaigns 
                (name, title, body, media_id, school_id, city, state, scheduled_date, created_by, created_at, updated_at)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """
            # Expect that your form includes school_id, city, and state as well.
            cursor.execute(sql, (
                data.get('name'),
                data.get('title'),
                data.get('body'),
                media_id,
                data.get('school_id'),
                data.get('city'),
                data.get('state'),
                scheduled_date,
                data.get('created_by') or 1,  # Replace with current user ID logic if needed.
                created_at,
                created_at
            ))
            campaign_id = cursor.lastrowid
            connection.commit()
        connection.close()
        return jsonify({"message": "Campaign added successfully", "campaign_id": campaign_id}), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# -------------------------
# Endpoint: Update Campaign
# -------------------------
@app.route('/admin/push-notification-campaigns/<int:campaign_id>', methods=['PUT'])
def update_push_notification_campaign(campaign_id):
    try:
        data = request.form.to_dict()
        file = request.files.get('media')
        scheduled_date = data.get('scheduled_date')
        media_id = None
        if file:
            filename = secure_filename(file.filename)
            upload_folder = app.config['UPLOAD_FOLDER']
            if not os.path.exists(upload_folder):
                os.makedirs(upload_folder)
            path = os.path.join(upload_folder, filename)
            file.save(path)
            connection = get_db_connection()
            with connection.cursor() as cursor:
                cursor.execute("INSERT INTO media (name, path) VALUES (%s, %s)", (filename, path))
                media_id = cursor.lastrowid
                connection.commit()
            connection.close()
        
        updated_at = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        connection = get_db_connection()
        with connection.cursor() as cursor:
            # If a new media file is provided, update document; else, leave unchanged.
            if media_id:
                sql = """
                    UPDATE lifeapp.push_notification_campaigns
                    SET name=%s,
                        title=%s,
                        body=%s,
                        media_id=%s,
                        school_id=%s,
                        city=%s,
                        state=%s,
                        scheduled_date=%s,
                        updated_at=%s
                    WHERE id = %s
                """
                cursor.execute(sql, (
                    data.get('name'),
                    data.get('title'),
                    data.get('body'),
                    media_id,
                    data.get('school_id'),
                    data.get('city'),
                    data.get('state'),
                    scheduled_date,
                    updated_at,
                    campaign_id
                ))
            else:
                sql = """
                    UPDATE lifeapp.push_notification_campaigns
                    SET name=%s,
                        title=%s,
                        body=%s,
                        school_id=%s,
                        city=%s,
                        state=%s,
                        scheduled_date=%s,
                        updated_at=%s
                    WHERE id = %s
                """
                cursor.execute(sql, (
                    data.get('name'),
                    data.get('title'),
                    data.get('body'),
                    data.get('school_id'),
                    data.get('city'),
                    data.get('state'),
                    scheduled_date,
                    updated_at,
                    campaign_id
                ))
            connection.commit()
        connection.close()
        return jsonify({"message": "Campaign updated successfully", "campaign_id": campaign_id}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# -------------------------
# Endpoint: Delete Campaign
# -------------------------
@app.route('/admin/push-notification-campaigns/<int:campaign_id>', methods=['DELETE'])
def delete_push_notification_campaign(campaign_id):
    try:
        connection = get_db_connection()
        with connection.cursor() as cursor:
            cursor.execute("DELETE FROM lifeapp.push_notification_campaigns WHERE id = %s", (campaign_id,))
            connection.commit()
        connection.close()
        return jsonify({"message": "Campaign deleted successfully", "campaign_id": campaign_id}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
if __name__ == '__main__':
    app.run(debug=True)