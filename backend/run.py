from flask import Flask, request, jsonify
from flask_cors import CORS
from datetime import datetime, timedelta
import re
import bcrypt
import jwt
import os
from functools import wraps
from dotenv import load_dotenv

# Import DB helpers from database.py
from database import get_db_connection, init_db, init_user_table

load_dotenv()

app = Flask(__name__)

CORS(app, 
     resources={r"/api/*": {
         "origins": "http://localhost:5173",
         "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
         "allow_headers": ["Content-Type", "Authorization"],
         "supports_credentials": True,
         "expose_headers": ["Content-Type", "Authorization"]
     }},
     supports_credentials=True)

SECRET_KEY = os.getenv('JWT_SECRET_KEY')
if not SECRET_KEY:
    raise ValueError("No JWT_SECRET_KEY set in environment variables")

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        auth_header = request.headers.get('Authorization')
        if auth_header and auth_header.startswith('Bearer '):
            token = auth_header.split(' ')[1]
        if not token:
            return jsonify({'error': 'Token is missing'}), 401
        try:
            payload = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
            request.user = payload
        except jwt.ExpiredSignatureError:
            return jsonify({'error': 'Token has expired'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'error': 'Invalid token'}), 401
        return f(*args, **kwargs)
    return decorated


@app.route('/api/init-db', methods=['POST'])
def initialize_database():
    try:
        init_db()
        init_user_table()
        return jsonify({
            'message': 'Database initialized successfully',
            'fresh_init': True
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/patients', methods=['GET'])
@token_required
def get_patients():
    try:
        conn = get_db_connection()
        db_cursor = conn.cursor()
        
        # Execute query to get all patients
        db_cursor.execute('SELECT * FROM patients ORDER BY created_at DESC')
        patients = db_cursor.fetchall()  
        conn.close()
        
        # Convert to list of dictionaries
        patient_list = []
        # Using db_cursor.column_names to map tuples to dicts for consistency
        columns = [desc[0] for desc in db_cursor.description]
        for patient_row in patients:
            patient_dict = dict(zip(columns, patient_row))
            patient_list.append({
                'id': patient_dict['id'],
                'fullName': patient_dict['full_name'],
                'age': patient_dict['age'],
                'gender': patient_dict['gender'],
                'contactNumber': patient_dict['contact_number'],
                'email': patient_dict['email'],
                'patientCode': patient_dict['patient_code'],
                'address': patient_dict['address'],
                'refBy': patient_dict['ref_by'] or '',
                'createdAt': patient_dict['created_at']
            })
        
        return jsonify(patient_list)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/patients', methods=['POST'])
@token_required
def add_patient():
    data = request.json
    
    # Validate required fields
    required_fields = ['fullName', 'age', 'gender', 'contactNumber', 'email', 'patientCode', 'address']
    for field in required_fields:
        if field not in data:
            return jsonify({'error': f'Missing required field: {field}'}), 400
    
    try:
        conn = get_db_connection()
        db_cursor = conn.cursor()
        
        # Execute insert query
        db_cursor.execute('''
            INSERT INTO patients (full_name, age, gender, contact_number, email, patient_code, address, ref_by)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        ''', (
            data['fullName'],
            data['age'],
            data['gender'],
            data['contactNumber'],
            data['email'],
            data['patientCode'],
            data['address'],
            data.get('refBy', '')  # Optional field
        ))
        conn.commit()
        conn.close()
        return jsonify({'message': 'Patient added successfully'}), 201
    except mysql.connector.IntegrityError as e:
        if "Duplicate entry" in str(e) and "patient_code" in str(e):
            return jsonify({'error': 'Patient code already exists'}), 400
        return jsonify({'error': str(e)}), 500
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/patients/<int:patient_id>', methods=['PUT'])
@token_required
def update_patient(patient_id):
    data = request.json
    
    # Validate required fields
    required_fields = ['fullName', 'age', 'gender', 'contactNumber', 'email', 'patientCode', 'address']
    for field in required_fields:
        if field not in data:
            return jsonify({'error': f'Missing required field: {field}'}), 400
    
    try:
        conn = get_db_connection()
        db_cursor = conn.cursor()
        
        # Check if patient exists
        db_cursor.execute('SELECT id FROM patients WHERE id = %s', (patient_id,))
        if not db_cursor.fetchone():
            conn.close()
            return jsonify({'error': 'Patient not found'}), 404
        
        # Update patient
        db_cursor.execute('''
            UPDATE patients 
            SET full_name = %s, age = %s, gender = %s, contact_number = %s, 
                email = %s, address = %s, ref_by = %s
            WHERE id = %s
        ''', (
            data['fullName'],
            data['age'],
            data['gender'],
            data['contactNumber'],
            data['email'],
            data['address'],
            data.get('refBy', ''),
            patient_id
        ))
        conn.commit()
        conn.close()
        return jsonify({'message': 'Patient updated successfully'}), 200
    except mysql.connector.IntegrityError as e:
        if "Duplicate entry" in str(e) and "patient_code" in str(e):
            return jsonify({'error': 'Patient code already exists'}), 400
        return jsonify({'error': str(e)}), 500
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/patients/<int:patient_id>', methods=['DELETE'])
@token_required
def delete_patient(patient_id):
    try:
        conn = get_db_connection()
        db_cursor = conn.cursor()
        
        # Check if patient exists
        db_cursor.execute('SELECT id FROM patients WHERE id = %s', (patient_id,))
        if not db_cursor.fetchone():
            conn.close()
            return jsonify({'error': 'Patient not found'}), 404
        
        # Delete patient
        db_cursor.execute('DELETE FROM patients WHERE id = %s', (patient_id,))
        conn.commit()
        conn.close()
        
        return jsonify({'message': 'Patient deleted successfully'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/tests', methods=['GET'])
@token_required
def get_tests():
    try:
        conn = get_db_connection()
        db_cursor = conn.cursor(dictionary=True) # Fetch as dictionary
        db_cursor.execute('SELECT * FROM tests ORDER BY created_at DESC')
        tests = db_cursor.fetchall()
        conn.close()
        return jsonify(tests)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/tests', methods=['POST'])
@token_required
def add_test():
    try:
        data = request.json
        required_fields = ['name', 'category', 'subcategory']  # Only these are required
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Missing required field: {field}'}), 400

        conn = get_db_connection()
        db_cursor = conn.cursor()
        
        db_cursor.execute('''
            INSERT INTO test_catalog (name, category, subcategory, reference_range, unit, price)
            VALUES (%s, %s, %s, %s, %s, %s)
        ''', (
            data['name'],
            data['category'],
            data['subcategory'],
            data.get('referenceRange'),  # Optional
            data.get('unit'),  # Optional
            data.get('price')  # Optional
        ))
        
        conn.commit()
        conn.close()
        return jsonify({'message': 'Test added successfully'}), 201
    except mysql.connector.IntegrityError as e:
        if "Duplicate entry" in str(e) and "name" in str(e) and "category" in str(e) and "subcategory" in str(e):
            return jsonify({'error': 'Test with this name, category, and subcategory already exists'}), 400
        return jsonify({'error': str(e)}), 500
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/test-results', methods=['POST'])
@token_required
def add_test_results():
    try:
        data = request.json
        required_fields = ['patientId', 'category', 'subcategory', 'tests']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Missing required field: {field}'}), 400

        conn = get_db_connection()
        db_cursor = conn.cursor()
        
        # Get test date from request or use current timestamp
        test_date = data.get('testDate', datetime.now().strftime('%Y-%m-%d %H:%M:%S'))
        
        # Insert each test result
        for test in data['tests']:
            db_cursor.execute('''
                INSERT INTO tests (
                    patient_id, 
                    test_category, 
                    test_subcategory,
                    test_name, 
                    test_value, 
                    normal_range, 
                    unit, 
                    test_date,
                    additional_note
                )
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
            ''', (
                data['patientId'],
                data['category'],
                data['subcategory'],
                test['testName'],
                test['value'],
                test.get('normalRange'),
                test.get('unit'),
                test_date,
                data.get('notes')
            ))
        
        conn.commit()
        conn.close()
        
        return jsonify({'message': 'Test results added successfully'}), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/tests/<int:test_id>', methods=['PUT'])
@token_required
def update_test(test_id):
    try:
        data = request.json
        
        # Validate required fields
        required_fields = ['name', 'category', 'subcategory']  # Only these are required
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Missing required field: {field}'}), 400
        
        conn = get_db_connection()
        db_cursor = conn.cursor()
        
        # Check if test exists
        db_cursor.execute('SELECT id FROM test_catalog WHERE id = %s', (test_id,))
        if not db_cursor.fetchone():
            conn.close()
            return jsonify({'error': 'Test not found'}), 404
        
        # Update test
        db_cursor.execute('''
            UPDATE test_catalog 
            SET name = %s, category = %s, subcategory = %s, reference_range = %s, unit = %s, price = %s
            WHERE id = %s
        ''', (
            data['name'],
            data['category'],
            data['subcategory'],
            data.get('referenceRange'),  # Optional
            data.get('unit'),  # Optional
            data.get('price'),  # Optional
            test_id
        ))
        
        conn.commit()
        conn.close()
        return jsonify({'message': 'Test updated successfully'}), 200
    except mysql.connector.IntegrityError as e:
        if "Duplicate entry" in str(e) and "name" in str(e) and "category" in str(e) and "subcategory" in str(e):
            return jsonify({'error': 'Test with this name, category, and subcategory already exists'}), 400
        return jsonify({'error': str(e)}), 500
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/tests/<int:test_id>', methods=['DELETE'])
@token_required
def delete_test(test_id):
    try:
        conn = get_db_connection()
        db_cursor = conn.cursor()
        
        # Check if test exists
        db_cursor.execute('SELECT id FROM test_catalog WHERE id = %s', (test_id,))
        if not db_cursor.fetchone():
            conn.close()
            return jsonify({'error': 'Test not found'}), 404
        
        # Delete test
        db_cursor.execute('DELETE FROM test_catalog WHERE id = %s', (test_id,))
        conn.commit()
        conn.close()
        return jsonify({'message': 'Test deleted successfully'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/labs', methods=['GET'])
def get_labs():
    try:
        conn = get_db_connection()
        db_cursor = conn.cursor(dictionary=True) # Fetch as dictionary
        db_cursor.execute('SELECT * FROM lab_info ORDER BY created_at DESC')
        lab_info = db_cursor.fetchall()
        conn.close()
        return jsonify(lab_info)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/labs', methods=['POST'])
def add_lab():
    data = request.json
    required_fields = ['name', 'address', 'phone', 'email']
    for field in required_fields:
        if field not in data:
            return jsonify({'error': f'Missing required field: {field}'}), 400
    try:
        conn = get_db_connection()
        db_cursor = conn.cursor()
        db_cursor.execute('''
            INSERT INTO lab_info (name, address, phone, email)
            VALUES (%s, %s, %s, %s)
        ''', (
            data['name'],
            data['address'],
            data['phone'],
            data['email']
        ))
        conn.commit()
        conn.close()
        return jsonify({'message': 'Lab added successfully'}), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/reports/<int:patient_id>', methods=['GET'])
@token_required
def generate_report(patient_id):
    try:
        start = request.args.get('start')
        end = request.args.get('end')
        print(f"Received start: {start}, end: {end}")  # Log received dates

        conn = get_db_connection()
        db_cursor = conn.cursor()

        # Get patient information
        db_cursor.execute('SELECT * FROM patients WHERE id = %s', (patient_id,))
        patient_row = db_cursor.fetchone()
        if not patient_row:
            return jsonify({'error': 'Patient not found'}), 404

        patient_columns = [desc[0] for desc in db_cursor.description]
        patient = dict(zip(patient_columns, patient_row))

        # Fetch tests for the patient, filtered by test_date if start and end are provided
        if start and end:
            db_cursor.execute('''
                SELECT * FROM tests 
                WHERE patient_id = %s 
                  AND DATE(test_date) BETWEEN %s AND %s
                ORDER BY test_category, test_subcategory, test_date DESC
            ''', (patient_id, start, end))
        else:
            db_cursor.execute('''
                SELECT * FROM tests 
                WHERE patient_id = %s 
                ORDER BY test_category, test_subcategory, test_date DESC
            ''', (patient_id,))
        tests_rows = db_cursor.fetchall()
        test_columns = [desc[0] for desc in db_cursor.description]
        conn.close()

        # Print all test dates and names
        print("Fetched tests:")
        for test_row in tests_rows:
            test = dict(zip(test_columns, test_row))
            print(f"Test: {test['test_name']}, Date: {test['test_date']}")

        # Convert tests to list of dictionaries and calculate status
        test_list = []
        for test_row in tests_rows:
            test = dict(zip(test_columns, test_row))
            value = test['test_value']
            ref_range = str(test['normal_range'])
            status = 'Normal'
            ref = ref_range.replace('–', '-').replace(' ', '')
            match = re.match(r'^(\d+(?:\.\d+)?)-(\d+(?:\.\d+)?)$', ref)
            if match:
                low, high = float(match.group(1)), float(match.group(2))
                if float(value) < low:
                    status = 'Low'
                elif float(value) > high:
                    status = 'High'
            elif ref.startswith('<'):
                try:
                    high = float(ref[1:])
                    if float(value) >= high:
                        status = 'High'
                except:
                    pass
            elif ref.lower().startswith('upto') or ref.lower().startswith('up to'):
                try:
                    high = float(re.findall(r'\d+(?:\.\d+)?', ref)[0])
                    if float(value) > high:
                        status = 'High'
                except:
                    pass
            elif ref.lower() == 'positive':
                if str(value).lower() != 'positive':
                    status = 'Abnormal'
            elif ref.lower() == 'negative':
                if str(value).lower() != 'negative':
                    status = 'Abnormal'

            test_list.append({
                'id': test['id'],
                'testCategory': test['test_category'],
                'testSubcategory': test['test_subcategory'],
                'testName': test['test_name'],
                'testValue': value,
                'normalRange': test['normal_range'],
                'unit': test['unit'],
                'additionalNote': test['additional_note'],
                'testDate': test['test_date'].strftime('%Y-%m-%d %H:%M:%S') if test['test_date'] else None,
                'status': status
            })

        report = {
            'patientName': patient['full_name'],
            'patientCode': patient['patient_code'],
            'patientAge': patient['age'],
            'patientGender': patient['gender'],
            'contactNumber': patient['contact_number'],
            'refBy': patient['ref_by'],
            'tests': test_list
        }

        return jsonify(report)
    except Exception as e:
        print(f"Error generating report: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/login', methods=['POST', 'OPTIONS'])
def login():
    if request.method == 'OPTIONS':
        return '', 200
        
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400
            
        email = data.get('email')
        password = data.get('password')
        
        if not email or not password:
            return jsonify({'error': 'Missing email or password'}), 400
        
        conn = get_db_connection()
        db_cursor = conn.cursor()
        db_cursor.execute('SELECT id, password FROM users WHERE email = %s', (email,))
        user = db_cursor.fetchone()
        conn.close()
        
        if not user:
            return jsonify({'error': 'Invalid email address'}), 401
            
        # user[1] is the hashed password from the database
        if not bcrypt.checkpw(password.encode('utf-8'), user[1].encode('utf-8')):
            return jsonify({'error': 'Invalid password'}), 401
            
        payload = {
            'user_id': user[0],
            'email': email,
            'exp': datetime.utcnow() + timedelta(days=1)
        }
        token = jwt.encode(payload, SECRET_KEY, algorithm='HS256')
        return jsonify({'token': token, 'email': email})
            
    except Exception as e:
        print(f"Login error: {str(e)}")  # Add logging
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/api/admin/update-credentials', methods=['POST'])
@token_required
def update_admin_credentials():
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400
            
        new_email = data.get('email')
        new_password = data.get('password')
        current_password = data.get('currentPassword')
        
        if not new_email or not new_password or not current_password:
            return jsonify({'error': 'Missing required fields'}), 400
            
        conn = get_db_connection()
        db_cursor = conn.cursor()
        
        # Verify current password
        db_cursor.execute('SELECT password FROM users WHERE email = %s', (request.user['email'],))
        user = db_cursor.fetchone()
        
        if not user or not bcrypt.checkpw(current_password.encode('utf-8'), user[0].encode('utf-8')):
            conn.close()
            return jsonify({'error': 'Current password is incorrect'}), 401
            
        # Update credentials
        hashed_password = bcrypt.hashpw(new_password.encode('utf-8'), bcrypt.gensalt())
        db_cursor.execute('UPDATE users SET email = %s, password = %s WHERE email = %s',
                         (new_email, hashed_password.decode('utf-8'), request.user['email']))
        conn.commit()
        conn.close()
        
        return jsonify({'message': 'Credentials updated successfully'})
        
    except Exception as e:
        print(f"Update credentials error: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/api/reports/track', methods=['POST'])
@token_required
def track_report():
    try:
        data = request.json
        if not data or 'patientId' not in data:
            return jsonify({'error': 'Patient ID is required'}), 400

        conn = get_db_connection()
        db_cursor = conn.cursor()
        
        # Insert report record
        db_cursor.execute('''
            INSERT INTO reports (patient_id)
            VALUES (%s)
        ''', (data['patientId'],))
        
        conn.commit()
        conn.close()
        
        return jsonify({'message': 'Report tracked successfully'}), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/reports/count', methods=['GET'])
@token_required
def get_reports_count():
    try:
        conn = get_db_connection()
        db_cursor = conn.cursor()
        
        # Get total reports count
        db_cursor.execute('SELECT COUNT(*) as count FROM reports')
        result = db_cursor.fetchone()
        conn.close()
        
        return jsonify({'count': result[0]}) # Access by index
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/reports/recent', methods=['GET'])
@token_required
def get_recent_reports():
    try:
        conn = get_db_connection()
        db_cursor = conn.cursor(dictionary=True) # Fetch as dictionary
        
        # Get recent reports with patient names
        db_cursor.execute('''
            SELECT r.*, p.full_name as patient_name
            FROM reports r
            JOIN patients p ON r.patient_id = p.id
            ORDER BY r.generated_at DESC
            LIMIT 10
        ''')
        reports = db_cursor.fetchall()
        conn.close()
        
        return jsonify(reports)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/lab-info', methods=['GET'])
@token_required
def get_lab_info():
    try:
        conn = get_db_connection()
        db_cursor = conn.cursor(dictionary=True)
        db_cursor.execute('SELECT * FROM lab_info WHERE id = 1')
        lab_info = db_cursor.fetchone()
        conn.close()
        if lab_info:
            return jsonify(lab_info)
        return jsonify({'error': 'Lab info not found'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/lab-info', methods=['POST'])
@token_required
def add_lab_info():
    data = request.json
    required_fields = ['name', 'address', 'phone', 'email']
    for field in required_fields:
        if field not in data:
            return jsonify({'error': f'Missing required field: {field}'}), 400
    try:
        conn = get_db_connection()
        db_cursor = conn.cursor()
        db_cursor.execute('''
            INSERT INTO lab_info (name, address, phone, email)
            VALUES (%s, %s, %s, %s)
        ''', (
            data['name'],
            data['address'],
            data['phone'],
            data['email']
        ))
        conn.commit()
        conn.close()
        return jsonify({'message': 'Lab info added successfully'}), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/lab-info', methods=['PUT'])
@token_required
def update_lab_info():
    data = request.json
    required_fields = ['name', 'address', 'phone', 'email']
    for field in required_fields:
        if field not in data:
            return jsonify({'error': f'Missing required field: {field}'}), 400
    try:
        conn = get_db_connection()
        db_cursor = conn.cursor()
        db_cursor.execute('''
            UPDATE lab_info 
            SET name = %s, address = %s, phone = %s, email = %s
            WHERE id = 1
        ''', (
            data['name'],
            data['address'],
            data['phone'],
            data['email']
        ))
        conn.commit()
        conn.close()
        return jsonify({'message': 'Lab info updated successfully'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/ref-doctors', methods=['GET'])
@token_required
def get_ref_doctors():
    try:
        conn = get_db_connection()
        db_cursor = conn.cursor(dictionary=True) # Fetch as dictionary
        db_cursor.execute('SELECT * FROM ref_doctors ORDER BY name ASC')
        doctors = db_cursor.fetchall()
        conn.close()
        return jsonify(doctors)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/ref-doctors', methods=['POST'])
@token_required
def add_ref_doctor():
    try:
        data = request.json
        if 'name' not in data:
            return jsonify({'error': 'Missing required field: name'}), 400
        
        conn = get_db_connection()
        db_cursor = conn.cursor()
        db_cursor.execute('''
            INSERT INTO ref_doctors (name, specialization)
            VALUES (%s, %s)
        ''', (data['name'], data.get('specialization')))
        
        conn.commit()
        conn.close()
        return jsonify({'message': 'Reference doctor added successfully'}), 201
    except mysql.connector.IntegrityError as e:
        if "Duplicate entry" in str(e) and "name" in str(e):
            return jsonify({'error': 'Reference doctor with this name already exists'}), 400
        return jsonify({'error': str(e)}), 500
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/ref-doctors/<int:doctor_id>', methods=['PUT'])
@token_required
def update_ref_doctor(doctor_id):
    try:
        data = request.json
        if 'name' not in data:
            return jsonify({'error': 'Missing required field: name'}), 400
        
        conn = get_db_connection()
        db_cursor = conn.cursor()
        
        # Check if doctor exists
        db_cursor.execute('SELECT id FROM ref_doctors WHERE id = %s', (doctor_id,))
        if not db_cursor.fetchone():
            conn.close()
            return jsonify({'error': 'Reference doctor not found'}), 404
        
        db_cursor.execute('''
            UPDATE ref_doctors 
            SET name = %s, specialization = %s
            WHERE id = %s
        ''', (data['name'], data.get('specialization'), doctor_id))
        
        conn.commit()
        conn.close()
        return jsonify({'message': 'Reference doctor updated successfully'}), 200
    except mysql.connector.IntegrityError as e:
        if "Duplicate entry" in str(e) and "name" in str(e):
            return jsonify({'error': 'Reference doctor with this name already exists'}), 400
        return jsonify({'error': str(e)}), 500
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/ref-doctors/<int:doctor_id>', methods=['DELETE'])
@token_required
def delete_ref_doctor(doctor_id):
    try:
        conn = get_db_connection()
        db_cursor = conn.cursor()
        
        # Check if doctor exists
        db_cursor.execute('SELECT id FROM ref_doctors WHERE id = %s', (doctor_id,))
        if not db_cursor.fetchone():
            conn.close()
            return jsonify({'error': 'Reference doctor not found'}), 404
        
        db_cursor.execute('DELETE FROM ref_doctors WHERE id = %s', (doctor_id,))
        conn.commit()
        conn.close()
        return jsonify({'message': 'Reference doctor deleted successfully'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/tests/categories', methods=['GET'])
@token_required
def get_test_categories():
    try:
        conn = get_db_connection()
        db_cursor = conn.cursor(dictionary=True) # Fetch as dictionary

        # Get all tests without grouping or JSON functions
        db_cursor.execute('''
            SELECT id, name, category, subcategory, reference_range, unit, price
            FROM test_catalog
        ''')

        all_tests = db_cursor.fetchall()
        conn.close()

        # Group by category first, then subcategory in Python
        result = {}
        for test in all_tests:
            category = test['category']
            subcategory = test['subcategory']

            if category not in result:
                result[category] = {
                    'category': category,
                    'subcategories': []
                }

            # Find existing subcategory or create a new one
            found_subcategory = None
            for sub_item in result[category]['subcategories']:
                if sub_item['subcategory'] == subcategory:
                    found_subcategory = sub_item
                    break
            
            if not found_subcategory:
                found_subcategory = {
                    'subcategory': subcategory,
                    'tests': []
                }
                result[category]['subcategories'].append(found_subcategory)
            
            found_subcategory['tests'].append({
                'id': test['id'],
                'name': test['name'],
                'referenceRange': test['reference_range'],
                'unit': test['unit'],
                'price': test['price']
            })
        
        # Sort subcategories and tests for consistent order
        for category_data in result.values():
            category_data['subcategories'].sort(key=lambda x: x['subcategory'])
            for subcategory_data in category_data['subcategories']:
                subcategory_data['tests'].sort(key=lambda x: x['name'])

        return jsonify(list(result.values()))
    except Exception as e:
        print(f"Error fetching test categories: {str(e)}") # Add logging for debugging
        return jsonify({'error': str(e)}), 500

@app.route('/api/patients/latest-code', methods=['GET'])
@token_required
def get_latest_patient_code():
    try:
        conn = get_db_connection()
        db_cursor = conn.cursor()
        db_cursor.execute('SELECT patient_code FROM patients ORDER BY id DESC LIMIT 1')
        latest_code_row = db_cursor.fetchone()
        conn.close()

        if latest_code_row and latest_code_row[0]:
            latest_code = latest_code_row[0]
            # Extract number, increment, and format to PAT000001
            match = re.match(r'PAT(\d+)', latest_code)
            if match:
                num = int(match.group(1))
                new_num = num + 1
                new_code = f'PAT{new_num:06d}' # Format as PAT000001, PAT000002, etc.
            else:
                new_code = 'PAT000001' # Fallback if format is unexpected
        else:
            new_code = 'PAT000001' # First patient

        return jsonify({'code': new_code})
    except Exception as e:
        print(f"Error fetching latest patient code: {str(e)}") # Add logging for debugging
        return jsonify({'error': str(e)}), 500

@app.route('/api/test-results/<int:test_id>', methods=['DELETE'])
@token_required
def delete_test_result(test_id):
    try:
        conn = get_db_connection()
        db_cursor = conn.cursor()
        
        # Check if test result exists
        db_cursor.execute('SELECT id FROM tests WHERE id = %s', (test_id,))
        if not db_cursor.fetchone():
            conn.close()
            return jsonify({'error': 'Test result not found'}), 404
        
        # Delete test result
        db_cursor.execute('DELETE FROM tests WHERE id = %s', (test_id,))
        conn.commit()
        conn.close()
        return jsonify({'message': 'Test result deleted successfully'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/profile', methods=['GET'])
@token_required
def get_profile():
    try:
        conn = get_db_connection()
        db_cursor = conn.cursor(dictionary=True) # Fetch as dictionary
        
        # Get user profile from database using user_id from token
        db_cursor.execute('SELECT email, full_name, phone, role FROM users WHERE id = %s', 
                           (request.user['user_id'],))
        user = db_cursor.fetchone()
        conn.close()
        
        if user:
            return jsonify({
                'email': user['email'],
                'fullName': user['full_name'],
                'phone': user['phone'],
                'role': user['role']
            })
        return jsonify({'error': 'User profile not found'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/profile', methods=['PUT'])
@token_required
def update_profile():
    try:
        data = request.json
        conn = get_db_connection()
        db_cursor = conn.cursor()
        
        db_cursor.execute('''
            UPDATE users 
            SET full_name = %s, phone = %s, role = %s
            WHERE id = %s
        ''', (
            data.get('fullName'),
            data.get('phone'),
            data.get('role'),
            request.user['user_id']
        ))
        conn.commit()
        conn.close()
        return jsonify({'message': 'Profile updated successfully'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/security/change-email', methods=['POST'])
@token_required
def change_email():
    try:
        data = request.json
        current_password = data.get('currentPassword')
        new_email = data.get('newEmail')

        if not current_password or not new_email:
            return jsonify({'error': 'Missing current password or new email'}), 400

        conn = get_db_connection()
        db_cursor = conn.cursor()
        
        # Verify current password
        db_cursor.execute('SELECT password FROM users WHERE id = %s', (request.user['user_id'],))
        user = db_cursor.fetchone()
        
        if not user or not bcrypt.checkpw(current_password.encode('utf-8'), user[0].encode('utf-8')):
            conn.close()
            return jsonify({'error': 'Current password is incorrect'}), 401
            
        # Check if new email already exists
        db_cursor.execute('SELECT id FROM users WHERE email = %s', (new_email,))
        if db_cursor.fetchone():
            conn.close()
            return jsonify({'error': 'Email already in use'}), 400
            
        # Update email
        db_cursor.execute('UPDATE users SET email = %s WHERE id = %s',
                          (new_email, request.user['user_id']))
        conn.commit()
        conn.close()
        return jsonify({'message': 'Email updated successfully'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/security/change-password', methods=['POST'])
@token_required
def change_password():
    try:
        data = request.json
        current_password = data.get('currentPassword')
        new_password = data.get('newPassword')

        if not current_password or not new_password:
            return jsonify({'error': 'Missing current password or new password'}), 400

        conn = get_db_connection()
        db_cursor = conn.cursor()
        
        # Verify current password
        db_cursor.execute('SELECT password FROM users WHERE id = %s', (request.user['user_id'],))
        user = db_cursor.fetchone()
        
        if not user or not bcrypt.checkpw(current_password.encode('utf-8'), user[0].encode('utf-8')):
            conn.close()
            return jsonify({'error': 'Current password is incorrect'}), 401
            
        # Update password
        hashed_password = bcrypt.hashpw(new_password.encode('utf-8'), bcrypt.gensalt())
        db_cursor.execute('UPDATE users SET password = %s WHERE id = %s',
                          (hashed_password.decode('utf-8'), request.user['user_id']))
        conn.commit()
        conn.close()
        return jsonify({'message': 'Password updated successfully'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/current-date', methods=['GET'])
@token_required
def get_current_date():
    try:
        # Get current date in YYYY-MM-DD format
        current_date = datetime.now().strftime('%Y-%m-%d')
        return jsonify({'date': current_date}), 200
    except Exception as e:
        print(f"Error fetching current date: {str(e)}")
        return jsonify({'error': str(e)}), 500


# At the bottom, initialize DB on startup
if __name__ == '__main__':
    init_db()
    init_user_table()
    app.run(debug=True, port=5000)