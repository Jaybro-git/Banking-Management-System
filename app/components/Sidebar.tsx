"use client";
import { useAuth } from "../providers/AuthProvider";
import React from "react";

interface SidebarProps {
  activeTab: "overview" | "transactions" | "customers";
  setActiveTab: (tab: "overview" | "transactions" | "customers") => void;
  isSidebarOpen: boolean;
  setIsSidebarOpen: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  isSidebarOpen,
  setIsSidebarOpen,
}) => {
  const { logout } = useAuth();
  const tabs = [
    {
      key: "overview",
      label: "Overview",
      icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6",
    },
    {
      key: "transactions",
      label: "Transactions",
      icon: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
    },
    {
      key: "customers",
      label: "Customers",
      icon: "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z",
    },
  ];

  return (
    <aside
      className={`fixed top-0 left-0 bg-white shadow-md flex flex-col h-screen transition-all duration-300 ${
        isSidebarOpen ? "w-64" : "w-16"
      } flex-shrink-0 z-40`}
    >
      <div className="flex items-center justify-between p-4 h-20">
        {isSidebarOpen && (
          <div className="mt-4 text-2xl font-bold text-green-800 ml-4">
            B<span className="text-2xl font-normal">-TRUST</span>
          </div>
        )}
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className={`mt-4 p-2 rounded-full hover:bg-emerald-50 text-green-800 transition-all duration-200 cursor-pointer ${
            isSidebarOpen ? "ml-2 self-center" : "mx-auto"
          }`}
          style={{ alignSelf: "center" }}
          aria-label="Toggle sidebar"
        >
          <svg
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d={isSidebarOpen ? "M15 19l-7-7 7-7" : "M9 5l7 7-7 7"}
            />
          </svg>
        </button>
      </div>
      <br />
      <nav className="flex-1 px-2 space-y-1">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as typeof activeTab)}
            className={`w-full px-4 py-2 rounded-lg font-medium text-left transition-colors duration-200 cursor-pointer flex items-center space-x-2 ${
              activeTab === tab.key
                ? "bg-emerald-100 text-green-800"
                : "text-gray-600 hover:bg-emerald-50 hover:text-emerald-600"
            }`}
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d={tab.icon}
              />
            </svg>
            {isSidebarOpen && <span>{tab.label}</span>}
          </button>
        ))}
      </nav>
      <div className="p-2">
        <button
          onClick={logout}
          className="w-full px-4 py-2 rounded-lg font-medium flex items-center space-x-2 text-red-600 hover:bg-red-100 transition-colors duration-200 cursor-pointer"
        >
          <svg
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
            />
          </svg>
          {isSidebarOpen && <span>Logout</span>}
        </button>
      </div>
    </aside>
  );
};