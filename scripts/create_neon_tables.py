#!/usr/bin/env python3
"""
Create Neon database tables using the client_subhive_schema.sql file
This script uses Composio for Neon database connection
"""

import os
import sys
from pathlib import Path

# Add parent directory to path to import modules
sys.path.append(str(Path(__file__).parent.parent))

def create_tables_in_neon():
    """Create all tables defined in client_subhive_schema.sql in Neon database"""
    
    try:
        # Try to import composio
        from composio import Composio, ComposioToolSet
        from composio.client import Composio as ComposioClient
        
        print("Initializing Composio connection to Neon...")
        
        # Initialize Composio client
        composio_client = Composio()
        
        # Get Neon connection through Composio
        neon_tool = composio_client.get_tool("neon")
        
        # Read the schema file
        schema_file = Path(__file__).parent.parent / "client_subhive_schema.sql"
        
        if not schema_file.exists():
            print(f"Error: Schema file not found at {schema_file}")
            return False
            
        with open(schema_file, 'r') as f:
            schema_sql = f.read()
            
        print(f"Read schema from {schema_file}")
        print("Executing schema creation in Neon database...")
        
        # Execute the schema SQL through Composio's Neon integration
        result = neon_tool.execute(
            action="execute_sql",
            params={
                "sql": schema_sql,
                "database": "client_subhive"  # Adjust database name as needed
            }
        )
        
        if result.get("success"):
            print("Successfully created all tables in Neon database!")
            print("\nCreated schemas:")
            print("  - clnt2 (main schema)")
            print("  - clnt2_i_src (input staging schema)")
            print("\nCreated tables:")
            print("  Input Layer (I):")
            print("    - clnt2.clnt_i_raw_input")
            print("    - clnt2.clnt_i_profile")
            print("  Middle Layer (M):")
            print("    - clnt2.clnt_m_client")
            print("    - clnt2.clnt_m_person")
            print("    - clnt2.clnt_m_plan")
            print("    - clnt2.clnt_m_plan_cost")
            print("    - clnt2.clnt_m_election")
            print("    - clnt2.clnt_m_vendor_link")
            print("    - clnt2.clnt_m_spd")
            print("  Output Layer (O):")
            print("    - clnt2.clnt_o_output")
            print("    - clnt2.clnt_o_output_run")
            print("    - clnt2.clnt_o_compliance")
            return True
        else:
            print(f"Error creating tables: {result.get('error', 'Unknown error')}")
            return False
            
    except ImportError:
        print("Error: Composio library not found. Please install with: pip install composio-core")
        return False
    except Exception as e:
        print(f"Error: {str(e)}")
        
        # Fallback: Try using psycopg2 directly if available
        print("\nAttempting fallback method using psycopg2...")
        try:
            import psycopg2
            from psycopg2 import sql
            
            # Try to get connection string from environment
            connection_string = os.getenv("NEON_DATABASE_URL") or os.getenv("DATABASE_URL")
            
            if not connection_string:
                print("Please set NEON_DATABASE_URL or DATABASE_URL environment variable")
                print("Format: postgresql://user:password@host/database?sslmode=require")
                return False
                
            conn = psycopg2.connect(connection_string)
            cur = conn.cursor()
            
            # Read and execute schema
            schema_file = Path(__file__).parent.parent / "client_subhive_schema.sql"
            with open(schema_file, 'r') as f:
                schema_sql = f.read()
                
            cur.execute(schema_sql)
            conn.commit()
            
            print("Successfully created tables using direct connection!")
            
            cur.close()
            conn.close()
            return True
            
        except ImportError:
            print("psycopg2 not installed. Install with: pip install psycopg2-binary")
            return False
        except Exception as e2:
            print(f"Fallback method also failed: {str(e2)}")
            return False


if __name__ == "__main__":
    print("=== Neon Database Table Creation ===")
    print("Creating tables for Client SubHive IMO schema...")
    print()
    
    success = create_tables_in_neon()
    
    if success:
        print("\nDatabase setup complete!")
        print("\nNext steps:")
        print("1. Verify tables in Neon console")
        print("2. Set up data ingestion pipelines")
        print("3. Configure API endpoints for data access")
    else:
        print("\nDatabase setup failed.")
        print("\nTroubleshooting:")
        print("1. Ensure Composio is configured with Neon credentials")
        print("2. Check that you have the necessary database permissions")
        print("3. Verify network connectivity to Neon")
        print("\nAlternatively, set NEON_DATABASE_URL environment variable and run again.")
        
    sys.exit(0 if success else 1)