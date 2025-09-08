# Sistema de Autenticación y Gestión de Usuarios - Propuestas

## 📋 Análisis del Estado Actual

### **Sistema Actual (Demo)**
```typescript
// frontend/src/components/Login.tsx - líneas 17-21
const demoCredentials = [
  { email: 'admin@gatorade.com', password: 'gatorade2024', role: 'Admin' },
  { email: 'marketing@gatorade.com', password: 'marketing123', role: 'Marketing' },
  { email: 'analista@gatorade.com', password: 'testing456', role: 'Analista' }
];
```

**Características actuales:**
- ❌ **Hardcoded credentials** en frontend
- ❌ **Sin base de datos** de usuarios
- ❌ **Sin encriptación** de contraseñas
- ❌ **Sin gestión de sesiones** real
- ❌ **Sin roles funcionales**
- ❌ **Sin políticas de contraseña**
- ✅ **UI completa** ya implementada

---

## 🔒 Alternativas de Implementación

## **OPCIÓN 1: Sistema Interno con Base de Datos** ⭐⭐⭐⭐⭐

### **Arquitectura**
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │ →  │   Backend API   │ →  │   Database      │
│  (Auth UI)      │    │  (JWT + bcrypt) │    │ (users, roles)  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### **Schema de Base de Datos**
```sql
-- Tabla de usuarios
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    full_name TEXT NOT NULL,
    role_id INTEGER NOT NULL,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending', 'locked')),
    must_change_password BOOLEAN DEFAULT FALSE,
    password_expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login_at TIMESTAMP,
    failed_login_attempts INTEGER DEFAULT 0,
    locked_until TIMESTAMP,
    created_by_user_id INTEGER,
    FOREIGN KEY (role_id) REFERENCES roles(id),
    FOREIGN KEY (created_by_user_id) REFERENCES users(id)
);

-- Tabla de roles
CREATE TABLE roles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,
    description TEXT,
    permissions JSON NOT NULL, -- Permisos como JSON array
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de sesiones (opcional - para logout remoto)
CREATE TABLE user_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    token_hash TEXT NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ip_address TEXT,
    user_agent TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Tabla de logs de autenticación
CREATE TABLE auth_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    email TEXT NOT NULL,
    action TEXT NOT NULL, -- 'login_success', 'login_failed', 'logout', 'password_change'
    ip_address TEXT,
    user_agent TEXT,
    details JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);
```

### **Datos de Ejemplo**
```sql
-- Insertar roles
INSERT INTO roles (id, name, description, permissions) VALUES 
(1, 'Super Admin', 'Acceso completo al sistema', '["all"]'),
(2, 'Admin', 'Gestión de usuarios y datos', '["user_management", "data_access", "reports", "dashboard"]'),
(3, 'Marketing', 'Acceso a reportes y dashboard', '["data_access", "reports", "dashboard"]'),
(4, 'Analista', 'Acceso solo al chatbot y reportes básicos', '["chatbot", "basic_reports"]'),
(5, 'Viewer', 'Solo visualización', '["dashboard_view"]');

-- Insertar usuarios de ejemplo
INSERT INTO users (email, password_hash, full_name, role_id, status, must_change_password) VALUES 
('admin@gatorade.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LeVMstdMW6L4NrHDe', 'Administrador Sistema', 1, 'active', FALSE),
('marketing@gatorade.com', '$2b$12$temp_hash_here', 'Equipo Marketing', 3, 'active', TRUE), -- Debe cambiar password
('analista@gatorade.com', '$2b$12$temp_hash_here', 'Analista Datos', 4, 'pending', TRUE), -- Cuenta nueva
('viewer@gatorade.com', '$2b$12$temp_hash_here', 'Usuario Visualizacion', 5, 'inactive', FALSE); -- Cuenta desactivada
```

### **Backend Implementation**

