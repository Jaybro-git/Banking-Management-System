'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from '@/app/components/ui/Button';
import { TextInput } from '@/app/components/ui/TextInput';

interface BranchData {
  branch_id: string;
  branch_name: string;
  address: string | null;
  district: string | null;
  phone_number: string | null;
  email: string | null;
  established_date: string | null;
  status: string;
}

interface EmployeeData {
  employee_id: string;
  first_name: string;
  last_name: string;
  role: string;
  hire_date: string;
}

interface BranchDetails {
  agents: number;
  customers: number;
  accounts: number;
  employees: EmployeeData[];
}

const BranchesPage = () => {
  const [branches, setBranches] = React.useState<BranchData[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [showForm, setShowForm] = React.useState(false);
  const [formData, setFormData] = React.useState({
    branchName: '',
    address: '',
    district: '',
    phoneNumber: '',
    email: '',
    establishedDate: '',
    status: 'ACTIVE',
  });
  const [expandedBranch, setExpandedBranch] = React.useState<string | null>(null);
  const [branchDetails, setBranchDetails] = React.useState<{ [key: string]: BranchDetails }>({});

  React.useEffect(() => {
    fetchBranches();
  }, []);

  const fetchBranches = async () => {
    setLoading(true);
    setError(null);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const response = await fetch(`${apiUrl}/api/branches/`, {
        method: 'GET',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });

      if (response.status === 401) throw new Error('Session expired. Please log in again.');
      if (!response.ok) {
        const errData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errData.error || `Server error: ${response.status}`);
      }

      const data = await response.json();
      setBranches(data.branches);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Failed to fetch branches');
    } finally {
      setLoading(false);
    }
  };

  const fetchBranchDetails = async (branchId: string) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const response = await fetch(`${apiUrl}/api/branches/${branchId}/details`, {
        method: 'GET',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });

      if (response.status === 401) throw new Error('Session expired. Please log in again.');
      if (!response.ok) {
        const errData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errData.error || `Server error: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (err) {
      console.error('Error fetching branch details:', err);
      throw err;
    }
  };

  const toggleDetails = async (branchId: string) => {
    if (expandedBranch === branchId) {
      setExpandedBranch(null);
      return;
    }

    if (!branchDetails[branchId]) {
      try {
        const details = await fetchBranchDetails(branchId);
        setBranchDetails(prev => ({ ...prev, [branchId]: details }));
      } catch (err) {
        // For now, don't expand if fetch fails
        return;
      }
    }

    setExpandedBranch(branchId);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-LK');
  };

  if (loading)
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      </div>
    );

  if (error)
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
        {error}
      </div>
    );

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="mx-auto px-8 py-6 max-w-7xl">
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 space-y-4 sm:space-y-0">
          <div>
            <h1 className="text-3xl font-semibold text-gray-900">Branch Management</h1>
            <p className="text-m text-gray-500">View and manage bank branches</p>
          </div>
          <div className="flex items-center space-x-4">
            <Link href="/" passHref>
              <Button variant="danger" size="md">
                Back to Dashboard
              </Button>
            </Link>
          </div>
        </header>

        {/* Branches List */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mt-6">
          <div className="flex flex-col h-[calc(100vh-190px)]">
            {/* Sticky Header Section */}
            <div className="bg-white sticky top-0 space-y-4 z-10">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-gray-600">Branches</h2>
                <span className="text-xs text-gray-400">
                  {branches.length} {branches.length === 1 ? 'branch' : 'branches'} found
                </span>
              </div>
            </div>

            {/* Scrollable Branches List */}
            <div className="flex-1 overflow-y-auto mt-4 pr-2">
              {branches.length === 0 ? (
                <div className="text-center py-8 text-gray-500 text-sm">
                  No branches found
                </div>
              ) : (
                <div className="space-y-4">
                  {branches.map((branch) => {
                    const isExpanded = expandedBranch === branch.branch_id;
                    const details = branchDetails[branch.branch_id];
                    return (
                      <div
                        key={branch.branch_id}
                        className="p-4 rounded-lg border border-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow duration-200"
                      >
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="text-sm font-semibold text-gray-900">
                                {branch.branch_name}
                              </h3>
                              <span
                                className={`px-2 py-0.5 text-xs rounded-full ${
                                  branch.status === 'ACTIVE'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-red-100 text-red-800'
                                }`}
                              >
                                {branch.status}
                              </span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-xs text-gray-600">
                              <p>
                                <span className="font-medium">Branch ID:</span> {branch.branch_id}
                              </p>
                              <p>
                                <span className="font-medium">Address:</span> {branch.address || 'N/A'}
                              </p>
                              <p>
                                <span className="font-medium">District:</span> {branch.district || 'N/A'}
                              </p>
                              <p>
                                <span className="font-medium">Phone:</span> {branch.phone_number || 'N/A'}
                              </p>
                              <p>
                                <span className="font-medium">Email:</span> {branch.email || 'N/A'}
                              </p>
                              <p>
                                <span className="font-medium">Established:</span> {formatDate(branch.established_date)}
                              </p>
                            </div>
                          </div>

                          <Button
                            variant="primary"
                            className="mt-2 sm:mt-0 whitespace-nowrap"
                            onClick={() => toggleDetails(branch.branch_id)}
                          >
                            {isExpanded ? 'Hide Details' : 'View Details'}
                          </Button>
                        </div>

                        {isExpanded && details && (
                          <div className="mt-4 border-t pt-4">
                            <h4 className="text-sm font-medium text-gray-900 mb-2">Branch Statistics</h4>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-4 gap-y-1 text-xs text-gray-600 mb-4">
                              <p>
                                <span className="font-medium">Total Agents:</span> {details.agents}
                              </p>
                              <p>
                                <span className="font-medium">Total Customers:</span> {details.customers}
                              </p>
                              <p>
                                <span className="font-medium">Total Accounts:</span> {details.accounts}
                              </p>
                            </div>
                            <h4 className="text-sm font-medium text-gray-900 mb-2">Agents</h4>
                            {details.employees.length === 0 ? (
                              <p className="text-xs text-gray-600">No active employees found</p>
                            ) : (
                              <div className="rounded-lg divide-y divide-gray-100">
                                {details.employees.map((employee) => (
                                  <div
                                    key={employee.employee_id}
                                    className="py-2 px-4 bg-gray-50 hover:bg-gray-100 transition"
                                  >
                                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-x-4 gap-y-1 text-xs text-gray-600">
                                      <p>
                                        <span className="font-medium">Name:</span> {employee.first_name} {employee.last_name}
                                      </p>
                                      <p>
                                        <span className="font-medium">Role:</span> {employee.role}
                                      </p>
                                      <p>
                                        <span className="font-medium">Employee ID:</span> {employee.employee_id}
                                      </p>
                                      <p>
                                        <span className="font-medium">Hire Date:</span> {formatDate(employee.hire_date)}
                                      </p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

export default BranchesPage;