'use client';

import { useState } from 'react';
import { LayoutDashboard, Database, TrendingUp, BarChart3, PieChart, Settings } from 'lucide-react';
import TableViewer from '@/components/TableViewer';
import OpenPositions from '@/components/OpenPositions';
import PnLChart from '@/components/PnLChart';
import PortfolioChart from '@/components/PortfolioChart';
import PnLSymbol from '@/components/PnLSymbol';
import SupabaseDiagnostics from '@/components/SupabaseDiagnostics';
import { WebSocketProvider } from '@/contexts/WebSocketContext';

type TabType = 'tables' | 'positions' | 'pnl' | 'portfolio' | 'pnlsymbol' | 'diagnostics';

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabType>('tables');
  const wsUrl = process.env.NEXT_PUBLIC_WS_URL || '';
  const wsApiKey = process.env.NEXT_PUBLIC_WS_API_KEY || '';

  const tabs = [
    { id: 'tables' as TabType, label: 'Data Tables', icon: Database },
    { id: 'positions' as TabType, label: 'Open Positions', icon: LayoutDashboard },
    { id: 'pnl' as TabType, label: 'P&L Analysis', icon: TrendingUp },
    { id: 'pnlsymbol' as TabType, label: 'P&L Symbol', icon: PieChart },
    { id: 'portfolio' as TabType, label: 'Portfolio Value', icon: BarChart3 },
    { id: 'diagnostics' as TabType, label: 'Diagnostics', icon: Settings },
  ];

  return (
    <WebSocketProvider url={wsUrl} apiKey={wsApiKey} enabled={wsUrl.length > 0}>
      <main className="min-h-screen bg-background">
        {/* Header */}
        <header className="border-b border-border bg-card">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-foreground">Investment Analytics</h1>
                <p className="text-sm text-muted-foreground">Algo Trading V1 Dashboard</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
                <span className="text-sm text-muted-foreground">Live</span>
              </div>
            </div>
          </div>
        </header>

        {/* Navigation Tabs */}
        <div className="border-b border-border bg-card">
          <div className="container mx-auto px-4">
            <nav className="flex gap-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors border-b-2 ${
                      activeTab === tab.id
                        ? 'border-primary text-primary'
                        : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Main Content */}
        <div className="container mx-auto px-4 py-6">
          {activeTab === 'tables' && <TableViewer />}
          {activeTab === 'positions' && <OpenPositions />}
          {activeTab === 'pnl' && <PnLChart />}
          {activeTab === 'pnlsymbol' && <PnLSymbol />}
          {activeTab === 'portfolio' && <PortfolioChart />}
          {activeTab === 'diagnostics' && <SupabaseDiagnostics />}
        </div>
      </main>
    </WebSocketProvider>
  );
}
