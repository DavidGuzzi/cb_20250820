"""
Simulation API Routes
Endpoints for Simulaciones Personalizada calculator
"""

from flask import Blueprint, request, jsonify
import logging
from app.services.unified_database_service import unified_db

logger = logging.getLogger('chatbot_app.simulation')

# Create Blueprint
simulation_bp = Blueprint('simulation', __name__)


@simulation_bp.route('/calculate', methods=['POST'])
def calculate_simulation():
    """
    POST /api/simulation/calculate
    Calculate simulation results using OLS model

    Request body:
    {
        "tipologia": "Super e hiper",
        "palancas": ["Punta de góndola", "Metro cuadrado"],
        "tamanoTienda": "Mediano",
        "features": {
            "frentesPropios": 4,
            "frentesCompetencia": 6,
            "skuPropios": 12,
            "skuCompetencia": 18,
            "equiposFrioPropios": 1,
            "equiposFrioCompetencia": 2,
            "puertasPropias": 2,
            "puertasCompetencia": 3
        },
        "maco": 35,
        "exchangeRate": 3912
    }

    Response:
    {
        "success": true,
        "uplift": 15.3,
        "roi": 2.45,
        "payback": 8.2,
        "capex_breakdown": [...],
        "total_capex_cop": 195600000,
        "total_fee_cop": 3912000,
        ...
    }
    """
    try:
        data = request.get_json()

        # Validate required fields
        required_fields = ['tipologia', 'palancas', 'tamanoTienda', 'features', 'maco', 'exchangeRate']
        missing_fields = [field for field in required_fields if field not in data]

        if missing_fields:
            return jsonify({
                'success': False,
                'error': f'Campos requeridos faltantes: {", ".join(missing_fields)}'
            }), 400

        # Extract parameters
        tipologia = data['tipologia']
        palancas = data['palancas']
        tamano_tienda = data['tamanoTienda']
        features = data['features']
        maco = float(data['maco'])
        exchange_rate = float(data['exchangeRate'])

        # Validate palancas is non-empty list
        if not isinstance(palancas, list) or len(palancas) == 0:
            return jsonify({
                'success': False,
                'error': 'Debes seleccionar al menos una palanca'
            }), 400

        # Call database service to calculate simulation
        result = unified_db.calculate_simulation(
            tipologia=tipologia,
            palancas=palancas,
            tamano_tienda=tamano_tienda,
            features=features,
            maco=maco,
            exchange_rate=exchange_rate
        )

        if not result['success']:
            return jsonify(result), 400

        logger.info(f"✅ Simulation calculated: {tipologia}, palancas={palancas}, uplift={result['uplift']}%")

        return jsonify(result), 200

    except Exception as e:
        logger.error(f"❌ Error in calculate_simulation endpoint: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@simulation_bp.route('/ols-params', methods=['GET'])
def get_ols_params():
    """
    GET /api/simulation/ols-params?tipologia=Super%20e%20hiper
    Get OLS model parameters for a specific tipologia
    """
    try:
        tipologia = request.args.get('tipologia')

        if not tipologia:
            return jsonify({
                'success': False,
                'error': 'Parámetro tipologia es requerido'
            }), 400

        result = unified_db.get_ols_params(tipologia)

        if not result['success']:
            return jsonify(result), 404

        return jsonify(result), 200

    except Exception as e:
        logger.error(f"❌ Error in get_ols_params endpoint: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@simulation_bp.route('/capex-fee', methods=['GET'])
def get_capex_fee():
    """
    GET /api/simulation/capex-fee?tipologia=Super%20e%20hiper&palancas=Punta%20de%20góndola,Metro%20cuadrado
    Get CAPEX and Fee breakdown for selected palancas
    """
    try:
        tipologia = request.args.get('tipologia')
        palancas_str = request.args.get('palancas', '')

        if not tipologia:
            return jsonify({
                'success': False,
                'error': 'Parámetro tipologia es requerido'
            }), 400

        if not palancas_str:
            return jsonify({
                'success': False,
                'error': 'Parámetro palancas es requerido'
            }), 400

        # Parse comma-separated palancas
        palancas = [p.strip() for p in palancas_str.split(',') if p.strip()]

        result = unified_db.get_capex_fee_by_palancas(tipologia, palancas)

        if not result['success']:
            return jsonify(result), 404

        return jsonify(result), 200

    except Exception as e:
        logger.error(f"❌ Error in get_capex_fee endpoint: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500
