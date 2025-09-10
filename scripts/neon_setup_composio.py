#!/usr/bin/env python3
"""
Setup Neon database tables using Composio integration
"""

import os
import sys
from pathlib import Path

def setup_neon_with_composio():
    """Setup Neon database using Composio"""
    
    try:
        from composio import ComposioToolSet, Action
        
        print("Initializing Composio toolset...")
        
        # Initialize toolset
        toolset = ComposioToolSet()
        
        # Read the schema file
        schema_file = Path(__file__).parent.parent / "client_subhive_schema.sql"
        
        if not schema_file.exists():
            print(f"Error: Schema file not found at {schema_file}")
            return False
            
        with open(schema_file, 'r') as f:
            schema_sql = f.read()
            
        print(f"Read schema from {schema_file}")
        print("\nAttempting to execute schema in Neon database via Composio...")
        
        # Try to execute SQL through Composio's PostgreSQL/Neon integration
        # Note: You may need to configure Composio with your Neon credentials first
        # Use: composio add neon
        
        try:
            # Execute the schema creation
            result = toolset.execute_action(
                action=Action.NEON_EXECUTE_SQL,
                params={
                    "sql": schema_sql
                }
            )
            
            print("Schema execution completed!")
            print(f"Result: {result}")
            
            return True
            
        except Exception as action_error:
            print(f"Composio action error: {str(action_error)}")
            print("\nTrying alternative approach...")
            
            # Alternative: Try using PostgreSQL action if Neon action doesn't work
            try:
                result = toolset.execute_action(
                    action=Action.POSTGRESQL_EXECUTE_QUERY,
                    params={
                        "query": schema_sql
                    }
                )
                
                print("Schema executed successfully via PostgreSQL action!")
                return True
                
            except Exception as pg_error:
                print(f"PostgreSQL action also failed: {str(pg_error)}")
                print("\nPlease ensure you have configured Composio with your Neon credentials:")
                print("  Run: composio add neon")
                print("  Or: composio add postgresql")
                return False
                
    except ImportError as e:
        print(f"Import error: {str(e)}")
        print("\nPlease ensure Composio is installed:")
        print("  pip install composio")
        return False
        
    except Exception as e:
        print(f"Unexpected error: {str(e)}")
        return False


def main():
    print("=" * 50)
    print("Neon Database Setup with Composio")
    print("=" * 50)
    print()
    
    print("This script will create the following in your Neon database:")
    print("  - Schemas: clnt2, clnt2_i_src")
    print("  - Tables in three layers:")
    print("    * Input (I): Raw input and profile tables")
    print("    * Middle (M): Core business entities")
    print("    * Output (O): Output and compliance tables")
    print()
    
    success = setup_neon_with_composio()
    
    if success:
        print("\n" + "=" * 50)
        print("SUCCESS: Database tables created!")
        print("=" * 50)
        print("\nCreated tables:")
        print("  INPUT LAYER:")
        print("    - clnt2.clnt_i_raw_input")
        print("    - clnt2.clnt_i_profile")
        print("  MIDDLE LAYER:")
        print("    - clnt2.clnt_m_client")
        print("    - clnt2.clnt_m_person")
        print("    - clnt2.clnt_m_plan")
        print("    - clnt2.clnt_m_plan_cost")
        print("    - clnt2.clnt_m_election")
        print("    - clnt2.clnt_m_vendor_link")
        print("    - clnt2.clnt_m_spd")
        print("  OUTPUT LAYER:")
        print("    - clnt2.clnt_o_output")
        print("    - clnt2.clnt_o_output_run")
        print("    - clnt2.clnt_o_compliance")
    else:
        print("\n" + "=" * 50)
        print("FAILED: Could not create database tables")
        print("=" * 50)
        print("\nTroubleshooting steps:")
        print("1. Ensure Composio is configured with your Neon credentials:")
        print("   Run: composio add neon")
        print("2. Check that your Neon database is accessible")
        print("3. Verify you have the necessary permissions")
        print("\nAlternatively, you can manually run the SQL from:")
        print(f"  {Path(__file__).parent.parent / 'client_subhive_schema.sql'}")
        
    return 0 if success else 1


if __name__ == "__main__":
    sys.exit(main())