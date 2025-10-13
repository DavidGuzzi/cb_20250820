#!/usr/bin/env python3
"""
Generate SQL dump with schema and data for self-contained PostgreSQL in Docker
Reads from app_db_20251008_2014.xlsx and generates a complete SQL file
"""

import os
import sys
import pandas as pd
import logging
from datetime import datetime

# Add parent directory to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

EXCEL_FILE = 'app_db_20251008_2014.xlsx'
SCHEMA_FILE = 'backend/database/schema.sql'
OUTPUT_FILE = 'backend/database/init_data.sql'

# Sheet to table mapping (same as migrate script)
SHEET_TO_TABLE = {
    'city_master': 'city_master',
    'typology_master': 'typology_master',
    'lever_master': 'lever_master',
    'category_master': 'category_master',
    'measurement_unit_master': 'measurement_unit_master',
    'data_source_master': 'data_source_master',
    'period_master': 'period_master',
    'store_master': 'store_master',
    'df_ab_test_final': 'ab_test_result',
    'df_ab_test_summary_final': 'ab_test_summary'
}


def escape_sql_value(value):
    """Escape value for SQL INSERT"""
    if value is None or pd.isna(value):
        return 'NULL'
    elif isinstance(value, str):
        # Escape single quotes
        escaped = value.replace("'", "''")
        return f"'{escaped}'"
    elif isinstance(value, (int, float)):
        # Handle NaN and Infinity
        if pd.isna(value):
            return 'NULL'
        return str(value)
    elif isinstance(value, datetime):
        return f"'{value.strftime('%Y-%m-%d')}'"
    elif isinstance(value, pd.Timestamp):
        return f"'{value.strftime('%Y-%m-%d')}'"
    else:
        return f"'{str(value)}'"


def generate_insert_statements(df: pd.DataFrame, table_name: str) -> list:
    """Generate INSERT statements from DataFrame"""
    statements = []

    # Get column names
    columns = df.columns.tolist()
    columns_str = ', '.join(columns)

    # Generate INSERT for each row
    for _, row in df.iterrows():
        values = [escape_sql_value(row[col]) for col in columns]
        values_str = ', '.join(values)
        statement = f"INSERT INTO {table_name} ({columns_str}) VALUES ({values_str});"
        statements.append(statement)

    return statements


def main():
    """Generate complete SQL dump"""
    logger.info("🚀 Generating SQL dump...")

    # Check if Excel file exists
    if not os.path.exists(EXCEL_FILE):
        logger.error(f"❌ Excel file not found: {EXCEL_FILE}")
        sys.exit(1)

    # Read schema
    if not os.path.exists(SCHEMA_FILE):
        logger.error(f"❌ Schema file not found: {SCHEMA_FILE}")
        sys.exit(1)

    with open(SCHEMA_FILE, 'r') as f:
        schema_sql = f.read()

    logger.info(f"✅ Schema loaded from {SCHEMA_FILE}")

    # Order matters: maestros first, then fact tables
    ordered_sheets = [
        'city_master',
        'typology_master',
        'lever_master',
        'category_master',
        'measurement_unit_master',
        'data_source_master',
        'period_master',
        'store_master',
        'df_ab_test_final',
        'df_ab_test_summary_final'
    ]

    # Generate INSERT statements
    all_inserts = []
    all_inserts.append("-- ============================================================================")
    all_inserts.append("-- DATA INSERTS")
    all_inserts.append(f"-- Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    all_inserts.append("-- ============================================================================\n")

    for sheet_name in ordered_sheets:
        if sheet_name in SHEET_TO_TABLE:
            table_name = SHEET_TO_TABLE[sheet_name]
            logger.info(f"📊 Processing '{sheet_name}' → '{table_name}'")

            try:
                # Read Excel sheet
                df = pd.read_excel(EXCEL_FILE, sheet_name=sheet_name)

                # Generate INSERT statements
                all_inserts.append(f"\n-- {table_name} ({len(df)} rows)")
                inserts = generate_insert_statements(df, table_name)
                all_inserts.extend(inserts)

                logger.info(f"  ✅ Generated {len(inserts)} INSERT statements")

            except Exception as e:
                logger.error(f"  ❌ Error processing '{sheet_name}': {e}")
                sys.exit(1)

    # Write complete SQL file (schema + data)
    logger.info(f"\n💾 Writing complete SQL to {OUTPUT_FILE}")

    os.makedirs(os.path.dirname(OUTPUT_FILE), exist_ok=True)

    with open(OUTPUT_FILE, 'w') as f:
        # Write header
        f.write("-- ============================================================================\n")
        f.write("-- COMPLETE DATABASE INITIALIZATION\n")
        f.write("-- Schema + Data for self-contained PostgreSQL\n")
        f.write(f"-- Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
        f.write("-- ============================================================================\n\n")

        # Write schema
        f.write(schema_sql)
        f.write("\n\n")

        # Write data inserts
        f.write('\n'.join(all_inserts))
        f.write("\n")

    logger.info("✅ SQL dump generated successfully!")
    logger.info(f"📁 Output: {OUTPUT_FILE}")

    # Show file size
    file_size = os.path.getsize(OUTPUT_FILE) / 1024 / 1024
    logger.info(f"📊 File size: {file_size:.2f} MB")


if __name__ == '__main__':
    main()
