#!/usr/bin/env python3
"""
Script de migración: Excel → PostgreSQL
Migra datos desde app_db_20251008_2014.xlsx a PostgreSQL

Uso:
    python backend/scripts/migrate_excel_to_postgres.py

Prerrequisitos:
    - Docker Compose PostgreSQL corriendo
    - pip install pandas openpyxl psycopg2-binary
"""

import os
import sys
import pandas as pd
import psycopg2
from psycopg2.extras import execute_values
from typing import Dict, List
import logging

# Add parent directory to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Database connection config
DB_CONFIG = {
    'dbname': os.getenv('POSTGRES_DB', 'gatorade_ab_testing'),
    'user': os.getenv('POSTGRES_USER', 'gatorade_user'),
    'password': os.getenv('DB_PASSWORD', 'gatorade_dev_password'),
    'host': os.getenv('DB_HOST', 'localhost'),
    'port': os.getenv('DB_PORT', '5432')
}

# Excel file path
EXCEL_FILE = 'app_db_20251008_2014.xlsx'

# Sheet to table mapping
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


class ExcelToPostgresMigrator:
    """Migrator class for Excel to PostgreSQL"""

    def __init__(self, excel_path: str, db_config: Dict):
        self.excel_path = excel_path
        self.db_config = db_config
        self.conn = None
        self.cursor = None

    def connect(self):
        """Connect to PostgreSQL database"""
        try:
            self.conn = psycopg2.connect(**self.db_config)
            self.cursor = self.conn.cursor()
            logger.info(f"✅ Connected to PostgreSQL: {self.db_config['dbname']}")
        except Exception as e:
            logger.error(f"❌ Connection failed: {e}")
            raise

    def close(self):
        """Close database connection"""
        if self.cursor:
            self.cursor.close()
        if self.conn:
            self.conn.close()
        logger.info("🔌 Database connection closed")

    def read_excel_sheet(self, sheet_name: str) -> pd.DataFrame:
        """Read Excel sheet into DataFrame"""
        try:
            df = pd.read_excel(self.excel_path, sheet_name=sheet_name)
            logger.info(f"📊 Read sheet '{sheet_name}': {len(df)} rows")
            return df
        except Exception as e:
            logger.error(f"❌ Error reading sheet '{sheet_name}': {e}")
            raise

    def insert_dataframe(self, df: pd.DataFrame, table_name: str):
        """Insert DataFrame into PostgreSQL table"""
        try:
            # Replace NaN with None for SQL NULL
            df = df.where(pd.notna(df), None)

            # Get column names
            columns = df.columns.tolist()

            # Prepare insert query
            columns_str = ', '.join(columns)
            placeholders = ', '.join(['%s'] * len(columns))
            query = f"INSERT INTO {table_name} ({columns_str}) VALUES ({placeholders})"

            # Convert DataFrame to list of tuples
            values = [tuple(row) for row in df.values]

            # Execute batch insert
            execute_values(
                self.cursor,
                f"INSERT INTO {table_name} ({columns_str}) VALUES %s",
                values,
                template=None,
                page_size=1000
            )

            self.conn.commit()
            logger.info(f"✅ Inserted {len(df)} rows into '{table_name}'")

        except Exception as e:
            self.conn.rollback()
            logger.error(f"❌ Error inserting into '{table_name}': {e}")
            raise

    def truncate_table(self, table_name: str):
        """Truncate table before inserting"""
        try:
            # Use CASCADE to handle foreign key constraints
            self.cursor.execute(f"TRUNCATE TABLE {table_name} RESTART IDENTITY CASCADE")
            self.conn.commit()
            logger.info(f"🗑️  Truncated table '{table_name}'")
        except Exception as e:
            logger.warning(f"⚠️  Could not truncate '{table_name}': {e}")
            self.conn.rollback()

    def migrate_all(self, truncate: bool = False):
        """Migrate all sheets from Excel to PostgreSQL"""
        logger.info("🚀 Starting migration...")

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

        for sheet_name in ordered_sheets:
            if sheet_name in SHEET_TO_TABLE:
                table_name = SHEET_TO_TABLE[sheet_name]

                logger.info(f"\n📋 Processing '{sheet_name}' → '{table_name}'")

                # Read Excel sheet
                df = self.read_excel_sheet(sheet_name)

                # Truncate if requested
                if truncate:
                    self.truncate_table(table_name)

                # Insert data
                self.insert_dataframe(df, table_name)

        logger.info("\n✅ Migration completed successfully!")

    def validate_migration(self):
        """Validate migration by counting rows"""
        logger.info("\n🔍 Validating migration...")

        for table_name in SHEET_TO_TABLE.values():
            self.cursor.execute(f"SELECT COUNT(*) FROM {table_name}")
            count = self.cursor.fetchone()[0]
            logger.info(f"  {table_name}: {count} rows")


def main():
    """Main execution"""
    import argparse

    parser = argparse.ArgumentParser(description='Migrate Excel data to PostgreSQL')
    parser.add_argument('--truncate', action='store_true', help='Truncate tables before insert')
    parser.add_argument('--validate-only', action='store_true', help='Only validate existing data')
    args = parser.parse_args()

    # Check if Excel file exists
    if not os.path.exists(EXCEL_FILE):
        logger.error(f"❌ Excel file not found: {EXCEL_FILE}")
        sys.exit(1)

    # Create migrator instance
    migrator = ExcelToPostgresMigrator(EXCEL_FILE, DB_CONFIG)

    try:
        # Connect to database
        migrator.connect()

        if args.validate_only:
            # Only validate
            migrator.validate_migration()
        else:
            # Run migration
            migrator.migrate_all(truncate=args.truncate)

            # Validate
            migrator.validate_migration()

    except Exception as e:
        logger.error(f"❌ Migration failed: {e}")
        sys.exit(1)
    finally:
        migrator.close()


if __name__ == '__main__':
    main()