#### **Servicio de Autenticación**
```python
# backend/app/services/auth_service.py
import bcrypt
import jwt
import secrets
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from app.services.database_service import unified_db

class AuthService:
    def __init__(self):
        self.jwt_secret = os.getenv('JWT_SECRET', secrets.token_urlsafe(32))
        self.jwt_algorithm = 'HS256'
        self.jwt_expiry_hours = 8
        self.max_failed_attempts = 5
        self.lockout_duration_minutes = 30

    def hash_password(self, password: str) -> str:
        """Genera hash seguro de contraseña"""
        salt = bcrypt.gensalt()
        return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')

    def verify_password(self, password: str, password_hash: str) -> bool:
        """Verifica contraseña contra hash"""
        return bcrypt.checkpw(password.encode('utf-8'), password_hash.encode('utf-8'))

    def authenticate_user(self, email: str, password: str, ip_address: str = None) -> Dict[str, Any]:
        """Autentica usuario y retorna token JWT"""
        with unified_db.get_connection() as conn:
            # Buscar usuario
            user = conn.execute("""
                SELECT u.*, r.name as role_name, r.permissions
                FROM users u 
                JOIN roles r ON u.role_id = r.id 
                WHERE u.email = ? AND u.status != 'inactive'
            """, [email]).fetchone()

            # Usuario no encontrado
            if not user:
                self._log_auth_attempt(None, email, 'login_failed', ip_address, 'User not found')
                return {'success': False, 'error': 'Credenciales inválidas'}

            user_dict = dict(user)

            # Verificar si cuenta está bloqueada
            if user_dict['locked_until'] and datetime.fromisoformat(user_dict['locked_until']) > datetime.now():
                return {'success': False, 'error': 'Cuenta temporalmente bloqueada'}

            # Verificar contraseña
            if not self.verify_password(password, user_dict['password_hash']):
                self._handle_failed_login(user_dict['id'], email, ip_address)
                return {'success': False, 'error': 'Credenciales inválidas'}

            # Reset failed attempts on successful login
            conn.execute("UPDATE users SET failed_login_attempts = 0, locked_until = NULL WHERE id = ?", [user_dict['id']])

            # Verificar si debe cambiar contraseña
            must_change = user_dict['must_change_password']
            password_expired = False
            if user_dict['password_expires_at']:
                password_expired = datetime.fromisoformat(user_dict['password_expires_at']) < datetime.now()

            if must_change or password_expired:
                # Generar token temporal para cambio de contraseña
                temp_token = self._generate_temp_token(user_dict['id'])
                return {
                    'success': True,
                    'requires_password_change': True,
                    'temp_token': temp_token,
                    'user': {
                        'id': user_dict['id'],
                        'email': user_dict['email'],
                        'full_name': user_dict['full_name']
                    }
                }

            # Generar JWT token
            token = self._generate_jwt_token(user_dict)
            
            # Actualizar último login
            conn.execute("UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE id = ?", [user_dict['id']])
            
            # Log successful login
            self._log_auth_attempt(user_dict['id'], email, 'login_success', ip_address)

            return {
                'success': True,
                'token': token,
                'user': {
                    'id': user_dict['id'],
                    'email': user_dict['email'],
                    'full_name': user_dict['full_name'],
                    'role': user_dict['role_name'],
                    'permissions': json.loads(user_dict['permissions'])
                }
            }

    def _handle_failed_login(self, user_id: int, email: str, ip_address: str):
        """Maneja intentos fallidos de login"""
        with unified_db.get_connection() as conn:
            # Incrementar intentos fallidos
            conn.execute("""
                UPDATE users 
                SET failed_login_attempts = failed_login_attempts + 1 
                WHERE id = ?
            """, [user_id])

            # Verificar si debe bloquear cuenta
            attempts = conn.execute("SELECT failed_login_attempts FROM users WHERE id = ?", [user_id]).fetchone()
            if attempts and attempts[0] >= self.max_failed_attempts:
                locked_until = datetime.now() + timedelta(minutes=self.lockout_duration_minutes)
                conn.execute("UPDATE users SET locked_until = ? WHERE id = ?", [locked_until.isoformat(), user_id])

            self._log_auth_attempt(user_id, email, 'login_failed', ip_address)

    def change_password(self, user_id: int, old_password: str, new_password: str) -> Dict[str, Any]:
        """Cambia contraseña de usuario"""
        # Validar política de contraseñas
        validation_result = self._validate_password_policy(new_password)
        if not validation_result['valid']:
            return {'success': False, 'error': validation_result['message']}

        with unified_db.get_connection() as conn:
            user = conn.execute("SELECT password_hash FROM users WHERE id = ?", [user_id]).fetchone()
            
            if not user or not self.verify_password(old_password, user[0]):
                return {'success': False, 'error': 'Contraseña actual incorrecta'}

            # Hash nueva contraseña
            new_hash = self.hash_password(new_password)
            
            # Actualizar contraseña
            password_expires = datetime.now() + timedelta(days=90)  # 90 días de validez
            conn.execute("""
                UPDATE users 
                SET password_hash = ?, 
                    must_change_password = FALSE,
                    password_expires_at = ?,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            """, [new_hash, password_expires.isoformat(), user_id])

            self._log_auth_attempt(user_id, None, 'password_change', None)

            return {'success': True, 'message': 'Contraseña actualizada correctamente'}

    def _validate_password_policy(self, password: str) -> Dict[str, Any]:
        """Valida política de contraseñas"""
        if len(password) < 8:
            return {'valid': False, 'message': 'La contraseña debe tener al menos 8 caracteres'}
        
        if not any(c.isupper() for c in password):
            return {'valid': False, 'message': 'La contraseña debe contener al menos una mayúscula'}
        
        if not any(c.islower() for c in password):
            return {'valid': False, 'message': 'La contraseña debe contener al menos una minúscula'}
        
        if not any(c.isdigit() for c in password):
            return {'valid': False, 'message': 'La contraseña debe contener al menos un número'}

        return {'valid': True}

    def _generate_jwt_token(self, user: Dict) -> str:
        """Genera token JWT"""
        payload = {
            'user_id': user['id'],
            'email': user['email'],
            'role': user['role_name'],
            'permissions': json.loads(user['permissions']),
            'exp': datetime.utcnow() + timedelta(hours=self.jwt_expiry_hours),
            'iat': datetime.utcnow()
        }
        return jwt.encode(payload, self.jwt_secret, algorithm=self.jwt_algorithm)

    def verify_token(self, token: str) -> Dict[str, Any]:
        """Verifica y decodifica token JWT"""
        try:
            payload = jwt.decode(token, self.jwt_secret, algorithms=[self.jwt_algorithm])
            return {'success': True, 'payload': payload}
        except jwt.ExpiredSignatureError:
            return {'success': False, 'error': 'Token expirado'}
        except jwt.InvalidTokenError:
            return {'success': False, 'error': 'Token inválido'}

# Instancia global
auth_service = AuthService()
```

