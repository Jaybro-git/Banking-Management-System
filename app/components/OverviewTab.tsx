// OverviewTab.tsx
import React, { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import { ArrowDownToLine, Banknote } from 'lucide-react';
import { QuickActionCard, ActionItem } from './QuickActionCard';
import { Button } from './ui/Button';

interface OverviewTabProps {
  quickActions: ActionItem[];
  branch: { branch_id: string; branch_name: string } | null;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({ quickActions, branch }) => {
  const [chartData, setChartData] = useState<any>({
    labels: [],
    datasets: [],
  });
  const [dailyBranch, setDailyBranch] = useState<{ deposits: number; withdrawals: number } | null>(null);
  const [dailyAll, setDailyAll] = useState<{ deposits: number; withdrawals: number } | null>(null);
  const [chartView, setChartView] = useState<'monthly' | 'daily'>('monthly');

  useEffect(() => {
    const fetchData = async () => {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

      // Fetch trends based on chart view
      try {
        const endpoint = chartView === 'monthly' ? 'monthly-trends' : 'daily-trends';
        const trendsRes = await fetch(`${apiUrl}/api/transactions/${endpoint}${branch?.branch_id ? `?branchId=${branch.branch_id}` : ''}`, {
          method: 'GET',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
        });
        if (trendsRes.ok) {
          const trends = await trendsRes.json();
          setChartData({
            labels: trends.labels,
            datasets: [
              {
                label: "Deposits",
                data: trends.deposits,
                borderColor: "#10B981",
                backgroundColor: "rgba(16, 185, 129, 0.2)",
                tension: 0.4,
                fill: true,
              },
              {
                label: "Withdrawals",
                data: trends.withdrawals,
                borderColor: "#F59E0B",
                backgroundColor: "rgba(245, 158, 11, 0.2)",
                tension: 0.4,
                fill: true,
              },
            ],
          });
        }
      } catch (err) {
        console.error(`Failed to fetch ${chartView} trends:`, err);
      }

      // Fetch daily summary for all branches
      try {
        const dailyAllRes = await fetch(`${apiUrl}/api/transactions/daily-summary`, {
          method: 'GET',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
        });
        if (dailyAllRes.ok) {
          setDailyAll(await dailyAllRes.json());
        }
      } catch (err) {
        console.error('Failed to fetch daily summary for all branches:', err);
      }

      // Fetch daily summary for current branch if available
      if (branch?.branch_id) {
        try {
          const dailyBranchRes = await fetch(`${apiUrl}/api/transactions/daily-summary?branchId=${branch.branch_id}`, {
            method: 'GET',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
          });
          if (dailyBranchRes.ok) {
            setDailyBranch(await dailyBranchRes.json());
          }
        } catch (err) {
          console.error('Failed to fetch daily summary for branch:', err);
        }
      }
    };

    fetchData();
  }, [branch, chartView]);

  const formatCurrency = (value: number) => {
    return value.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  };

  return (
    <div className="space-y-6">
      {/* Quick Actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {quickActions.map((action) => (
          <QuickActionCard key={action.title} action={action} />
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-6">
        {/* Line Chart Card */}
        <div className="w-full sm:w-3/4 bg-white p-4 rounded-2xl border border-gray-200 shadow-lg">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-m font-medium text-gray-900">
              {chartView === 'monthly' ? 'Monthly Transaction Trends' : 'Daily Transaction Trends'}
            </h2>
            <Button variant="secondary" size="sm" onClick={() => setChartView(chartView === 'monthly' ? 'daily' : 'monthly')}>
              {chartView === 'monthly' ? 'Show Daily' : 'Show Monthly'}
            </Button>
          </div>
          <div className="h-70">
            <Line
              data={chartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: "top",
                    labels: { color: "#6b7280", font: { size: 12 } },
                  },
                  title: { display: false },
                  tooltip: {
                    backgroundColor: "#f3f4f6",
                    titleColor: "#1f2937",
                    bodyColor: "#1f2937",
                    titleFont: { size: 12 },
                    bodyFont: { size: 10 },
                    padding: 8,
                  },
                },
                scales: {
                  x: {
                    ticks: { color: "#6b7280", font: { size: 10 } },
                    grid: { color: "#e5e7eb" },
                  },
                  y: {
                    ticks: { color: "#6b7280", font: { size: 10 } },
                    grid: { color: "#e5e7eb" },
                  },
                },
                animation: {
                  duration: 800,
                  easing: "easeInOutQuad",
                },
              }}
            />
          </div>
        </div>

        {/* Daily Summary Card */}
        <div className="w-full sm:w-1/2 bg-white p-6 rounded-2xl border border-gray-200 shadow-lg space-y-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Daily Summary</h3>

          {/* Deposits Today */}
          <div className="bg-gray-50 p-4 rounded-xl space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-600">
              <ArrowDownToLine className="h-4 w-4 text-emerald-600" />
              <span>Deposits Today</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">{branch?.branch_name || 'Current Branch'}</span>
              <span className="font-semibold text-emerald-600">LKR {dailyBranch ? formatCurrency(dailyBranch.deposits) : '0'}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">All Branches</span>
              <span className="font-semibold text-emerald-600">LKR {dailyAll ? formatCurrency(dailyAll.deposits) : '0'}</span>
            </div>
          </div>

          {/* Withdrawals Today */}
          <div className="bg-gray-50 p-4 rounded-xl space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-600">
              <Banknote className="h-4 w-4 text-red-500" />
              <span>Withdrawals Today</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">{branch?.branch_name || 'Current Branch'}</span>
              <span className="font-semibold text-red-500">LKR {dailyBranch ? formatCurrency(dailyBranch.withdrawals) : '0'}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">All Branches</span>
              <span className="font-semibold text-red-500">LKR {dailyAll ? formatCurrency(dailyAll.withdrawals) : '0'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};