import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Label } from './ui/label';
import { Alert, AlertDescription } from './ui/alert';
import { Info, User, Lock } from 'lucide-react';

interface LoginProps {
  onLogin: (email: string) => void;
}

export function Login({ onLogin }: LoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Credenciales de demostración
  const demoCredentials = [
    { email: 'admin@gatorade.com', password: 'gatorade2024', role: 'Admin' },
    { email: 'marketing@gatorade.com', password: 'marketing123', role: 'Marketing' },
    { email: 'analista@gatorade.com', password: 'testing456', role: 'Analista' }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Simulate login process
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Verificar credenciales de demostración
    const validCredentials = demoCredentials.find(
      cred => cred.email === email && cred.password === password
    );

    if (validCredentials) {
      onLogin(email);
    } else if (!email || !password) {
      setError('Por favor, ingresa email y contraseña');
    } else {
      setError('Credenciales incorrectas. Usa las credenciales mostradas a la derecha.');
    }
    setIsLoading(false);
  };

  const fillDemoCredentials = (cred: { email: string; password: string; role: string }) => {
    setEmail(cred.email);
    setPassword(cred.password);
    setError('');
  };

  return (
    <div className="h-screen w-screen relative flex overflow-hidden">
      {/* Fondo difuso con múltiples capas */}
      <div className="absolute inset-0">
        {/* Capa base con gradiente difuso */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-accent/15 to-secondary/25"></div>
        
        {/* Formas difusas flotantes */}
        <div className="absolute top-10 left-20 w-96 h-96 bg-primary/10 rounded-full blur-3xl opacity-70"></div>
        <div className="absolute bottom-20 right-32 w-80 h-80 bg-accent/15 rounded-full blur-3xl opacity-60"></div>
        <div className="absolute top-1/2 left-1/3 w-64 h-64 bg-secondary/8 rounded-full blur-2xl opacity-80"></div>
        <div className="absolute bottom-10 left-10 w-48 h-48 bg-primary/12 rounded-full blur-2xl opacity-50"></div>
        <div className="absolute top-32 right-20 w-56 h-56 bg-accent/10 rounded-full blur-3xl opacity-75"></div>
        
        {/* Capa de ruido/textura sutil */}
        <div className="absolute inset-0 opacity-30 bg-gradient-to-r from-transparent via-white/5 to-transparent"></div>
        <div className="absolute inset-0 opacity-20 bg-gradient-to-b from-transparent via-primary/5 to-transparent"></div>
      </div>

      {/* Panel izquierdo - Branding con backdrop blur */}
      <div className="flex-1 relative flex items-center justify-center">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/30 via-accent/20 to-secondary/30 backdrop-blur-sm"></div>
        <div className="relative z-10 text-center text-white space-y-6 px-8">
          <div className="w-32 h-32 bg-white/20 rounded-full flex items-center justify-center mx-auto backdrop-blur-md border border-white/30">
            <svg className="w-16 h-16 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
          </div>
          <h1 className="text-4xl font-bold drop-shadow-lg">Gatorade</h1>
          <h2 className="text-xl font-medium drop-shadow">AB Testing Platform</h2>
          <p className="text-lg opacity-90 max-w-md drop-shadow">
            Analiza, optimiza y maximiza el rendimiento de tus campañas con datos en tiempo real
          </p>
        </div>
      </div>

      {/* Panel central - Login Form con backdrop blur */}
      <div className="w-96 relative flex items-center justify-center p-8">
        <div className="absolute inset-0 bg-white/80 backdrop-blur-md"></div>
        <div className="relative z-10 w-full max-w-sm space-y-6">
          <div className="text-center space-y-2">
            <h3 className="text-2xl font-semibold text-secondary">Iniciar Sesión</h3>
            <p className="text-muted-foreground">Accede a tu panel de control</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center text-secondary">
                <User className="w-4 h-4 mr-2" />
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="tu@gatorade.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="border-gray-300 focus:border-primary focus:ring-primary bg-white/90 backdrop-blur"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password" className="flex items-center text-secondary">
                <Lock className="w-4 h-4 mr-2" />
                Contraseña
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="border-gray-300 focus:border-primary focus:ring-primary bg-white/90 backdrop-blur"
              />
            </div>

            {error && (
              <Alert className="bg-accent/10 border-accent/30 backdrop-blur">
                <AlertDescription className="text-accent text-sm">{error}</AlertDescription>
              </Alert>
            )}

            <Button 
              type="submit" 
              className="w-full bg-primary hover:bg-primary/90 text-white h-11"
              disabled={isLoading}
            >
              {isLoading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
            </Button>
          </form>
        </div>
      </div>

      {/* Panel derecho - Credenciales Demo con backdrop blur */}
      <div className="w-80 relative p-8 flex items-center">
        <div className="absolute inset-0 bg-secondary/90 backdrop-blur-md"></div>
        <div className="relative z-10 w-full space-y-6 text-white">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center mx-auto">
              <Info className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-lg font-semibold">Credenciales Demo</h3>
            <p className="text-sm text-gray-300">Haz clic para usar</p>
          </div>

          <div className="space-y-3">
            {demoCredentials.map((cred, index) => (
              <div 
                key={index}
                className="p-3 bg-white/10 rounded-lg cursor-pointer hover:bg-white/20 transition-all duration-200 border border-white/20 backdrop-blur"
                onClick={() => fillDemoCredentials(cred)}
              >
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-sm">{cred.role}</p>
                    <div className="w-2 h-2 bg-primary rounded-full"></div>
                  </div>
                  <p className="text-xs text-gray-300">{cred.email}</p>
                  <p className="text-xs text-gray-400 font-mono">{cred.password}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center">
            <p className="text-xs text-gray-400">
              💡 Selecciona cualquier credencial para acceder
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}