#### **Endpoints de Autenticación**
```python
# backend/app/routes/auth.py
from flask import Blueprint, request, jsonify
from app.services.auth_service import auth_service
from app.decorators.auth import require_auth, require_permission

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/api/auth/login', methods=['POST'])
def login():
    """Endpoint de login"""
    try:
        data = request.get_json()
        email = data.get('email', '').strip().lower()
        password = data.get('password', '')
        
        if not email or not password:
            return jsonify({'success': False, 'error': 'Email y contraseña requeridos'}), 400

        ip_address = request.environ.get('HTTP_X_REAL_IP', request.remote_addr)
        result = auth_service.authenticate_user(email, password, ip_address)
        
        if result['success']:
            status_code = 200 if not result.get('requires_password_change') else 202
            return jsonify(result), status_code
        else:
            return jsonify(result), 401

    except Exception as e:
        return jsonify({'success': False, 'error': 'Error interno del servidor'}), 500

@auth_bp.route('/api/auth/change-password', methods=['POST'])
@require_auth
def change_password():
    """Endpoint para cambio de contraseña"""
    try:
        data = request.get_json()
        old_password = data.get('old_password', '')
        new_password = data.get('new_password', '')
        
        if not old_password or not new_password:
            return jsonify({'success': False, 'error': 'Contraseñas requeridas'}), 400

        user_id = request.user['user_id']  # Del decorator @require_auth
        result = auth_service.change_password(user_id, old_password, new_password)
        
        status_code = 200 if result['success'] else 400
        return jsonify(result), status_code

    except Exception as e:
        return jsonify({'success': False, 'error': 'Error interno del servidor'}), 500

@auth_bp.route('/api/auth/profile', methods=['GET'])
@require_auth
def get_profile():
    """Obtiene perfil del usuario actual"""
    return jsonify({
        'success': True,
        'user': request.user
    })

@auth_bp.route('/api/auth/logout', methods=['POST'])
@require_auth
def logout():
    """Logout del usuario"""
    # Aquí podrías invalidar el token si usas blacklist
    return jsonify({'success': True, 'message': 'Logout exitoso'})
```

