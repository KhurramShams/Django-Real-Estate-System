import os
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.development")
django.setup()

from django.db import connection

def verify():
    with connection.cursor() as cursor:
        cursor.execute("SELECT current_database(), current_user, inet_server_addr(), inet_server_port(), version();")
        row = cursor.fetchone()
        print("=== AIVEN POSTGRESQL LIVE CONNECTION VERIFICATION ===")
        print(f"Active Database: {row[0]}")
        print(f"Active User:     {row[1]}")
        print(f"Server Host:     {row[2]}:{row[3]}")
        print(f"Engine Version:  {row[4]}")

        cursor.execute("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            ORDER BY table_name;
        """)
        tables = [t[0] for t in cursor.fetchall()]
        print(f"\nTables in Aiven PostgreSQL ({len(tables)} tables):")
        for table in tables:
            print(f"  [OK] {table}")

if __name__ == "__main__":
    verify()
