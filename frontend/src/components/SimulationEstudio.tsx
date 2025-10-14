import { Card } from './ui/card';
import { FileText } from 'lucide-react';

export function SimulationEstudio() {
  return (
    <div className="h-full flex items-center justify-center p-8">
      <Card className="p-12 text-center max-w-md bg-muted/30">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <FileText className="w-8 h-8 text-primary" />
          </div>
          <h3 className="text-xl font-semibold text-foreground">
            Simulaciones Estudio
          </h3>
          <p className="text-sm text-muted-foreground">
            Próximamente: Historial de simulaciones guardadas y análisis detallados de estudios previos.
          </p>
        </div>
      </Card>
    </div>
  );
}
