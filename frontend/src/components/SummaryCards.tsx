import { useEffect, useState } from 'react';
import { Card, CardContent } from './ui/card';
import { Store, Users } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

interface SummaryCardsProps {
  tipologia: string;
  palanca: string;
}

interface PDVSummary {
  control_count: number;
  foco_count: number;
  control_visits: number;
  foco_visits: number;
}

export function SummaryCards({ tipologia, palanca }: SummaryCardsProps) {
  const [pdvData, setPdvData] = useState<PDVSummary>({
    control_count: 0,
    foco_count: 0,
    control_visits: 0,
    foco_visits: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPDVSummary = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({ tipologia });
        if (palanca) {
          params.append('palanca', palanca);
        }

        const url = `${API_BASE_URL}/api/dashboard/pdv-summary?${params}`;
        const response = await fetch(url);
        const data = await response.json();

        if (data.success) {
          setPdvData({
            control_count: data.control_count || 0,
            foco_count: data.foco_count || 0,
            control_visits: data.control_visits || 0,
            foco_visits: data.foco_visits || 0
          });
        }
      } catch (error) {
        console.error('Error fetching PDV summary:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPDVSummary();
  }, [tipologia, palanca]);

  return (
    <Card className="border shadow-sm">
      <CardContent className="p-2.5">
        {/* Table-style layout */}
        <div className="space-y-2">
          {/* Data Grid - PDV and Visitas as columns */}
          <div className="grid grid-cols-2 gap-2.5">
            {/* PDV Column */}
            <div className="space-y-1">
              <div className="flex items-center justify-center pb-1 border-b">
                <Store className="h-3.5 w-3.5 text-muted-foreground mr-1" />
                <span className="text-[11px] text-foreground font-semibold">PDV</span>
              </div>
              <div className="flex flex-col items-center p-2 bg-muted/30 rounded">
                <div className="text-xl font-bold text-primary">
                  {loading ? '...' : pdvData.foco_count}
                </div>
                <div className="text-xl font-bold text-foreground mt-0.5">
                  {loading ? '...' : pdvData.control_count}
                </div>
              </div>
            </div>

            {/* Visitas Column */}
            <div className="space-y-1">
              <div className="flex items-center justify-center pb-1 border-b">
                <Users className="h-3.5 w-3.5 text-muted-foreground mr-1" />
                <span className="text-[11px] text-foreground font-semibold">Visitas</span>
              </div>
              <div className="flex flex-col items-center p-2 bg-muted/30 rounded">
                <div className="text-xl font-bold text-primary">
                  {loading ? '...' : pdvData.foco_visits}
                </div>
                <div className="text-xl font-bold text-foreground mt-0.5">
                  {loading ? '...' : pdvData.control_visits}
                </div>
              </div>
            </div>
          </div>

          {/* Legend at bottom */}
          <div className="flex items-center justify-center gap-3 pt-1 border-t">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-primary"></div>
              <span className="text-[10px] text-primary font-medium">Foco</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-foreground"></div>
              <span className="text-[10px] text-muted-foreground font-medium">Control</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}