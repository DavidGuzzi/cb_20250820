#!/usr/bin/env python3
"""
Script de migración: Excel + Parquet → PostgreSQL
Migra datos desde app_db_20251015_1757.xlsx y df_ab_test_simulations.parquet a PostgreSQL

Uso:
    python backend/scripts/migrate_excel_to_postgres.py [--truncate]

Prerrequisitos:
    - Docker Compose PostgreSQL corriendo
    - pip install pandas openpyxl psycopg2-binary pyarrow
"""

import os
import sys
import pandas as pd
import psycopg2
from psycopg2.extras import execute_values
from typing import Dict, List
import logging
from datetime import datetime

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

# File paths
EXCEL_FILE = 'app_db_20251015_1926.xlsx'
PARQUET_FILE = 'df_ab_test_simulations.parquet'

# Sheet to table mapping (Excel)
SHEET_TO_TABLE = {
    'city_master': 'city_master',
    'typology_master': 'typology_master',
    'lever_master': 'lever_master',
    'category_master': 'category_master',
    'measurement_unit_master': 'measurement_unit_master',
    'data_source_master': 'data_source_master',
    'period_master': 'period_master',
    'store_master': 'store_master',
    'audit_master': 'audit_master',
    'df_ab_test_final': 'ab_test_result',
    'df_ab_test_summary_final': 'ab_test_summary',
    'capex_fee': 'capex_fee',
    'df_ab_test_simulations_summary': 'simulation_summary'
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
            logger.info(f"📊 Read sheet '{sheet_name}': {len(df):,} rows")
            return df
        except Exception as e:
            logger.error(f"❌ Error reading sheet '{sheet_name}': {e}")
            raise

    def read_parquet(self, file_path: str) -> pd.DataFrame:
        """Read Parquet file into DataFrame"""
        try:
            logger.info(f"📦 Reading Parquet file: {file_path}")
            df = pd.read_parquet(file_path)
            logger.info(f"📊 Loaded {len(df):,} rows × {len(df.columns)} columns")
            logger.info(f"💾 Memory: {df.memory_usage(deep=True).sum() / 1024**2:.2f} MB")
            return df
        except Exception as e:
            logger.error(f"❌ Error reading Parquet '{file_path}': {e}")
            raise

    def insert_dataframe(self, df: pd.DataFrame, table_name: str, batch_size: int = 10000):
        """Insert DataFrame into PostgreSQL table with batching for large datasets"""
        try:
            # Replace NaN with None for SQL NULL
            df = df.where(pd.notna(df), None)

            # Get column names
            columns = df.columns.tolist()
            columns_str = ', '.join(columns)

            total_rows = len(df)
            inserted_rows = 0

            # Use larger batch size for better performance
            logger.info(f"📥 Inserting {total_rows:,} rows in batches of {batch_size:,}...")

            # Process in batches
            for start_idx in range(0, total_rows, batch_size):
                end_idx = min(start_idx + batch_size, total_rows)
                batch_df = df.iloc[start_idx:end_idx]

                # Convert batch to list of tuples
                values = [tuple(row) for row in batch_df.values]

                # Execute batch insert
                execute_values(
                    self.cursor,
                    f"INSERT INTO {table_name} ({columns_str}) VALUES %s",
                    values,
                    template=None,
                    page_size=1000
                )

                inserted_rows += len(values)

                # Commit every batch
                self.conn.commit()

                # Progress indicator for large datasets
                if total_rows > 50000:
                    progress = (inserted_rows / total_rows) * 100
                    logger.info(f"  Progress: {inserted_rows:,}/{total_rows:,} ({progress:.1f}%)")

            logger.info(f"✅ Inserted {total_rows:,} rows into '{table_name}'")

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

    def migrate_all(self, truncate: bool = False, parquet_file: str = None):
        """Migrate all data from Excel and Parquet to PostgreSQL"""
        start_time = datetime.now()
        logger.info("🚀 Starting migration...")
        logger.info(f"⏰ Started at: {start_time.strftime('%Y-%m-%d %H:%M:%S')}")

        # Order matters: maestros first, then fact tables, then simulations
        ordered_sheets = [
            'city_master',
            'typology_master',
            'lever_master',
            'category_master',
            'measurement_unit_master',
            'data_source_master',
            'period_master',
            'store_master',
            'audit_master',
            'df_ab_test_final',
            'df_ab_test_summary_final',
            'capex_fee',
            'df_ab_test_simulations_summary'
        ]

        # Migrate Excel sheets
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

        # Migrate Parquet file (simulation_result - 1M+ rows)
        if parquet_file and os.path.exists(parquet_file):
            logger.info(f"\n🔥 Processing Parquet: '{parquet_file}' → 'simulation_result'")

            # Read Parquet
            df_parquet = self.read_parquet(parquet_file)

            # Truncate if requested
            if truncate:
                self.truncate_table('simulation_result')

            # Insert with larger batch size for performance
            self.insert_dataframe(df_parquet, 'simulation_result', batch_size=20000)
        else:
            logger.warning(f"⚠️  Parquet file not found: {parquet_file}")

        # Calculate elapsed time
        end_time = datetime.now()
        elapsed = (end_time - start_time).total_seconds()
        logger.info(f"\n✅ Migration completed successfully!")
        logger.info(f"⏱️  Total time: {elapsed:.1f} seconds ({elapsed/60:.1f} minutes)")

    def validate_migration(self):
        """Validate migration by counting rows"""
        logger.info("\n🔍 Validating migration...")

        all_tables = list(SHEET_TO_TABLE.values()) + ['simulation_result']

        total_rows = 0
        for table_name in sorted(set(all_tables)):  # Remove duplicates and sort
            try:
                self.cursor.execute(f"SELECT COUNT(*) FROM {table_name}")
                count = self.cursor.fetchone()[0]
                total_rows += count
                logger.info(f"  {table_name:30s}: {count:>12,} rows")
            except Exception as e:
                logger.warning(f"  {table_name:30s}: ⚠️  Error - {e}")

        logger.info(f"\n📊 Total rows across all tables: {total_rows:,}")


def main():
    """Main execution"""
    import argparse

    parser = argparse.ArgumentParser(
        description='Migrate Excel + Parquet data to PostgreSQL',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python backend/scripts/migrate_excel_to_postgres.py --truncate
  python backend/scripts/migrate_excel_to_postgres.py --validate-only
  python backend/scripts/migrate_excel_to_postgres.py --truncate --parquet df_ab_test_simulations.parquet
        """
    )
    parser.add_argument('--truncate', action='store_true', help='Truncate tables before insert')
    parser.add_argument('--validate-only', action='store_true', help='Only validate existing data')
    parser.add_argument('--parquet', type=str, default=PARQUET_FILE, help=f'Path to Parquet file (default: {PARQUET_FILE})')
    args = parser.parse_args()

    # Check if Excel file exists
    if not os.path.exists(EXCEL_FILE):
        logger.error(f"❌ Excel file not found: {EXCEL_FILE}")
        logger.error(f"   Looking for: {os.path.abspath(EXCEL_FILE)}")
        sys.exit(1)

    # Check Parquet file (warning only, not fatal)
    if not os.path.exists(args.parquet):
        logger.warning(f"⚠️  Parquet file not found: {args.parquet}")
        logger.warning(f"   Simulation results will be skipped")

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
            migrator.migrate_all(truncate=args.truncate, parquet_file=args.parquet)

            # Validate
            migrator.validate_migration()

    except Exception as e:
        logger.error(f"❌ Migration failed: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
    finally:
        migrator.close()


if __name__ == '__main__':
    main()
