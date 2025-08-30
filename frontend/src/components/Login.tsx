import { useState } from 'react';
import { LoginForm } from './LoginForm';
import backgroundImage from '../assets/1a61d0a24f9ff5887c7d9855cad3a3449b0b5103.png';
import logoImage1 from '../assets/6d3c78c720838cff63f1728bad0913fc7a31326b.png';
import logoImage2 from '../assets/eeebd68b27ba4231462e7a839640963574037229.png';
import poweredByImage from '../assets/8388e6abe7aa42dbcd9db7058b9d67171b1d8c24.png';

interface LoginProps {
  onLogin: (email: string) => void;
}

export function Login({ onLogin }: LoginProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Credenciales de demostración
  const demoCredentials = [
    { email: 'admin@gatorade.com', password: 'gatorade2024', role: 'Admin' },
    { email: 'marketing@gatorade.com', password: 'marketing123', role: 'Marketing' },
    { email: 'analista@gatorade.com', password: 'testing456', role: 'Analista' }
  ];

  const handleLogin = async (email: string, password: string) => {
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
      setError('Credenciales incorrectas. Usa las credenciales demo.');
    }
    setIsLoading(false);
  };

  const handleFillDemo = (email: string, password: string) => {
    setError('');
  };

  return (
    <div className="min-h-screen w-full relative overflow-hidden">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${backgroundImage})` }}
      >
        {/* Dark overlay for better text readability */}
        <div className="absolute inset-0 bg-black/20"></div>
      </div>
      
      {/* Content */}
      <div className="relative z-10 min-h-screen flex items-center justify-end pr-2 md:pr-4 lg:pr-8 xl:pr-12">
        <div className="w-full max-w-md mr-12 md:mr-16 lg:mr-20 xl:mr-24">
          <LoginForm 
            onLogin={handleLogin}
            isLoading={isLoading}
            error={error}
            demoCredentials={demoCredentials}
            onFillDemo={handleFillDemo}
          />
          
          {/* Powered by section - outside the login card */}
          <div className="flex flex-col items-center mt-6 space-y-2">
            <span className="text-sm text-white/80">Powered by</span>
            <img 
              src={poweredByImage} 
              alt="Powered by" 
              className="h-5 md:h-8 opacity-90 hover:opacity-100 transition-opacity"
            />
          </div>
        </div>
      </div>
      
      {/* Bottom Center Logos */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-20">
        <div className="flex items-center gap-8">
          <img 
            src={logoImage1} 
            alt="Logo 1" 
            className="h-12 md:h-16 opacity-90 hover:opacity-100 transition-opacity"
          />
          <img 
            src={logoImage2} 
            alt="Logo 2" 
            className="h-12 md:h-16 opacity-90 hover:opacity-100 transition-opacity"
          />
        </div>
      </div>
    </div>
  );
}