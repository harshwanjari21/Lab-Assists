import mysql.connector
import os
import bcrypt
from dotenv import load_dotenv

load_dotenv()

def get_db_connection():
    DB_HOST = os.getenv('MYSQL_DB_HOST', 'localhost')
    DB_USER = os.getenv('MYSQL_DB_USER', 'root')
    DB_PASSWORD = os.getenv('MYSQL_DB_PASSWORD', '')
    DB_NAME = os.getenv('MYSQL_DB_NAME', 'metacore_db')
    conn = mysql.connector.connect(
        host=DB_HOST,
        user=DB_USER,
        password=DB_PASSWORD,
        database=DB_NAME
    )
    return conn

def init_db():
    conn = get_db_connection()
    db_cursor = conn.cursor()
    db_cursor.execute('''
        CREATE TABLE IF NOT EXISTS patients (
            id INT AUTO_INCREMENT PRIMARY KEY,
            full_name VARCHAR(255) NOT NULL,
            age INT NOT NULL,
            gender VARCHAR(50) NOT NULL,
            contact_number VARCHAR(50) NOT NULL,
            email VARCHAR(255) NOT NULL,
            patient_code VARCHAR(255) NOT NULL UNIQUE,
            address TEXT NOT NULL,
            ref_by VARCHAR(255),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    db_cursor.execute('''
        CREATE TABLE IF NOT EXISTS tests (
            id INT AUTO_INCREMENT PRIMARY KEY,
            patient_id INT NOT NULL,
            test_category VARCHAR(255) NOT NULL,
            test_subcategory VARCHAR(255) NOT NULL,
            test_name VARCHAR(255) NOT NULL,
            test_value TEXT NOT NULL,
            normal_range TEXT,
            unit VARCHAR(50),
            test_date DATETIME DEFAULT CURRENT_TIMESTAMP,
            additional_note TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
        )
    ''')
    db_cursor.execute('''
        CREATE TABLE IF NOT EXISTS lab_info (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            address TEXT NOT NULL,
            phone VARCHAR(50) NOT NULL,
            email VARCHAR(255) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    db_cursor.execute('''
        CREATE TABLE IF NOT EXISTS test_catalog (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            category VARCHAR(255) NOT NULL,
            subcategory VARCHAR(255) NOT NULL,
            price FLOAT,
            reference_range TEXT,
            unit VARCHAR(50),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    db_cursor.execute('''
        CREATE TABLE IF NOT EXISTS ref_doctors (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            specialization VARCHAR(255),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    db_cursor.execute('''
        CREATE TABLE IF NOT EXISTS reports (
            id INT AUTO_INCREMENT PRIMARY KEY,
            patient_id INT NOT NULL,
            generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
        )
    ''')
    conn.commit()
    conn.close()
    return False

def init_user_table():
    conn = get_db_connection()
    db_cursor = conn.cursor()
    db_cursor.execute('''CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        full_name VARCHAR(255),
        phone VARCHAR(50),
        role VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )''')
    db_cursor.execute('SELECT COUNT(*) as count FROM users')
    user_count = db_cursor.fetchone()[0]
    if user_count == 0:
        admin_email = os.getenv('ADMIN_EMAIL', 'admin@labassist.com')
        admin_password = os.getenv('ADMIN_PASSWORD', 'labassist@admin123')
        hashed_password = bcrypt.hashpw(admin_password.encode('utf-8'), bcrypt.gensalt())
        db_cursor.execute('INSERT INTO users (email, password, full_name, role) VALUES (%s, %s, %s, %s)', 
                         (admin_email, hashed_password.decode('utf-8'), 'Admin User', 'admin'))
        print(f"Created initial admin user with email: {admin_email}")
    conn.commit()
    conn.close()