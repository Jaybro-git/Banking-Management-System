// app/dashboard/employee/[employeeId]/page.tsx
'use client';

import React from 'react';
import { use } from 'react';
import Link from 'next/link';
import { Button } from '@/app/components/ui/Button';

interface EmployeeData {
  employee_id: string;
  first_name: string;
  last_name: string;
  nic_number: string;
  phone_number: string;
  email: string;
  hire_date: string;
  status: string;
  salary: number;
  role: string;
  branch_name: string;
  address: string;
  total_customers: number;
  total_accounts: number;
  total_transactions: number;
}

interface Transaction {
  transaction_id: string;
  account_id: string;
  transaction_type: string;
  amount: number;
  time_date_stamp: string;
  description: string;
  reference_number: string;
}

interface ReportData {
  startDate: string;
  endDate: string;
  range_customers: number;
  range_accounts: number;
  range_transactions: number;
  transactions: Transaction[];
}

const EmployeeProfilePage = ({ params: paramsPromise }: { params: Promise<{ employeeId: string }> }) => {
  const params = use(paramsPromise);
  const [employee, setEmployee] = React.useState<EmployeeData | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [reportStartDate, setReportStartDate] = React.useState('');
  const [reportEndDate, setReportEndDate] = React.useState('');
  const [printReportData, setPrintReportData] = React.useState<ReportData | null>(null);

  React.useEffect(() => {
    const fetchEmployee = async () => {
      setLoading(true);
      setError(null);
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL;
        const response = await fetch(`${apiUrl}/api/profile/employee/${params.employeeId}`, {
          method: 'GET',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.error || `Server error: ${response.status}`);
        }

        const data = await response.json();
        setEmployee({
          ...data.employee,
          address: data.employee.address || 'N/A',
        });
      } catch (err) {
        console.error(err);
        setError(err instanceof Error ? err.message : 'Failed to fetch employee profile');
      } finally {
        setLoading(false);
      }
    };

    fetchEmployee();
  }, [params.employeeId]);

  React.useEffect(() => {
    if (printReportData) {
      window.print();
    }
  }, [printReportData]);

  const handleGenerateReport = async () => {
    if (!reportStartDate || !reportEndDate) {
      setError('Please select both start and end dates');
      return;
    }

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      const response = await fetch(
        `${apiUrl}/api/profile/employee/${params.employeeId}/report?startDate=${reportStartDate}&endDate=${reportEndDate}`,
        {
          method: 'GET',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
        }
      );

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `Server error: ${response.status}`);
      }

      const data = await response.json();
      setPrintReportData({
        startDate: reportStartDate,
        endDate: reportEndDate,
        range_customers: data.range_customers,
        range_accounts: data.range_accounts,
        range_transactions: data.range_transactions,
        transactions: data.transactions,
      });
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Failed to generate report');
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-LK');
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-LK', {
      style: 'currency',
      currency: 'LKR',
      minimumFractionDigits: 2,
    }).format(amount);

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('en-LK', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
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

  if (!employee)
    return <div className="text-center py-8 text-gray-500 text-sm">Employee not found</div>;

  return (
    <main className="flex-1 overflow-y-auto p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 space-y-4 sm:space-y-0">
          <div>
            <h1 className="text-3xl font-semibold text-gray-900">Employee Profile</h1>
            <p className="text-m text-gray-500">View employee details</p>
          </div>
          <Link href="/" passHref>
            <Button type="button" variant="danger" size="md" className="w-full mt-6">
              Back
            </Button>
          </Link>
        </header>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-2xl font-bold mb-4">
              {employee.first_name} {employee.last_name}
            </h2>
          </div>
          <div className="flex items-center gap-2 mb-4">
            <span
              className={`px-2 py-0.5 text-xs rounded-full ${
                employee.status === 'ACTIVE'
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-red-100 text-red-800'
              }`}
            >
              {employee.status}
            </span>
            <span
              className={`px-2 py-0.5 text-xs rounded-full bg-blue-100 text-blue-800`}
            >
              {employee.role}
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 text-sm text-gray-700">
            <p><span className="font-medium">Employee ID:</span> {employee.employee_id}</p>
            <p><span className="font-medium">NIC:</span> {employee.nic_number}</p>
            <p><span className="font-medium">Phone:</span> {employee.phone_number}</p>
            <p><span className="font-medium">Email:</span> {employee.email}</p>
            <p><span className="font-medium">Address:</span> {employee.address}</p>
            <p><span className="font-medium">Hire Date:</span> {formatDate(employee.hire_date)}</p>
            <p><span className="font-medium">Branch:</span> {employee.branch_name}</p>
            <p><span className="font-medium">Salary:</span> {formatCurrency(employee.salary)}</p>
          </div>
        </div>

        <div className="flex justify-between">
          <div className="bg-white w-[49%] rounded-lg shadow-sm p-6">
            <h2 className="text-2xl font-bold mb-4">Agent Statistics</h2>
            <div className="grid grid-cols-1 md:grid-cols-1 gap-x-6 gap-y-2 text-sm text-gray-700">
              <p><span className="font-medium">Total Number of Customers Created:</span> {employee.total_customers}</p>
              <p><span className="font-medium">Total Number of Accounts Created:</span> {employee.total_accounts}</p>
              <p><span className="font-medium">Total Number of Transactions Processed:</span> {employee.total_transactions}</p>
            </div>
          </div>
          <div className="bg-white w-[49%] rounded-lg shadow-sm p-6">
            <h2 className="text-2xl font-bold mb-4">Agent Report</h2>
            <div className="flex flex-wrap gap-4 mb-4 items-center">
              <input
                type="date"
                value={reportStartDate}
                onChange={(e) => setReportStartDate(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <input
                type="date"
                value={reportEndDate}
                onChange={(e) => setReportEndDate(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              /> 
            </div>
            <Button variant="primary" onClick={handleGenerateReport}>
              Generate Report
            </Button>
          </div>
        </div>
      </div>

      {/* Hidden Print Report */}
      {printReportData && employee && (
        <div className="hidden print:block">
          <style>{`
            @media print {
              body * { visibility: hidden; }
              .print-report-container, .print-report-container * { visibility: visible; }
              .print-report-container { position: absolute; left: 0; top: 0; width: 100%; font-size: 12px; }
              table { width: 100%; border-collapse: collapse; }
              th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
              th { background-color: #f2f2f2; }
            }
          `}</style>

          <div className="print-report-container">
            <div className="text-right mr-4 mt-4 text-2xl font-bold text-green-800 ml-4">
              B<span className="text-2xl font-normal">-TRUST</span>
            </div>
            <h1 className="text-2xl font-bold mb-4">Agent Report</h1>
            <p><strong>Employee:</strong> {employee.first_name} {employee.last_name}</p>
            <p><strong>Employee ID:</strong> {employee.employee_id}</p>
            <p><strong>NIC:</strong> {employee.nic_number}</p>
            <p><strong>Branch:</strong> {employee.branch_name}</p>

            <h2 className="text-l font-semibold mt-6">Statistics</h2>
            <p><strong>Total Customers Created:</strong> {employee.total_customers}</p>
            <p><strong>Total Accounts Created:</strong> {employee.total_accounts}</p>
            <p><strong>Total Transactions Processed:</strong> {employee.total_transactions}</p>
            
            <h2 className="text-l font-semibold mt-6">Date Range</h2>
            <p><strong>Customers Created:</strong> {printReportData.range_customers}</p>
            <p><strong>Transactions Processed:</strong> {printReportData.range_transactions}</p>
            <p><strong>Period:</strong> {printReportData.startDate} to {printReportData.endDate}</p>

            <h2 className="text-l font-semibold mt-6 mb-2">Transactions in Date Range</h2>
            <table>
              <thead>
                <tr>
                  <th>Date & Time</th>
                  <th>Type</th>
                  <th>Amount</th>
                  <th>Description</th>
                  <th>Account ID</th>
                  <th>Reference Number</th>
                </tr>
              </thead>
              <tbody>
                {printReportData.transactions.map((txn) => (
                  <tr key={txn.transaction_id}>
                    <td>{formatTimestamp(txn.time_date_stamp)}</td>
                    <td>{txn.transaction_type}</td>
                    <td>{formatCurrency(txn.amount)}</td>
                    <td>{txn.description}</td>
                    <td>{txn.account_id}</td>
                    <td>{txn.reference_number}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </main>
  );
};

export default EmployeeProfilePage;