-- ============================================================================
-- PostgreSQL Schema for A/B Testing Gatorade
-- Based on: app_db_20251008_2014.xlsx
-- Created: October 2025
-- ============================================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- MAESTROS (Master Tables)
-- ============================================================================

-- City Master
CREATE TABLE city_master (
    city_id SERIAL PRIMARY KEY,
    city_name VARCHAR(100) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Typology Master (Super & Hyper, Convenience, Pharmacies)
CREATE TABLE typology_master (
    typology_id SERIAL PRIMARY KEY,
    typology_name VARCHAR(100) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Lever Master (Palancas: Square meters, Checkout cooler, etc.)
CREATE TABLE lever_master (
    lever_id SERIAL PRIMARY KEY,
    lever_name VARCHAR(100) NOT NULL UNIQUE,
    lever_name_clean VARCHAR(100),  -- Cleaned name for API/code usage
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Category Master (Gatorade, 500ml, 1000ml, Sugar-free)
CREATE TABLE category_master (
    category_id SERIAL PRIMARY KEY,
    category_name VARCHAR(100) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Measurement Unit Master (Standardized Cases, Sales)
CREATE TABLE measurement_unit_master (
    unit_id SERIAL PRIMARY KEY,
    unit_name VARCHAR(50) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Data Source Master (Sell In, Sell Out)
CREATE TABLE data_source_master (
    source_id SERIAL PRIMARY KEY,
    source_name VARCHAR(50) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Period Master (Weeks/Months)
CREATE TABLE period_master (
    period_id SERIAL PRIMARY KEY,
    period_label VARCHAR(20) NOT NULL,  -- e.g., "202501" (can be Week or Month)
    period_type VARCHAR(10) NOT NULL,   -- "Week" or "Month"
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_period_type CHECK (period_type IN ('Week', 'Month')),
    CONSTRAINT unique_period_label_type UNIQUE (period_label, period_type)
);

-- Store Master (PDVs with Sell In/Out codes)
CREATE TABLE store_master (
    id SERIAL PRIMARY KEY,
    store_code_sellin VARCHAR(50),
    store_code_sellout VARCHAR(50),
    store_name VARCHAR(200) NOT NULL,
    city_id INTEGER REFERENCES city_master(city_id),
    typology_id INTEGER REFERENCES typology_master(typology_id),
    lever_id INTEGER REFERENCES lever_master(lever_id),  -- Palanca asignada
    start_date_sellin DATE,
    end_date_sellin DATE,
    start_date_sellout DATE,
    end_date_sellout DATE,
    execution_ok VARCHAR(10),  -- Status: "OK", "Pending", etc.
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    -- Note: No UNIQUE constraints on store codes because "-" appears multiple times
);

-- Audit Master (Auditorías de tiendas por semana)
CREATE TABLE audit_master (
    id SERIAL PRIMARY KEY,
    cod_pdv BIGINT NOT NULL,  -- Store code (can be sellin or sellout code)
    week VARCHAR(50) NOT NULL,  -- Week label (e.g., "Ruta SEMANA 1")
    date VARCHAR(20) NOT NULL,  -- Date as text (e.g., "6/10/2025")
    hour VARCHAR(20) NOT NULL,  -- Time as text (e.g., "10:44 PM")
    typology_id INTEGER NOT NULL REFERENCES typology_master(typology_id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- FACT TABLES (Tablas de Hechos)
-- ============================================================================

-- A/B Test Results (Resultados detallados)
CREATE TABLE ab_test_result (
    id SERIAL PRIMARY KEY,
    store_id INTEGER NOT NULL REFERENCES store_master(id),
    category_id INTEGER NOT NULL REFERENCES category_master(category_id),
    unit_id INTEGER NOT NULL REFERENCES measurement_unit_master(unit_id),
    source_id INTEGER NOT NULL REFERENCES data_source_master(source_id),
    period_id INTEGER NOT NULL REFERENCES period_master(period_id),
    value DECIMAL(15, 4),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_test_result UNIQUE (store_id, category_id, unit_id, source_id, period_id)
);

-- A/B Test Summary (Resúmenes agregados)
CREATE TABLE ab_test_summary (
    id SERIAL PRIMARY KEY,
    typology_id INTEGER NOT NULL REFERENCES typology_master(typology_id),
    lever_id INTEGER NOT NULL REFERENCES lever_master(lever_id),
    category_id INTEGER NOT NULL REFERENCES category_master(category_id),
    unit_id INTEGER NOT NULL REFERENCES measurement_unit_master(unit_id),
    source_id INTEGER NOT NULL REFERENCES data_source_master(source_id),
    average_variation DECIMAL(10, 4),
    difference_vs_control DECIMAL(10, 4),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_test_summary UNIQUE (typology_id, lever_id, category_id, unit_id, source_id)
);

-- ============================================================================
-- SIMULATION TABLES (ML Model Results)
-- ============================================================================

-- CAPEX & Fee Master (Costos por tipología y palanca)
CREATE TABLE capex_fee (
    id SERIAL PRIMARY KEY,
    typology_id INTEGER NOT NULL REFERENCES typology_master(typology_id),
    lever_id INTEGER NOT NULL REFERENCES lever_master(lever_id),
    capex DECIMAL(15, 6) NOT NULL,  -- CAPEX cost
    fee DECIMAL(15, 6) NOT NULL,    -- Fee cost
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_capex_fee UNIQUE (typology_id, lever_id)
);

-- Simulation Summary (Resúmenes estadísticos por combinación de palancas)
CREATE TABLE simulation_summary (
    id SERIAL PRIMARY KEY,
    "tipo_combinación" VARCHAR(50) NOT NULL,  -- 'simple' or 'combinación'
    typology_id INTEGER NOT NULL REFERENCES typology_master(typology_id),
    unit_id INTEGER NOT NULL REFERENCES measurement_unit_master(unit_id),

    -- Statistical measures
    media DECIMAL(10, 6),           -- Mean uplift
    mediana DECIMAL(10, 6),         -- Median uplift
    p25 DECIMAL(10, 6),             -- 25th percentile
    p75 DECIMAL(10, 6),             -- 75th percentile

    -- Palancas (binary flags: 0 or 1)
    exhibicion_adicional_mamut SMALLINT DEFAULT 0,
    nevera_en_punto_de_pago SMALLINT DEFAULT 0,
    entrepano_con_comunicacion SMALLINT DEFAULT 0,
    cajero_vendedor SMALLINT DEFAULT 0,
    tienda_multipalanca SMALLINT DEFAULT 0,
    punta_de_gondola SMALLINT DEFAULT 0,
    mini_vallas_en_fachada SMALLINT DEFAULT 0,
    metro_cuadrado SMALLINT DEFAULT 0,
    rompe_trafico_cross_category SMALLINT DEFAULT 0,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_palanca_values CHECK (
        exhibicion_adicional_mamut IN (0, 1) AND
        nevera_en_punto_de_pago IN (0, 1) AND
        entrepano_con_comunicacion IN (0, 1) AND
        cajero_vendedor IN (0, 1) AND
        tienda_multipalanca IN (0, 1) AND
        punta_de_gondola IN (0, 1) AND
        mini_vallas_en_fachada IN (0, 1) AND
        metro_cuadrado IN (0, 1) AND
        rompe_trafico_cross_category IN (0, 1)
    )
);

-- Simulation Results (Resultados completos de simulaciones OLS - 1M+ rows)
CREATE TABLE simulation_result (
    id SERIAL PRIMARY KEY,
    typology_id INTEGER NOT NULL REFERENCES typology_master(typology_id),
    unit_id INTEGER NOT NULL REFERENCES measurement_unit_master(unit_id),

    -- Initial conditions
    vol_inicial INTEGER NOT NULL,  -- Initial volume

    -- Execution checks (binary: 0 or 1)
    "planograma_ejecución_check" SMALLINT DEFAULT 0,
    precios_check SMALLINT DEFAULT 0,
    carga_check SMALLINT DEFAULT 0,

    -- Feature counts (own vs competition)
    q_frentes INTEGER DEFAULT 0,               -- Shelf facings (own)
    q_frentes_competencia INTEGER DEFAULT 0,   -- Shelf facings (competition)
    q_sku INTEGER DEFAULT 0,                   -- SKU count (own)
    q_sku_competencia INTEGER DEFAULT 0,       -- SKU count (competition)
    q_edf_ad DECIMAL(10, 2) DEFAULT 0,         -- Additional cooling equipment (own)
    q_edf_ad_competencia DECIMAL(10, 2) DEFAULT 0,  -- Additional cooling equipment (competition)
    q_cof_puertas INTEGER DEFAULT 0,           -- Cooler doors (own)
    q_cof_puertas_competencia INTEGER DEFAULT 0,    -- Cooler doors (competition)

    -- OLS Model predictions
    prediction DECIMAL(15, 6),          -- Predicted value with palanca
    control_prediction DECIMAL(15, 6),  -- Predicted value for control
    uplift DECIMAL(10, 6),              -- Uplift percentage (difference)

    -- Palancas (binary flags: 0 or 1)
    exhibicion_adicional_mamut SMALLINT DEFAULT 0,
    nevera_en_punto_de_pago SMALLINT DEFAULT 0,
    entrepano_con_comunicacion SMALLINT DEFAULT 0,
    cajero_vendedor SMALLINT DEFAULT 0,
    tienda_multipalanca SMALLINT DEFAULT 0,
    punta_de_gondola SMALLINT DEFAULT 0,
    mini_vallas_en_fachada SMALLINT DEFAULT 0,
    metro_cuadrado SMALLINT DEFAULT 0,
    rompe_trafico_cross_category SMALLINT DEFAULT 0,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_sim_palanca_values CHECK (
        "planograma_ejecución_check" IN (0, 1) AND
        precios_check IN (0, 1) AND
        carga_check IN (0, 1) AND
        exhibicion_adicional_mamut IN (0, 1) AND
        nevera_en_punto_de_pago IN (0, 1) AND
        entrepano_con_comunicacion IN (0, 1) AND
        cajero_vendedor IN (0, 1) AND
        tienda_multipalanca IN (0, 1) AND
        punta_de_gondola IN (0, 1) AND
        mini_vallas_en_fachada IN (0, 1) AND
        metro_cuadrado IN (0, 1) AND
        rompe_trafico_cross_category IN (0, 1)
    )
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Indexes on ab_test_result
CREATE INDEX idx_ab_test_result_store ON ab_test_result(store_id);
CREATE INDEX idx_ab_test_result_category ON ab_test_result(category_id);
CREATE INDEX idx_ab_test_result_period ON ab_test_result(period_id);
CREATE INDEX idx_ab_test_result_source ON ab_test_result(source_id);
CREATE INDEX idx_ab_test_result_composite ON ab_test_result(store_id, category_id, period_id);

-- Indexes on ab_test_summary
CREATE INDEX idx_ab_test_summary_typology ON ab_test_summary(typology_id);
CREATE INDEX idx_ab_test_summary_lever ON ab_test_summary(lever_id);
CREATE INDEX idx_ab_test_summary_category ON ab_test_summary(category_id);
CREATE INDEX idx_ab_test_summary_composite ON ab_test_summary(typology_id, lever_id, category_id);

-- Indexes on store_master
CREATE INDEX idx_store_city ON store_master(city_id);
CREATE INDEX idx_store_typology ON store_master(typology_id);
CREATE INDEX idx_store_lever ON store_master(lever_id);
CREATE INDEX idx_store_active ON store_master(is_active) WHERE is_active = TRUE;

-- Indexes on audit_master
CREATE INDEX idx_audit_cod_pdv ON audit_master(cod_pdv);
CREATE INDEX idx_audit_week ON audit_master(week);
CREATE INDEX idx_audit_typology ON audit_master(typology_id);

-- Indexes on period_master
CREATE INDEX idx_period_dates ON period_master(start_date, end_date);
CREATE INDEX idx_period_type ON period_master(period_type);

-- Indexes on capex_fee
CREATE INDEX idx_capex_fee_typology ON capex_fee(typology_id);
CREATE INDEX idx_capex_fee_lever ON capex_fee(lever_id);

-- Indexes on simulation_summary
CREATE INDEX idx_simulation_summary_typology ON simulation_summary(typology_id);
CREATE INDEX idx_simulation_summary_unit ON simulation_summary(unit_id);
CREATE INDEX idx_simulation_summary_tipo ON simulation_summary("tipo_combinación");

-- Indexes on simulation_result (critical for 1M+ rows)
CREATE INDEX idx_simulation_result_typology ON simulation_result(typology_id);
CREATE INDEX idx_simulation_result_unit ON simulation_result(unit_id);
CREATE INDEX idx_simulation_result_vol ON simulation_result(vol_inicial);
CREATE INDEX idx_simulation_result_uplift ON simulation_result(uplift);
CREATE INDEX idx_simulation_result_composite ON simulation_result(typology_id, unit_id, vol_inicial);

-- ============================================================================
-- VIEWS FOR CHATBOT (Simplified queries for text-to-SQL)
-- ============================================================================

-- Vista completa para análisis del chatbot
CREATE OR REPLACE VIEW v_chatbot_complete AS
SELECT
    r.id AS result_id,
    s.store_name,
    s.store_code_sellin,
    s.store_code_sellout,
    c.city_name,
    t.typology_name,
    l.lever_name,
    cat.category_name,
    u.unit_name,
    ds.source_name,
    p.period_label,
    p.period_type,
    p.start_date,
    p.end_date,
    r.value,
    r.created_at
FROM ab_test_result r
JOIN store_master s ON r.store_id = s.id
JOIN city_master c ON s.city_id = c.city_id
JOIN typology_master t ON s.typology_id = t.typology_id
JOIN lever_master l ON s.lever_id = l.lever_id
JOIN category_master cat ON r.category_id = cat.category_id
JOIN measurement_unit_master u ON r.unit_id = u.unit_id
JOIN data_source_master ds ON r.source_id = ds.source_id
JOIN period_master p ON r.period_id = p.period_id
WHERE s.is_active = TRUE;

-- Vista de resúmenes para dashboard
CREATE OR REPLACE VIEW v_dashboard_summary AS
SELECT
    t.typology_name,
    l.lever_name,
    cat.category_name,
    u.unit_name,
    ds.source_name,
    s.average_variation,
    s.difference_vs_control
FROM ab_test_summary s
JOIN typology_master t ON s.typology_id = t.typology_id
JOIN lever_master l ON s.lever_id = l.lever_id
JOIN category_master cat ON s.category_id = cat.category_id
JOIN measurement_unit_master u ON s.unit_id = u.unit_id
JOIN data_source_master ds ON s.source_id = ds.source_id;

-- Vista de evolución temporal
CREATE OR REPLACE VIEW v_evolution_timeline AS
SELECT
    p.period_label,
    p.start_date,
    p.end_date,
    t.typology_name,
    l.lever_name,
    cat.category_name,
    u.unit_name,
    AVG(r.value) as avg_value,
    COUNT(*) as store_count
FROM ab_test_result r
JOIN store_master s ON r.store_id = s.id
JOIN typology_master t ON s.typology_id = t.typology_id
JOIN lever_master l ON s.lever_id = l.lever_id
JOIN category_master cat ON r.category_id = cat.category_id
JOIN measurement_unit_master u ON r.unit_id = u.unit_id
JOIN period_master p ON r.period_id = p.period_id
WHERE s.is_active = TRUE
GROUP BY p.period_label, p.start_date, p.end_date, t.typology_name, l.lever_name, cat.category_name, u.unit_name
ORDER BY p.start_date;

-- ============================================================================
-- FUNCTIONS FOR UPDATED_AT TRIGGERS
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers to all tables with updated_at
CREATE TRIGGER update_city_master_updated_at BEFORE UPDATE ON city_master FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_typology_master_updated_at BEFORE UPDATE ON typology_master FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_lever_master_updated_at BEFORE UPDATE ON lever_master FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_category_master_updated_at BEFORE UPDATE ON category_master FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_measurement_unit_master_updated_at BEFORE UPDATE ON measurement_unit_master FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_data_source_master_updated_at BEFORE UPDATE ON data_source_master FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_period_master_updated_at BEFORE UPDATE ON period_master FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_store_master_updated_at BEFORE UPDATE ON store_master FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_audit_master_updated_at BEFORE UPDATE ON audit_master FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_ab_test_result_updated_at BEFORE UPDATE ON ab_test_result FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_ab_test_summary_updated_at BEFORE UPDATE ON ab_test_summary FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_capex_fee_updated_at BEFORE UPDATE ON capex_fee FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_simulation_summary_updated_at BEFORE UPDATE ON simulation_summary FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- COMMENTS (Documentation)
-- ============================================================================

COMMENT ON TABLE city_master IS 'Maestro de ciudades';
COMMENT ON TABLE typology_master IS 'Maestro de tipologías de tiendas (Super & Hyper, Convenience, etc.)';
COMMENT ON TABLE lever_master IS 'Maestro de palancas de A/B testing';
COMMENT ON TABLE category_master IS 'Maestro de categorías de productos';
COMMENT ON TABLE measurement_unit_master IS 'Maestro de unidades de medida';
COMMENT ON TABLE data_source_master IS 'Maestro de fuentes de datos (Sell In, Sell Out)';
COMMENT ON TABLE period_master IS 'Maestro de períodos temporales';
COMMENT ON TABLE store_master IS 'Maestro de tiendas (PDVs) con códigos sell-in/sell-out';
COMMENT ON TABLE audit_master IS 'Registro de auditorías de tiendas por semana con fecha y hora';
COMMENT ON TABLE ab_test_result IS 'Resultados detallados de pruebas A/B por tienda y período';
COMMENT ON TABLE ab_test_summary IS 'Resúmenes agregados de pruebas A/B por tipología y palanca';
COMMENT ON TABLE capex_fee IS 'Costos CAPEX y Fee por tipología y palanca para cálculos de ROI';
COMMENT ON TABLE simulation_summary IS 'Resúmenes estadísticos de simulaciones OLS por combinación de palancas';
COMMENT ON TABLE simulation_result IS 'Resultados completos de simulaciones del modelo OLS (1M+ rows) con uplifts predichos';

COMMENT ON VIEW v_chatbot_complete IS 'Vista completa para consultas del chatbot con todos los joins resueltos';
COMMENT ON VIEW v_dashboard_summary IS 'Vista de resúmenes para el dashboard';
COMMENT ON VIEW v_evolution_timeline IS 'Vista de evolución temporal para gráficos de línea';
