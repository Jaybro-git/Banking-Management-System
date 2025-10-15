"use client";

import { useState } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from "chart.js";
import {
  PiggyBank,
  BarChart2,
  Headset,
  Banknote,
  UserPlus,
  Vault,
  Receipt,
  Users,
} from "lucide-react";

import { Sidebar } from "@/app/components/Sidebar";
import { Header } from "@/app/components/Header";
import { OverviewTab } from "@/app/components/OverviewTab";
import { TransactionsTab } from "@/app/components/TransactionsTab";
import { CustomersTab } from "@/app/components/CustomersTab";
import { ActionItem } from "@/app/components/QuickActionCard";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function AgentDashboard() {
  const [activeTab, setActiveTab] = useState<"overview" | "transactions" | "customers">("overview");
  const [searchQuery, setSearchQuery] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [filterType, setFilterType] = useState<"All" | "Deposit" | "Withdrawal">("All");
  const [searchField, setSearchField] = useState<"customer" | "account" | "ref" | "date">("customer");

  // Use generic string type for customer filters/search
  const [customerFilterType, setCustomerFilterType] = useState<string>("All");
  const [customerSearchField, setCustomerSearchField] = useState<string>("account");
  const [customerSearchQuery, setCustomerSearchQuery] = useState("");

  const transactions = [
    { date: "2025-08-01", account: "SA-004-017-00023", type: "Deposit", amount: 5000, ref: "TXN9324", customer: "John Doe" },
    { date: "2025-08-02", account: "SA-004-005-00008", type: "Withdrawal", amount: 2000, ref: "TXN9325", customer: "Jane Smith" },
    { date: "2025-08-03", account: "SA-004-017-00056", type: "Deposit", amount: 3500, ref: "TXN9326", customer: "Alice Brown" },
    { date: "2025-08-04", account: "SA-004-002-00028", type: "Withdrawal", amount: 1500, ref: "TXN9327", customer: "Bob Wilson" },
  ];

  const chartData = {
    labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul"],
    datasets: [
      {
        label: "Deposits",
        data: [12, 19, 14, 20, 25, 18, 22],
        borderColor: "#10B981",
        backgroundColor: "rgba(16, 185, 129, 0.2)",
        tension: 0.4,
        fill: true,
      },
      {
        label: "Withdrawals",
        data: [8, 15, 10, 12, 18, 14, 16],
        borderColor: "#F59E0B",
        backgroundColor: "rgba(245, 158, 11, 0.2)",
        tension: 0.4,
        fill: true,
      },
    ],
  };

  const quickActions: ActionItem[] = [
    { icon: <UserPlus className="w-7 h-7 text-green-600" />, title: "Open Account", description: "Register Customers and Open New Accounts", href: "/OpenAccount" },
    { icon: <PiggyBank className="w-7 h-7 text-green-600" />, title: "New Deposit", description: "Create a New Customer Deposit Request", href: "/NewDeposit" },
    { icon: <Banknote className="w-7 h-7 text-green-600" />, title: "Withdrawal", description: "Process a Customer Withdrawal Request", href: "/Withdrawal" },
    { icon: <Vault className="w-7 h-7 text-green-600" />, title: "Fixed Deposit", description: "Manage Fixed Deposits and Interest Payments", href: "/FixedDeposit" },
    { icon: <Receipt className="w-7 h-7 text-green-600" />, title: "Fund Transfer", description: "Transfer Funds Between Accounts and Manage", href: "/Transfer" },
    { icon: <BarChart2 className="w-7 h-7 text-green-600" />, title: "View Reports", description: "Generate and View Detailed Reports on Transactions and Accounts", href: "/Reports" },
    { icon: <Headset className="w-7 h-7 text-green-600" />, title: "Customer Support", description: "Assist Customers With Their Queries and Issues", href: "/test" },
  ];

  return (
    <div className="min-h-screen flex bg-gray-100 text-gray-900 font-sans overflow-hidden">
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
      />
      <main
        className={`flex-1 p-6 bg-white shadow-inner transition-all duration-300 min-w-0 ${
          isSidebarOpen ? "ml-64" : "ml-16"
        }`}
      >
        <Header activeTab={activeTab} />
        {activeTab === "overview" && <OverviewTab quickActions={quickActions} chartData={chartData} />}
        {activeTab === "transactions" && (
          <TransactionsTab
            transactions={transactions}
            filterType={filterType}
            setFilterType={setFilterType}
            searchField={searchField}
            setSearchField={setSearchField}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
          />
        )}
        {activeTab === "customers" && (
          <CustomersTab
            customerFilterType={customerFilterType as any} // cast to satisfy TS
            setCustomerFilterType={(val: any) => setCustomerFilterType(val)}
            customerSearchField={customerSearchField as any}
            setCustomerSearchField={(val: any) => setCustomerSearchField(val)}
            customerSearchQuery={customerSearchQuery}
            setCustomerSearchQuery={setCustomerSearchQuery}
          />
        )}
      </main>
    </div>
  );
}
