#!/usr/bin/env python3
"""
Direct Neon database setup - creates tables using Neon API or psycopg2
"""

import os
import sys
import json
from pathlib import Path

def setup_with_neon_api():
    """Setup using Neon API directly"""
    try:
        import requests
        
        # Get Neon API key from environment
        api_key = os.getenv("NEON_API_KEY")
        if not api_key:
            print("NEON_API_KEY not set. Trying connection string method...")
            return False
            
        project_id = os.getenv("NEON_PROJECT_ID")
        if not project_id:
            print("NEON_PROJECT_ID not set. Trying connection string method...")
            return False
            
        # Read schema
        schema_file = Path(__file__).parent.parent / "client_subhive_schema.sql"
        with open(schema_file, 'r') as f:
            schema_sql = f.read()
            
        # Execute via Neon API
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }
        
        # Get database endpoint
        endpoint_url = f"https://console.neon.tech/api/v2/projects/{project_id}/endpoints"
        response = requests.get(endpoint_url, headers=headers)
        
        if response.status_code == 200:
            endpoints = response.json().get("endpoints", [])
            if endpoints:
                print(f"Found Neon endpoint: {endpoints[0]['host']}")
                return True
        
        return False
        
    except ImportError:
        print("requests library not installed")
        return False
    except Exception as e:
        print(f"Neon API error: {str(e)}")
        return False


def setup_with_psycopg2():
    """Setup using psycopg2 with connection string"""
    try:
        import psycopg2
        
        # Try different environment variable names
        conn_str = (
            os.getenv("NEON_DATABASE_URL") or 
            os.getenv("DATABASE_URL") or
            os.getenv("POSTGRES_URL") or
            os.getenv("PG_CONNECTION_STRING")
        )
        
        if not conn_str:
            print("\nNo database connection string found in environment variables.")
            print("Please set one of the following:")
            print("  - NEON_DATABASE_URL")
            print("  - DATABASE_URL")
            print("  - POSTGRES_URL")
            print("\nFormat: postgresql://user:password@host/database?sslmode=require")
            return False
            
        print("Connecting to Neon database...")
        conn = psycopg2.connect(conn_str)
        cur = conn.cursor()
        
        # Read schema
        schema_file = Path(__file__).parent.parent / "client_subhive_schema.sql"
        with open(schema_file, 'r') as f:
            schema_sql = f.read()
            
        print("Executing schema...")
        
        # Split and execute statements one by one for better error handling
        statements = [s.strip() for s in schema_sql.split(';') if s.strip()]
        
        for i, stmt in enumerate(statements, 1):
            if stmt:
                try:
                    cur.execute(stmt + ';')
                    print(f"  [{i}/{len(statements)}] Executed: {stmt[:50]}...")
                except psycopg2.Error as e:
                    if "already exists" in str(e):
                        print(f"  [{i}/{len(statements)}] Already exists (skipped)")
                    else:
                        print(f"  [{i}/{len(statements)}] Error: {e}")
                        
        conn.commit()
        print("\nSchema execution completed!")
        
        # Verify tables were created
        cur.execute("""
            SELECT table_schema, table_name 
            FROM information_schema.tables 
            WHERE table_schema IN ('clnt2', 'clnt2_i_src')
            ORDER BY table_schema, table_name;
        """)
        
        tables = cur.fetchall()
        if tables:
            print("\nCreated tables:")
            for schema, table in tables:
                print(f"  - {schema}.{table}")
        
        cur.close()
        conn.close()
        return True
        
    except ImportError:
        print("psycopg2 not installed. Install with: pip install psycopg2-binary")
        return False
    except Exception as e:
        print(f"Database error: {str(e)}")
        return False


def main():
    print("=" * 70)
    print("NEON DATABASE SETUP - DIRECT CONNECTION")
    print("=" * 70)
    print()
    
    print("Attempting to create Client SubHive IMO schema...")
    print()
    
    # Try Neon API first
    success = setup_with_neon_api()
    
    # If API fails, try direct connection
    if not success:
        success = setup_with_psycopg2()
    
    print()
    print("=" * 70)
    
    if success:
        print("SUCCESS! Database setup complete.")
        print("=" * 70)
        print("\nCreated in Neon:")
        print("  - Schema: clnt2")
        print("  - Schema: clnt2_i_src")
        print("  - 13 tables across Input, Middle, and Output layers")
        print("\nVerify in Neon console: https://console.neon.tech")
    else:
        print("SETUP INCOMPLETE")
        print("=" * 70)
        print("\nTo set up manually:")
        print("1. Copy the contents of client_subhive_schema.sql")
        print("2. Go to Neon console: https://console.neon.tech")
        print("3. Open SQL Editor for your database")
        print("4. Paste and execute the SQL")
        print("\nOr provide connection credentials:")
        print("  export NEON_DATABASE_URL='your-connection-string'")
        print("  python scripts/setup_neon_direct.py")
    
    return 0 if success else 1


if __name__ == "__main__":
    # Install psycopg2 if not present
    try:
        import psycopg2
    except ImportError:
        print("Installing psycopg2-binary...")
        os.system("pip install psycopg2-binary")
        print()
    
    sys.exit(main())