#### **Decorador de Autenticación**
```python
# backend/app/decorators/auth.py
from functools import wraps
from flask import request, jsonify, g
from app.services.auth_service import auth_service

def require_auth(f):
    """Decorador que requiere autenticación JWT"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        token = None
        auth_header = request.headers.get('Authorization')
        
        if auth_header:
            try:
                # Formato: "Bearer <token>"
                token = auth_header.split(" ")[1]
            except IndexError:
                return jsonify({'success': False, 'error': 'Token malformado'}), 401

        if not token:
            return jsonify({'success': False, 'error': 'Token requerido'}), 401

        result = auth_service.verify_token(token)
        if not result['success']:
            return jsonify({'success': False, 'error': result['error']}), 401

        # Agregar usuario al request
        request.user = result['payload']
        g.user_id = result['payload']['user_id']
        
        return f(*args, **kwargs)
    return decorated_function

def require_permission(permission):
    """Decorador que requiere permiso específico"""
    def decorator(f):
        @wraps(f)
        @require_auth
        def decorated_function(*args, **kwargs):
            user_permissions = request.user.get('permissions', [])
            
            if 'all' not in user_permissions and permission not in user_permissions:
                return jsonify({'success': False, 'error': 'Permisos insuficientes'}), 403
                
            return f(*args, **kwargs)
        return decorated_function
    return decorator
```

### **Frontend Updates**

