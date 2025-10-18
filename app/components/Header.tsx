'use client';

import React, { useEffect, useState } from 'react';
import axios from 'axios';

interface HeaderProps {
  activeTab: 'overview' | 'transactions' | 'customers';
}

interface Branch {
  branch_id: string;
  branch_name: string;
}

export const Header: React.FC<HeaderProps> = ({ activeTab }) => {
  const [branch, setBranch] = useState<Branch | null>(null);
  const [currentDate, setCurrentDate] = useState<string>("");
  const [greeting, setGreeting] = useState<string>("");

  // Get dynamic greeting based on time
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning, Agent!";
    if (hour < 18) return "Good Afternoon, Agent!";
    return "Good Evening, Agent!";
  };

  // Determine header text based on active tab
  const getHeaderContent = () => {
    switch (activeTab) {
      case 'overview':
        return { title: greeting, subtitle: 'Banking Agent Dashboard' };
      case 'transactions':
        return { title: 'Transaction History', subtitle: 'View recent transactions' };
      case 'customers':
        return { title: 'Accounts', subtitle: 'Manage customer accounts' };
      default:
        return { title: 'Dashboard', subtitle: 'Banking Dashboard' };
    }
  };

  const { title, subtitle } = getHeaderContent();

  useEffect(() => {
    const fetchBranch = async () => {
      try {
        const userRes = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/me`, {
          withCredentials: true,
        });
        const employeeId = userRes.data.employee_id;

        const branchRes = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/api/branches/by-employee/${employeeId}`,
          { withCredentials: true }
        );
        setBranch(branchRes.data.branch);
      } catch (err) {
        console.error('Failed to fetch branch info:', err);
      }
    };

    fetchBranch();

    //Set current date
    const today = new Date();
    const formattedDate = today.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
    setCurrentDate(formattedDate);

    //Set greeting
    setGreeting(getGreeting());
  }, []);

  return (
    <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 space-y-4 sm:space-y-0">
      <div>
        <h1 className="text-3xl font-semibold text-gray-900">{title}</h1>
        <p className="text-m text-gray-500">{subtitle}</p>
      </div>
      <div className="flex items-center space-x-4 text-sm text-gray-600">
        <div>
          <span className="font-bold text-gray-900">Date</span> {currentDate}
        </div>
        {branch && (
          <div>
            <span className="font-bold text-gray-900">Branch</span>: {branch.branch_name}-{branch.branch_id}
          </div>
        )}
      </div>
    </header>
  );
};
