# app.py
from binascii import Error
from flask import Flask, jsonify, request
from flask_cors import CORS
import pymysql.cursors

app = Flask(__name__)
CORS(app)  # Enable CORS

def get_db_connection():
    return pymysql.connect(
        host='localhost',
        user='root',
        password='Diamond0606***',
        database='lifeapp',
        cursorclass=pymysql.cursors.DictCursor
    )

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
    try:
        connection = get_db_connection()
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
    try:
        connection = get_db_connection()
        with connection.cursor() as cursor:
            sql = """
                select count(*) as count from lifeapp.users where type = 3;
            """
            cursor.execute(sql)
            result = cursor.fetchall()
            print("Query Result:", result)  # Debugging statement
        return jsonify(result)
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        connection.close()


@app.route('/api/school_list', methods=['GET'])
def get_school_list():
    try:
        connection = get_db_connection()
        with connection.cursor() as cursor:
            sql = """
                select distinct(name) from lifeapp.schools WHERE name REGEXP '^[A-Za-z]' and code != 'null';
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
    try:
        connection = get_db_connection()
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

@app.route('/api/city_list', methods=['GET'])
def get_city_list():
    try:
        connection = get_db_connection()
        with connection.cursor() as cursor:
            sql = """
                select distinct(city) from lifeapp.schools;
            """
            cursor.execute(sql)
            result = cursor.fetchall()
        
        # print("Query Result:", result)  # Debugging statement
        return jsonify(result)
    except Exception as e:
        return jsonify({'error': str(e)}), 500
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
            mc.la_mission_id, mc.description, mc.comments, mc.approved_at, mc.rejected_at, mc.created_at as requested_at,
            m.type AS mission_type, m.title AS mission_title, m.description AS mission_description,
            ums.total_missions_requested, ums.total_missions_accepted
        FROM lifeapp.la_mission_completes mc 
        INNER JOIN lifeapp.users u ON u.id = mc.user_id 
        INNER JOIN lifeapp.la_missions m ON m.id = mc.la_mission_id 
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
            sql += " AND mc.approved_at is not null"
        elif mission_acceptance == 'rejected':
            sql += " AND mc.rejected_at is not null"
        else:
            sql += " AND mc.approved_at is null and mc.rejected_at is null"
    
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

if __name__ == '__main__':
    app.run(debug=True)