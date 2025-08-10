# Database Structure

This folder contains the database structure and setup files for the LabAssist application.

## Files
- `labassist_db.sql`: The main database schema and initial data

## Database Setup Instructions

1. Install XAMPP (if not already installed)
2. Start Apache and MySQL services from XAMPP Control Panel
3. Open phpMyAdmin (http://localhost/phpmyadmin)
4. Create a new database named `metacore_db`
5. Import the `metacore_db.sql` file:
        - Click on the `metacore_db` database
   - Click "Import" tab
        - Choose the `metacore_db.sql` file
   - Click "Go" to import

## Database Configuration

The database connection settings are configured in `backend/app.py`:
```python
DB_CONFIG = {
    'host': 'localhost',
    'user': 'root',
    'password': '',
    'database': 'metacore_db'
}
```

## Tables

1. `patients` - Stores patient information
2. `tests` - Stores test categories and configurations
3. `test_results` - Stores individual test results
4. `reports` - Stores generated reports
5. `doctors` - Stores reference doctor information
6. `lab_info` - Stores laboratory information

## Backup and Restore

To backup the database:
1. Open phpMyAdmin
2. Select the `metacore_db` database
3. Click "Export"
4. Choose "Quick" export method
5. Click "Go" to download the backup

To restore from backup:
1. Open phpMyAdmin
2. Select the `metacore_db` database
3. Click "Import"
4. Choose the backup file
5. Click "Go" to restore 