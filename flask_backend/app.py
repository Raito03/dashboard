# app.py
from binascii import Error
from flask import Flask, jsonify, request
from flask_cors import CORS
import pymysql.cursors
from datetime import datetime
from typing import Optional, Dict, Any, List, Union
import logging
# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

from pathlib import Path
app = Flask(__name__)
# Configure CORS to allow requests from http://localhost:3000 with credentials
CORS(app, resources={r"/*": {"origins": "*"}}, supports_credentials=True)

import os
from dotenv import load_dotenv

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
            with cte as (
                SELECT 
                    m.id AS Mission_Id, 
                    m.title AS Mission_Title, 
                    CASE 
                        WHEN u.name IS NULL THEN 'self' 
                        WHEN u.type = 3 THEN 'self' 
                        ELSE u.name 
                    END AS Approved_By, 
                    CASE 
                        when mc.approved_at is not null then 'Approved'
                        when mc.rejected_at is null then 'Requested'
                        else 'Rejected'
                    END as Status,
                    mc.user_id AS Student_Id, 
                    mc.created_at AS Requested_At, 
                    mc.points AS Total_Points, 
                    mc.timing AS Each_Mission_Timing 
                FROM lifeapp.la_missions m 
                LEFT JOIN lifeapp.la_mission_assigns lma ON m.id = lma.la_mission_id
                LEFT JOIN lifeapp.users u ON u.id = lma.teacher_id 
                LEFT JOIN lifeapp.la_mission_completes mc ON m.id = mc.la_mission_id
                )
            select 
                cte.Mission_Id,
                u.name as Student_Name,
                u.school_id,
                ls.name as School_Name,
                cte.Mission_Title,
                cte.Approved_By,
                cte.Status,
                cte.Student_Id,
                cte.Requested_At,
                cte.Total_Points,
                cte.Each_Mission_Timing,
                u.mobile_no,
                u.dob,
                u.grade,
                u.city,
                u.state,
                u.address,
                u.earn_coins,
                u.heart_coins,
                u.brain_coins
            from cte inner join lifeapp.users u on cte.Student_id = u.id
                    inner join lifeapp.schools ls on ls.id = u.school_id
    """
    params = []
    
    if mission_acceptance:
        if mission_acceptance == 'Accepted':
            sql += " AND cte.Status = 'Approved' "
        elif mission_acceptance == 'Rejected':
            sql += " AND cte.Status = 'Rejected' "
        else:
            sql += " AND cte.Status = 'Requested' "
    if assigned_by:
        if assigned_by == 'Teacher':
            sql += " AND cte.Approved_By != 'self' "
        else:
            sql += " AND cte.Approved_By = 'self' "
    # Add date range filters
    if from_date:
        sql += " AND cte.Requested_At >= %s"
        params.append(from_date)
    if to_date:
        sql += " AND cte.Requested_At <= %s"
        params.append(to_date)

    sql += " ;"
    
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

        
@app.route('/api/teacher_dashboard_search', methods=['POST'])
def fetch_teacher_dashboard():
    filters = request.get_json() or {}
    state = filters.get('state')
    city = filters.get('city')
    school_code = filters.get('school_code')  # Make sure this matches frontend key
    is_life_lab = filters.get('is_life_lab')
    school = filters.get('school')
    from_date = filters.get('from_date')  # New filter: starting date
    to_date = filters.get('to_date')      # New filter: ending date
    # Start with base SQL
    sql = """
        with cte as(
            select count(*) as mission_assign_count, teacher_id from lifeapp.la_mission_assigns group by teacher_id
        )
        SELECT 
            u.id, u.name, u.email,
            u.mobile_no, u.state, 
            u.city, ls.name as school_name, u.school_id, cte.mission_assign_count,
            CASE 
                WHEN ls.is_life_lab = 1 
                    THEN 'Yes' 
                ELSE 'No' 
            END AS is_life_lab,
            u.created_at, u.updated_at 
        FROM lifeapp.users u
        INNER JOIN lifeapp.schools ls ON ls.id = u.school_id
        left join cte on cte.teacher_id = u.id
        WHERE u.type = 5
    """
    params = []
    
    # Add conditions based on filters
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
    # Add date range filters
    if from_date:
        sql += " AND u.created_at >= %s"
        params.append(from_date)
    if to_date:
        sql += " AND u.created_at <= %s"
        params.append(to_date)
    # Print the SQL for debugging (remove in production)
    # print("SQL Query:", sql)
    # print("Parameters:", params)
    
    try:
        connection = get_db_connection()
        with connection.cursor() as cursor:
            cursor.execute(sql, tuple(params))
            result = cursor.fetchall()
            
            # Add debug output
            # print("Query returned", len(result), "rows")
            
            # Always return a JSON array, even if empty
            return jsonify(result if result else [])
    except Exception as e:
        print("Error in teacher_dashboard_search:", str(e))
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
        WITH mission_counts AS (
            SELECT COUNT(*) AS mission_count
            FROM lifeapp.la_mission_assigns lama
            INNER JOIN lifeapp.la_mission_completes lamc 
                ON lamc.la_mission_id = lama.la_mission_id
            GROUP BY lama.teacher_id, lama.user_id
        )
        SELECT SUM(mission_count) AS total_missions_completed
        FROM mission_counts;
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
if __name__ == '__main__':
    app.run(debug=True)