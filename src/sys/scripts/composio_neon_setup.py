#!/usr/bin/env python3
"""
CTB Metadata
ctb_id: CTB-C80FF5636BC3
ctb_branch: sys
ctb_path: sys/scripts/composio_neon_setup.py
ctb_version: 1.0.0
created: 2025-10-23T16:37:00.800139
checksum: 2e77ebbc
"""

"""
Setup Neon database using Composio SDK
Run this after configuring Composio with your credentials
"""

import os
import sys
from pathlib import Path

def setup_neon_via_composio():
    """Setup Neon database tables through Composio"""
    
    print("=" * 60)
    print("NEON DATABASE SETUP VIA COMPOSIO")
    print("=" * 60)
    print()
    
    try:
        from composio import Composio
        from composio.client import Composio as ComposioClient
        
        print("Composio SDK loaded successfully")
        
        # Initialize Composio
        # You need to have COMPOSIO_API_KEY in your environment
        # Or pass it directly: client = Composio(api_key="your-key")
        
        api_key = os.getenv("COMPOSIO_API_KEY")
        
        if api_key:
            print("Using COMPOSIO_API_KEY from environment")
            client = Composio(api_key=api_key)
        else:
            print("Attempting to use default Composio configuration")
            client = Composio()
        
        print("\nTo connect Neon to Composio:")
        print("1. Set your COMPOSIO_API_KEY environment variable")
        print("2. Connect Neon through Composio dashboard or API")
        print("3. Run this script again")
        print()
        
        # Read schema file
        schema_file = Path(__file__).parent.parent / "client_subhive_schema.sql"
        if not schema_file.exists():
            print(f"Error: Schema file not found at {schema_file}")
            return False
            
        with open(schema_file, 'r') as f:
            schema_sql = f.read()
        
        print(f"Schema loaded from: {schema_file}")
        print()
        
        # Try to get connected accounts
        try:
            print("Checking for connected integrations...")
            
            # Get list of connected accounts/integrations
            # The exact method depends on your Composio setup
            # This is a general approach
            
            # Option 1: Try to list connected accounts
            connected = client.connected_accounts.list()
            
            if connected:
                print(f"Found {len(connected)} connected account(s)")
                for account in connected:
                    print(f"  - {account}")
            else:
                print("No connected accounts found")
                print("\nPlease connect your Neon database to Composio first")
                return False
                
        except AttributeError:
            print("Could not list connected accounts")
            print("Your Composio version may require different methods")
            
        except Exception as e:
            print(f"Error checking connections: {str(e)}")
            
        print("\nNOTE: Composio integration requires:")
        print("1. Valid COMPOSIO_API_KEY")
        print("2. Neon database connected in Composio")
        print("3. Proper permissions to execute SQL")
        
        return False
        
    except ImportError:
        print("Composio not installed. Install with:")
        print("  pip install composio")
        return False
        
    except Exception as e:
        print(f"Error: {str(e)}")
        return False


def fallback_direct_connection():
    """Fallback to direct database connection"""
    
    print("\n" + "-" * 60)
    print("FALLBACK: Attempting direct database connection")
    print("-" * 60)
    
    try:
        import psycopg2
        
        # Look for connection string
        conn_str = os.getenv("NEON_DATABASE_URL") or os.getenv("DATABASE_URL")
        
        if not conn_str:
            print("\nTo connect directly to Neon, set one of:")
            print("  export NEON_DATABASE_URL='postgresql://...'")
            print("  export DATABASE_URL='postgresql://...'")
            print("\nGet your connection string from:")
            print("  https://console.neon.tech -> Your Project -> Connection Details")
            return False
            
        print("Found database connection string")
        print("Connecting to Neon...")
        
        conn = psycopg2.connect(conn_str)
        cur = conn.cursor()
        
        # Read schema
        schema_file = Path(__file__).parent.parent / "client_subhive_schema.sql"
        with open(schema_file, 'r') as f:
            schema_sql = f.read()
            
        print("Executing schema...")
        
        # Execute the schema
        cur.execute(schema_sql)
        conn.commit()
        
        print("Schema executed successfully!")
        
        # List created tables
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
                print(f"  {schema}.{table}")
                
        cur.close()
        conn.close()
        
        return True
        
    except ImportError:
        print("psycopg2 not installed")
        print("Install with: pip install psycopg2-binary")
        return False
        
    except Exception as e:
        print(f"Direct connection failed: {str(e)}")
        return False


def main():
    print("\nCLIENT SUBHIVE - NEON DATABASE SETUP")
    print("=" * 60)
    print()
    
    # Try Composio first
    success = setup_neon_via_composio()
    
    if not success:
        # Try direct connection as fallback
        success = fallback_direct_connection()
    
    print()
    print("=" * 60)
    
    if success:
        print("SUCCESS! Database tables created")
        print("=" * 60)
        print("\nCreated in Neon:")
        print("  Schemas: clnt2, clnt2_i_src")
        print("  Tables: 13 tables across IMO layers")
        print("\nNext steps:")
        print("1. Verify in Neon console")
        print("2. Set up data pipelines")
        print("3. Configure API access")
    else:
        print("SETUP INCOMPLETE")
        print("=" * 60)
        print("\nOptions to complete setup:")
        print()
        print("OPTION 1 - Composio:")
        print("  1. Get Composio API key from https://composio.dev")
        print("  2. Set: export COMPOSIO_API_KEY='your-key'")
        print("  3. Connect Neon in Composio dashboard")
        print("  4. Run this script again")
        print()
        print("OPTION 2 - Direct Connection:")
        print("  1. Get connection string from Neon console")
        print("  2. Set: export NEON_DATABASE_URL='postgresql://...'")
        print("  3. Run: python scripts/setup_neon_direct.py")
        print()
        print("OPTION 3 - Manual:")
        print("  1. Copy client_subhive_schema.sql contents")
        print("  2. Paste in Neon SQL Editor")
        print("  3. Execute")
    
    return 0 if success else 1


if __name__ == "__main__":
    sys.exit(main())