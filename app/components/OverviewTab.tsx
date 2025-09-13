import React from 'react';
import { Line } from 'react-chartjs-2';
import { ArrowDownToLine, Banknote } from 'lucide-react';
import { QuickActionCard, ActionItem } from './QuickActionCard';

interface OverviewTabProps {
  quickActions: ActionItem[];
  chartData: any;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({ quickActions, chartData }) => {
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
          <h2 className="text-m font-medium text-gray-900 mb-3">Monthly Transaction Trends</h2>
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
              <span className="text-gray-500">Moratuwa Branch</span>
              <span className="font-semibold text-emerald-600">LKR 1,250,000</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">All Branches</span>
              <span className="font-semibold text-emerald-600">LKR 9,800,000</span>
            </div>
          </div>

          {/* Withdrawals Today */}
          <div className="bg-gray-50 p-4 rounded-xl space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-600">
              <Banknote className="h-4 w-4 text-red-500" />
              <span>Withdrawals Today</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Moratuwa Branch</span>
              <span className="font-semibold text-red-500">LKR 670,000</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">All Branches</span>
              <span className="font-semibold text-red-500">LKR 4,300,000</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};