#!/usr/bin/env python3
"""
Setup Neon database tables using Composio
"""

import os
import sys
from pathlib import Path

def setup_neon_database():
    """Setup Neon database tables using Composio"""
    
    try:
        from composio import Composio
        
        print("Initializing Composio client...")
        
        # Initialize Composio client
        # You should have your API key set as COMPOSIO_API_KEY environment variable
        # Or pass it directly: client = Composio(api_key="your-api-key")
        client = Composio()
        
        # Read the schema file
        schema_file = Path(__file__).parent.parent / "client_subhive_schema.sql"
        
        if not schema_file.exists():
            print(f"Error: Schema file not found at {schema_file}")
            return False
            
        with open(schema_file, 'r') as f:
            schema_sql = f.read()
            
        print(f"Read schema from {schema_file}")
        print("\nExecuting schema in Neon database...")
        
        # Get connected apps
        print("Checking for connected Neon app...")
        connected_apps = client.connected_apps.get()
        
        neon_connected = False
        for app in connected_apps:
            if 'neon' in app.app_name.lower() or 'postgres' in app.app_name.lower():
                neon_connected = True
                print(f"Found connected database app: {app.app_name}")
                break
        
        if not neon_connected:
            print("\nNeon/PostgreSQL not connected to Composio.")
            print("Please connect your Neon database to Composio first.")
            print("\nSteps to connect:")
            print("1. Go to the Composio dashboard")
            print("2. Connect your Neon/PostgreSQL database")
            print("3. Run this script again")
            return False
        
        # Execute the SQL schema
        print("\nExecuting SQL schema...")
        
        # Try to execute through Composio's database integration
        # The exact method depends on how Composio exposes database operations
        # This is a general approach that should work with most Composio setups
        
        try:
            # Method 1: Try using actions
            actions = client.actions.get()
            
            # Look for database execute action
            db_action = None
            for action in actions:
                if 'execute' in action.name.lower() and ('sql' in action.name.lower() or 'query' in action.name.lower()):
                    db_action = action
                    print(f"Found database action: {action.name}")
                    break
            
            if db_action:
                result = client.actions.execute(
                    action_name=db_action.name,
                    params={"sql": schema_sql}
                )
                print("Schema executed successfully!")
                return True
            else:
                print("No suitable database execute action found in Composio.")
                
        except Exception as e:
            print(f"Error executing via actions: {str(e)}")
            
        # Method 2: Try direct execution if available
        try:
            # Some Composio setups might have direct database methods
            result = client.execute_sql(schema_sql)
            print("Schema executed successfully via direct method!")
            return True
        except AttributeError:
            print("Direct SQL execution not available in this Composio setup.")
        except Exception as e:
            print(f"Error with direct execution: {str(e)}")
            
        print("\nCould not execute schema through Composio.")
        print("Please check your Composio configuration and try again.")
        return False
        
    except ImportError:
        print("Error: Composio not installed.")
        print("Install with: pip install composio")
        return False
        
    except Exception as e:
        print(f"Unexpected error: {str(e)}")
        print("\nPlease ensure:")
        print("1. COMPOSIO_API_KEY environment variable is set")
        print("2. Your Neon database is connected in Composio")
        print("3. You have the necessary permissions")
        return False


def main():
    print("=" * 60)
    print("NEON DATABASE SETUP WITH COMPOSIO")
    print("=" * 60)
    print()
    
    # Check for API key
    if not os.getenv("COMPOSIO_API_KEY"):
        print("WARNING: COMPOSIO_API_KEY environment variable not set.")
        print("You may need to set this for Composio to work properly.")
        print()
    
    print("This will create the Client SubHive IMO schema in Neon:")
    print()
    print("SCHEMAS:")
    print("  - clnt2 (main schema)")
    print("  - clnt2_i_src (input staging)")
    print()
    print("TABLES:")
    print("  Input Layer (I):")
    print("    - clnt_i_raw_input")
    print("    - clnt_i_profile")
    print("  Middle Layer (M):")
    print("    - clnt_m_client")
    print("    - clnt_m_person")
    print("    - clnt_m_plan")
    print("    - clnt_m_plan_cost")
    print("    - clnt_m_election")
    print("    - clnt_m_vendor_link")
    print("    - clnt_m_spd")
    print("  Output Layer (O):")
    print("    - clnt_o_output")
    print("    - clnt_o_output_run")
    print("    - clnt_o_compliance")
    print()
    print("-" * 60)
    print()
    
    success = setup_neon_database()
    
    print()
    print("=" * 60)
    
    if success:
        print("SUCCESS! Database tables created.")
        print("=" * 60)
        print("\nNext steps:")
        print("1. Verify tables in your Neon console")
        print("2. Set up data ingestion pipelines")
        print("3. Configure API endpoints")
    else:
        print("SETUP INCOMPLETE")
        print("=" * 60)
        print("\nManual setup option:")
        print(f"Run the SQL file directly in Neon console:")
        print(f"  {Path(__file__).parent.parent / 'client_subhive_schema.sql'}")
        print("\nOr use psql:")
        print("  psql <connection-string> -f client_subhive_schema.sql")
    
    return 0 if success else 1


if __name__ == "__main__":
    sys.exit(main())