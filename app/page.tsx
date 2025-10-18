"use client";

import { useState, useEffect } from "react";
import Cookies from "js-cookie"; // Import js-cookie
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
  Banknote,
  UserPlus,
  Vault,
  Receipt,
  User,
  Building,
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
  // Initialize activeTab from cookie or default to "overview"
  const [activeTab, setActiveTab] = useState<"overview" | "transactions" | "customers">(() => {
    const savedTab = Cookies.get("activeTab");
    return savedTab && ["overview", "transactions", "customers"].includes(savedTab)
      ? savedTab as "overview" | "transactions" | "customers"
      : "overview";
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [filterType, setFilterType] = useState<string>("All");
  const [searchField, setSearchField] = useState<"customer" | "account" | "ref" | "date">("customer");
  const [employeeId, setEmployeeId] = useState<string | null>(null);
  const [branch, setBranch] = useState<{ branch_id: string; branch_name: string } | null>(null);

  // Customer filters
  const [customerFilterType, setCustomerFilterType] = useState<string>("All");
  const [customerSearchField, setCustomerSearchField] = useState<string>("account");
  const [customerSearchQuery, setCustomerSearchQuery] = useState("");

  // Save activeTab to cookie whenever it changes
  useEffect(() => {
    Cookies.set("activeTab", activeTab, { expires: 7 }); // Cookie expires in 7 days
  }, [activeTab]);

  useEffect(() => {
    const fetchCurrentEmployeeAndBranch = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
        const response = await fetch(`${apiUrl}/api/profile/employee`, {
          method: 'GET',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.error || `Server error: ${response.status}`);
        }

        const data = await response.json();
        setEmployeeId(data.employee.employee_id);

        if (data.employee.employee_id) {
          const branchResponse = await fetch(`${apiUrl}/api/branches/by-employee/${data.employee.employee_id}`, {
            method: 'GET',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
          });

          if (branchResponse.ok) {
            const branchData = await branchResponse.json();
            setBranch(branchData.branch);
          }
        }
      } catch (err) {
        console.error('Failed to fetch current employee or branch:', err);
      }
    };
    fetchCurrentEmployeeAndBranch();
  }, []);

  const quickActions: ActionItem[] = [
    { icon: <UserPlus className="w-7 h-7 text-green-600" />, title: "Open Account", description: "Register Customers and Open New Accounts", href: "/OpenAccount" },
    { icon: <PiggyBank className="w-7 h-7 text-green-600" />, title: "New Deposit", description: "Create a New Customer Deposit Request", href: "/NewDeposit" },
    { icon: <Banknote className="w-7 h-7 text-green-600" />, title: "Withdrawal", description: "Process a Customer Withdrawal Request", href: "/Withdrawal" },
    { icon: <Vault className="w-7 h-7 text-green-600" />, title: "Fixed Deposit", description: "Manage Fixed Deposits and Interest Payments", href: "/FixedDeposit" },
    { icon: <Receipt className="w-7 h-7 text-green-600" />, title: "Fund Transfer", description: "Transfer Funds Between Accounts and Manage", href: "/Transfer" },
    { icon: <BarChart2 className="w-7 h-7 text-green-600" />, title: "View Reports", description: "Generate and View Detailed Reports on Transactions and Accounts", href: "/Reports" },
    { icon: <Building className="w-7 h-7 text-green-600" />, title: "Bank Details", description: "View and Manage Bank Branch Information", href: "/branches" },
    { icon: <User className="w-7 h-7 text-green-600" />, title: "Agent Profile", description: "View and Edit Your Agent Profile and Personal Information", href: employeeId ? `/dashboard/employee/${employeeId}` : '/' },
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
        {activeTab === "overview" && <OverviewTab quickActions={quickActions} branch={branch} />}
        {activeTab === "transactions" && (
          <TransactionsTab
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
            customerFilterType={customerFilterType as any}
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