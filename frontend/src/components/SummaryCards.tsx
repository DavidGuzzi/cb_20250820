import { Card, CardContent } from './ui/card';
import { TrendingUp, TrendingDown, Users, Target, BarChart3, Zap } from 'lucide-react';

const summaryData = [
  {
    title: 'Experimentos Activos',
    value: '24',
    icon: Target,
    trend: '+12%',
    trendUp: true,
    color: 'gatorade-orange'
  },
  {
    title: 'Usuarios en Prueba',
    value: '45.2K',
    icon: Users,
    trend: '+8.5%',
    trendUp: true,
    color: 'gatorade-blue'
  },
  {
    title: 'Conversion Rate',
    value: '3.8%',
    icon: BarChart3,
    trend: '-2.1%',
    trendUp: false,
    color: 'gatorade-green'
  },
  {
    title: 'Revenue Lift',
    value: '+15.3%',
    icon: Zap,
    trend: '+5.2%',
    trendUp: true,
    color: 'gatorade-yellow'
  }
];

export function SummaryCards() {
  return (
    <div className="space-y-2">
      {summaryData.map((item, index) => (
        <Card key={index} className="border shadow-sm">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="text-xs text-muted-foreground mb-1">
                  {item.title}
                </div>
                <div className="text-lg font-medium text-foreground">{item.value}</div>
              </div>
              <div className="flex flex-col items-end">
                <item.icon className="h-4 w-4 text-muted-foreground mb-1" />
                <div className="flex items-center text-xs">
                  {item.trendUp ? (
                    <TrendingUp className="h-3 w-3 text-green-600 mr-1" />
                  ) : (
                    <TrendingDown className="h-3 w-3 text-red-600 mr-1" />
                  )}
                  <span className={item.trendUp ? 'text-green-600' : 'text-red-600'}>
                    {item.trend}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}