#### **Servicio de Autenticación**
```typescript
// frontend/src/services/authService.ts
interface LoginResponse {
  success: boolean;
  token?: string;
  requires_password_change?: boolean;
  temp_token?: string;
  user?: {
    id: number;
    email: string;
    full_name: string;
    role: string;
    permissions: string[];
  };
  error?: string;
}

interface ChangePasswordRequest {
  old_password: string;
  new_password: string;
}

class AuthService {
  private baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  
  async login(email: string, password: string): Promise<LoginResponse> {
    const response = await fetch(`${this.baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    
    return response.json();
  }

  async changePassword(oldPassword: string, newPassword: string): Promise<any> {
    const token = this.getToken();
    const response = await fetch(`${this.baseUrl}/api/auth/change-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ old_password: oldPassword, new_password: newPassword })
    });
    
    return response.json();
  }

  getToken(): string | null {
    return localStorage.getItem('auth_token');
  }

  setToken(token: string): void {
    localStorage.setItem('auth_token', token);
  }

  getUser(): any | null {
    const userStr = localStorage.getItem('auth_user');
    return userStr ? JSON.parse(userStr) : null;
  }

  setUser(user: any): void {
    localStorage.setItem('auth_user', JSON.stringify(user));
  }

  logout(): void {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
  }

  isAuthenticated(): boolean {
    const token = this.getToken();
    if (!token) return false;
    
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp > Date.now() / 1000;
    } catch {
      return false;
    }
  }

  hasPermission(permission: string): boolean {
    const user = this.getUser();
    if (!user || !user.permissions) return false;
    
    return user.permissions.includes('all') || user.permissions.includes(permission);
  }
}

export const authService = new AuthService();
```

#### **Componente de Cambio de Contraseña**
```typescript
// frontend/src/components/ChangePasswordForm.tsx
import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Eye, EyeOff, Lock, AlertTriangle } from 'lucide-react';
import { authService } from '../services/authService';

interface ChangePasswordFormProps {
  onSuccess: () => void;
  isFirstLogin?: boolean;
}

export function ChangePasswordForm({ onSuccess, isFirstLogin = false }: ChangePasswordFormProps) {
  const [showPasswords, setShowPasswords] = useState({ old: false, new: false, confirm: false });
  const [formData, setFormData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const validatePassword = (password: string): string[] => {
    const errors: string[] = [];
    
    if (password.length < 8) {
      errors.push('Debe tener al menos 8 caracteres');
    }
    if (!/[A-Z]/.test(password)) {
      errors.push('Debe contener al menos una mayúscula');
    }
    if (!/[a-z]/.test(password)) {
      errors.push('Debe contener al menos una minúscula');
    }
    if (!/\d/.test(password)) {
      errors.push('Debe contener al menos un número');
    }
    
    return errors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors([]);
    setIsLoading(true);

    // Validaciones
    const validationErrors: string[] = [];
    
    if (!formData.oldPassword && !isFirstLogin) {
      validationErrors.push('La contraseña actual es requerida');
    }
    
    if (!formData.newPassword) {
      validationErrors.push('La nueva contraseña es requerida');
    }
    
    if (formData.newPassword !== formData.confirmPassword) {
      validationErrors.push('Las contraseñas no coinciden');
    }

    const passwordErrors = validatePassword(formData.newPassword);
    validationErrors.push(...passwordErrors);

    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      setIsLoading(false);
      return;
    }

    try {
      const result = await authService.changePassword(formData.oldPassword, formData.newPassword);
      
      if (result.success) {
        onSuccess();
      } else {
        setErrors([result.error || 'Error al cambiar contraseña']);
      }
    } catch (error) {
      setErrors(['Error de conexión. Intenta nuevamente.']);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lock className="w-5 h-5" />
          {isFirstLogin ? 'Configurar Contraseña' : 'Cambiar Contraseña'}
        </CardTitle>
        {isFirstLogin && (
          <div className="flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded">
            <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-yellow-800">
              Debes configurar una nueva contraseña antes de continuar.
            </p>
          </div>
        )}
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {!isFirstLogin && (
            <div className="space-y-2">
              <Label htmlFor="oldPassword">Contraseña Actual</Label>
              <div className="relative">
                <Input
                  id="oldPassword"
                  type={showPasswords.old ? 'text' : 'password'}
                  value={formData.oldPassword}
                  onChange={(e) => setFormData(prev => ({ ...prev, oldPassword: e.target.value }))}
                  className="pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPasswords(prev => ({ ...prev, old: !prev.old }))}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2"
                >
                  {showPasswords.old ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="newPassword">Nueva Contraseña</Label>
            <div className="relative">
              <Input
                id="newPassword"
                type={showPasswords.new ? 'text' : 'password'}
                value={formData.newPassword}
                onChange={(e) => setFormData(prev => ({ ...prev, newPassword: e.target.value }))}
                className="pr-10"
                required
              />
              <button
                type="button"
                onClick={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
                className="absolute right-3 top-1/2 transform -translate-y-1/2"
              >
                {showPasswords.new ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirmar Nueva Contraseña</Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showPasswords.confirm ? 'text' : 'password'}
                value={formData.confirmPassword}
                onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                className="pr-10"
                required
              />
              <button
                type="button"
                onClick={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
                className="absolute right-3 top-1/2 transform -translate-y-1/2"
              >
                {showPasswords.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {errors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded p-3">
              <div className="text-sm text-red-800">
                <p className="font-medium mb-1">Errores:</p>
                <ul className="list-disc list-inside space-y-1">
                  {errors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          <div className="bg-blue-50 border border-blue-200 rounded p-3">
            <p className="text-sm text-blue-800 font-medium mb-1">Requisitos de contraseña:</p>
            <ul className="text-xs text-blue-700 space-y-1">
              <li>• Mínimo 8 caracteres</li>
              <li>• Al menos una mayúscula</li>
              <li>• Al menos una minúscula</li>
              <li>• Al menos un número</li>
            </ul>
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? 'Cambiando...' : 'Cambiar Contraseña'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
```

### **Funcionalidades Implementadas**

#### **✅ Gestión Completa de Usuarios**
- Roles granulares con permisos específicos
- Estados de cuenta (activa, inactiva, pendiente, bloqueada)
- Contraseñas con hash bcrypt
- Políticas de contraseña configurables
- Expiración automática de contraseñas

#### **✅ Seguridad Robusta**
- JWT tokens con expiración
- Rate limiting por intentos fallidos
- Bloqueo temporal de cuentas
- Logs de auditoría completos
- Validación de entrada exhaustiva

#### **✅ Experiencia de Usuario**
- Cambio forzoso de contraseña en primer login
- UI para cambio de contraseña con validaciones en tiempo real
- Mensajes de error claros y específicos
- Recordatorio de contraseña opcional

#### **✅ Administración**
- Diferentes roles (Super Admin, Admin, Marketing, Analista, Viewer)
- Permisos granulares por funcionalidad
- Logs de autenticación para auditoría
- Gestión de sesiones

---

## **OPCIÓN 2: OAuth 2.0 / Single Sign-On (SSO)** ⭐⭐⭐⭐

### **Proveedores Soportados**
- **Google Workspace** (recomendado para empresas)
- **Microsoft Azure AD / Entra ID**
- **Auth0** (servicio especializado)
- **Okta** (enterprise)

### **Implementación con Google OAuth**

#### **Backend Configuration**
```python
# backend/app/services/oauth_service.py
from google.oauth2 import id_token
from google.auth.transport import requests

class OAuthService:
    def __init__(self):
        self.google_client_id = os.getenv('GOOGLE_CLIENT_ID')
        
    def verify_google_token(self, token: str) -> Dict[str, Any]:
        """Verifica token de Google y extrae información del usuario"""
        try:
            idinfo = id_token.verify_oauth2_token(
                token, requests.Request(), self.google_client_id)
            
            if idinfo['iss'] not in ['accounts.google.com', 'https://accounts.google.com']:
                raise ValueError('Wrong issuer.')
            
            return {
                'success': True,
                'user_info': {
                    'email': idinfo['email'],
                    'name': idinfo['name'],
                    'picture': idinfo['picture'],
                    'email_verified': idinfo['email_verified']
                }
            }
        except ValueError:
            return {'success': False, 'error': 'Invalid token'}

    def get_or_create_user(self, user_info: Dict) -> Dict[str, Any]:
        """Obtiene o crea usuario basado en información OAuth"""
        with unified_db.get_connection() as conn:
            # Buscar usuario existente
            user = conn.execute("SELECT * FROM users WHERE email = ?", [user_info['email']]).fetchone()
            
            if user:
                # Usuario existe, actualizar último login
                conn.execute("UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE id = ?", [user['id']])
                return {'success': True, 'user': dict(user), 'is_new': False}
            else:
                # Usuario nuevo, verificar si está en whitelist o crear automáticamente
                if self._is_email_allowed(user_info['email']):
                    # Crear nuevo usuario con rol por defecto
                    default_role_id = 4  # Analista por defecto
                    conn.execute("""
                        INSERT INTO users (email, full_name, role_id, status, password_hash)
                        VALUES (?, ?, ?, 'active', '')
                    """, [user_info['email'], user_info['name'], default_role_id])
                    
                    user_id = conn.lastrowid
                    new_user = conn.execute("SELECT * FROM users WHERE id = ?", [user_id]).fetchone()
                    return {'success': True, 'user': dict(new_user), 'is_new': True}
                else:
                    return {'success': False, 'error': 'Usuario no autorizado'}

    def _is_email_allowed(self, email: str) -> bool:
        """Verifica si el email está en la whitelist o tiene dominio permitido"""
        allowed_domains = ['gatorade.com', 'pepsico.com']  # Configurar según necesidad
        domain = email.split('@')[1]
        return domain in allowed_domains
```

#### **Frontend with Google OAuth**
```typescript
// frontend/src/components/GoogleLoginButton.tsx
import { GoogleLogin } from '@react-oauth/google';

interface GoogleLoginButtonProps {
  onSuccess: (user: any) => void;
  onError: (error: string) => void;
}

export function GoogleLoginButton({ onSuccess, onError }: GoogleLoginButtonProps) {
  const handleGoogleSuccess = async (credentialResponse: any) => {
    try {
      const response = await fetch('/api/auth/google-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: credentialResponse.credential })
      });

      const result = await response.json();
      if (result.success) {
        onSuccess(result.user);
      } else {
        onError(result.error);
      }
    } catch (error) {
      onError('Error de conexión');
    }
  };

  return (
    <div className="w-full">
      <GoogleLogin
        onSuccess={handleGoogleSuccess}
        onError={() => onError('Error en autenticación con Google')}
        size="large"
        width="100%"
        text="signin_with"
        locale="es"
      />
    </div>
  );
}
```

---

## **OPCIÓN 3: Sistema Híbrido** ⭐⭐⭐⭐⭐

### **Características**
- **OAuth para empleados** (Google Workspace/Azure AD)
- **Cuentas locales para consultores/externos**
- **Admin panel para gestión**
- **Flexibilidad máxima**

### **Implementación**
```python
# Combina ambos métodos
class HybridAuthService:
    def authenticate(self, method: str, credentials: Dict) -> Dict:
        if method == 'local':
            return self.local_auth.authenticate_user(**credentials)
        elif method == 'google':
            return self.oauth_service.verify_google_token(credentials['token'])
        # ... otros providers
```

---

## 📊 **Comparación de Opciones**

| Característica | Sistema Interno | OAuth/SSO | Híbrido |
|----------------|----------------|-----------|---------|
| **Setup Complexity** | ⭐⭐⭐ Media | ⭐⭐⭐⭐ Fácil | ⭐⭐ Compleja |
| **Seguridad** | ⭐⭐⭐⭐ Alta | ⭐⭐⭐⭐⭐ Máxima | ⭐⭐⭐⭐⭐ Máxima |
| **User Experience** | ⭐⭐⭐ Buena | ⭐⭐⭐⭐⭐ Excelente | ⭐⭐⭐⭐⭐ Excelente |
| **Mantenimiento** | ⭐⭐ Alto | ⭐⭐⭐⭐⭐ Bajo | ⭐⭐⭐ Medio |
| **Flexibilidad** | ⭐⭐⭐⭐⭐ Total | ⭐⭐ Limitada | ⭐⭐⭐⭐⭐ Total |
| **Costo** | ⭐⭐⭐⭐⭐ Gratis | ⭐⭐⭐ Variable | ⭐⭐⭐ Variable |

---

## 🎯 **Recomendación Final**

### **Para tu contexto corporativo (Gatorade): Sistema Híbrido**

**Razones:**
1. **Empleados internos** → Google Workspace SSO (sin contraseñas que gestionar)
2. **Consultores/externos** → Cuentas locales con control granular  
3. **Flexibilidad total** para diferentes tipos de usuarios
4. **Seguridad máxima** con múltiples factores de autenticación
5. **Experiencia óptima** para cada tipo de usuario

### **Implementación Sugerida por Fases:**

**Fase 1 (2-3 semanas)**: Sistema interno completo con base de datos
**Fase 2 (1 semana)**: Integración Google OAuth para empleados
**Fase 3 (1 semana)**: Admin panel para gestión de usuarios
**Fase 4 (opcional)**: Integración Azure AD si usan Office 365

¿Te interesa que desarrollemos alguna de estas opciones específicamente o necesitas más detalles sobre algún aspecto?