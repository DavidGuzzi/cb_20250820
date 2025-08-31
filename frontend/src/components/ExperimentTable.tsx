import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { ScrollArea } from './ui/scroll-area';
import { TrendingUp, TrendingDown, Target, Zap, Star } from 'lucide-react';

interface ExperimentTableProps {
  filters: {
    tipologia: string;
    palanca: string;
    kpi: string;
    periodo: string;
  };
}

// Datos de la tabla basados en el diseño de Figma
const experimentData = {
  sellIn: {
    cajasEstandarizadas: {
      palancaA: { value: '45.2K', change: '+12.5%', positive: true },
      palancaB: { value: '38.7K', change: '+8.3%', positive: true },
      palancaC: { value: '41.1K', change: '-2.1%', positive: false }
    },
    ventas: {
      palancaA: { value: '€1.8M', change: '+16.7%', positive: true },
      palancaB: { value: '€1.5M', change: '+9.2%', positive: true },
      palancaC: { value: '€1.6M', change: '+3.4%', positive: true }
    }
  },
  sellOut: {
    cajasEstandarizadas: {
      palancaA: { value: '42.8K', change: '+18.9%', positive: true },
      palancaB: { value: '35.1K', change: '+5.7%', positive: true },
      palancaC: { value: '39.3K', change: '-4.2%', positive: false }
    },
    ventas: {
      palancaA: { value: '€2.1M', change: '+21.3%', positive: true },
      palancaB: { value: '€1.7M', change: '+12.8%', positive: true },
      palancaC: { value: '€1.9M', change: '+6.1%', positive: true }
    }
  }
};

const CellValue = ({ data }: { data: { value: string; change: string; positive: boolean } }) => (
  <div className="text-center">
    <div className="font-medium text-sm text-foreground">{data.value}</div>
    <div className={`flex items-center justify-center gap-1 text-xs ${
      data.positive ? 'text-green-600' : 'text-red-600'
    }`}>
      {data.positive ? (
        <TrendingUp className="h-3 w-3" />
      ) : (
        <TrendingDown className="h-3 w-3" />
      )}
      <span>{data.change}</span>
    </div>
  </div>
);

export function ExperimentTable({ filters }: ExperimentTableProps) {
  return (
    <Card className="h-full bg-card shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-foreground">Resultados por KPI y Palanca</CardTitle>
      </CardHeader>
      <CardContent className="h-[calc(100%-60px)] p-0">
        <ScrollArea className="h-full px-6 pb-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-32 text-muted-foreground font-medium">Grupo</TableHead>
                <TableHead className="w-40 text-muted-foreground font-medium">KPI</TableHead>
                <TableHead className="text-center text-orange-600 font-medium">
                  <div className="flex items-center justify-center gap-2">
                    <Target className="h-4 w-4" />
                    <span>Palanca A</span>
                  </div>
                </TableHead>
                <TableHead className="text-center text-blue-600 font-medium">
                  <div className="flex items-center justify-center gap-2">
                    <Zap className="h-4 w-4" />
                    <span>Palanca B</span>
                  </div>
                </TableHead>
                <TableHead className="text-center text-green-600 font-medium">
                  <div className="flex items-center justify-center gap-2">
                    <Star className="h-4 w-4" />
                    <span>Palanca C</span>
                  </div>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {/* Sell In Group */}
              <TableRow className="hover:bg-muted/50">
                <TableCell className="font-medium text-foreground" rowSpan={2}>
                  <div className="flex items-center gap-2">
                    <div className="w-1 h-8 bg-blue-600 rounded-full"></div>
                    <span>Sell In</span>
                  </div>
                </TableCell>
                <TableCell className="font-medium text-sm text-muted-foreground">Cajas Estandarizadas</TableCell>
                <TableCell>
                  <CellValue data={experimentData.sellIn.cajasEstandarizadas.palancaA} />
                </TableCell>
                <TableCell>
                  <CellValue data={experimentData.sellIn.cajasEstandarizadas.palancaB} />
                </TableCell>
                <TableCell>
                  <CellValue data={experimentData.sellIn.cajasEstandarizadas.palancaC} />
                </TableCell>
              </TableRow>
              <TableRow className="hover:bg-muted/50">
                <TableCell className="font-medium text-sm text-muted-foreground">Ventas</TableCell>
                <TableCell>
                  <CellValue data={experimentData.sellIn.ventas.palancaA} />
                </TableCell>
                <TableCell>
                  <CellValue data={experimentData.sellIn.ventas.palancaB} />
                </TableCell>
                <TableCell>
                  <CellValue data={experimentData.sellIn.ventas.palancaC} />
                </TableCell>
              </TableRow>

              {/* Sell Out Group */}
              <TableRow className="hover:bg-muted/50 border-t-2">
                <TableCell className="font-medium text-foreground" rowSpan={2}>
                  <div className="flex items-center gap-2">
                    <div className="w-1 h-8 bg-green-600 rounded-full"></div>
                    <span>Sell Out</span>
                  </div>
                </TableCell>
                <TableCell className="font-medium text-sm text-muted-foreground">Cajas Estandarizadas</TableCell>
                <TableCell>
                  <CellValue data={experimentData.sellOut.cajasEstandarizadas.palancaA} />
                </TableCell>
                <TableCell>
                  <CellValue data={experimentData.sellOut.cajasEstandarizadas.palancaB} />
                </TableCell>
                <TableCell>
                  <CellValue data={experimentData.sellOut.cajasEstandarizadas.palancaC} />
                </TableCell>
              </TableRow>
              <TableRow className="hover:bg-muted/50">
                <TableCell className="font-medium text-sm text-muted-foreground">Ventas</TableCell>
                <TableCell>
                  <CellValue data={experimentData.sellOut.ventas.palancaA} />
                </TableCell>
                <TableCell>
                  <CellValue data={experimentData.sellOut.ventas.palancaB} />
                </TableCell>
                <TableCell>
                  <CellValue data={experimentData.sellOut.ventas.palancaC} />
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}