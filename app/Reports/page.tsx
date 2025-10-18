'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { Button } from '@/app/components/ui/Button';
import ReportPrint from '@/app/components/ReportPrint';

interface HeaderProps {
  activeTab: string;
}

const Header: React.FC<HeaderProps> = ({ activeTab }) => {
  return (
    <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 space-y-4 sm:space-y-0">
      <div>
        <h1 className="text-3xl font-semibold text-gray-900">Generate Reports</h1>
        <p className="text-m text-gray-500">Generate detailed reports on transactions and accounts</p>
      </div>
      <div className="flex items-center space-x-4">
        <Link href="/" passHref>
          <Button type="button" variant="danger" size="md" className="w-full mt-6">
            Back to Dashboard
          </Button>
        </Link>
      </div>
    </header>
  );
};

interface Branch {
  branch_id: string;
  branch_name: string;
}

interface ReportData {
  data: any[];
  totals: any;
  additionalData?: any[];
}

export default function ViewReportsPage() {
  const [reportForm, setReportForm] = useState({
    reportType: '',
    dateFrom: '',
    dateTo: '',
    branchId: '',
    transactionType: '',
    email: ''
  });
  const [branches, setBranches] = useState<Branch[]>([]);
  const [reportData, setReportData] = useState<ReportData | null>(null);

  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL;
        const res = await fetch(`${apiUrl}/api/branches`, {
          credentials: 'include',
        });
        const data = await res.json();
        setBranches(data.branches || []);
      } catch (err) {
        console.error('Failed to fetch branches', err);
      }
    };
    fetchBranches();
  }, []);

  const reportTypes = [
    { id: 'transaction-summary', name: 'Transaction Summary', description: 'Summary of transactions in the given date range' },
    { id: 'active-fixed-deposits', name: 'Active Fixed Deposits', description: 'List of active FDs and their next interest payout dates' },
    { id: 'savings-interest-payment', name: 'Saving Interest Payment Report', description: 'Savings Interest payments made in specified period' },
    { id: 'fd-interest-payment', name: 'FD Interest Payment Report', description: 'FD Interest payments made in specified period' },
    { id: 'interest-distribution-summary', name: 'Interest Distribution Summary', description: 'Interest distribution summary by account type' }
  ];

  const handleFormChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
    setReportForm({ ...reportForm, [e.target.name]: e.target.value });
  };

  const generateReport = async (e: React.FormEvent) => {
    e.preventDefault();
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    try {
      const res = await fetch(`${apiUrl}/api/reports/generate`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reportForm),
      });
      if (!res.ok) {
        throw new Error('Failed to generate report');
      }
      const report = await res.json();
      setReportData(report);
    } catch (err) {
      console.error('Error generating report:', err);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const requiresDateRange = ['transaction-summary', 'savings-interest-payment', 'fd-interest-payment', 'interest-distribution-summary'].includes(reportForm.reportType);
  const requiresTransactionType = reportForm.reportType === 'transaction-summary';

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="mx-auto px-8 py-6 max-w-7xl">
        <Header activeTab="generate" />

        <div className="bg-white rounded-lg border border-gray-200 p-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Generate New Report</h2>

          <form onSubmit={generateReport}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-6">
                {/* Report Type */}
                <div>
                  <label className="block mb-2 text-gray-700 font-medium">Report Type</label>
                  <select
                    name="reportType"
                    value={reportForm.reportType}
                    onChange={handleFormChange}
                    required
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="">Select Report Type</option>
                    {reportTypes.map(type => (
                      <option key={type.id} value={type.id}>{type.name}</option>
                    ))}
                  </select>
                </div>

                {/* Report Description */}
                {reportForm.reportType && (
                  <div className="bg-emerald-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-gray-800 mb-2">Report Description</h4>
                    <p className="text-sm text-gray-700">
                      {reportTypes.find(r => r.id === reportForm.reportType)?.description}
                    </p>
                  </div>
                )}

                {/* Date Range */}
                {requiresDateRange && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block mb-2 text-gray-700 font-medium">Date From</label>
                      <input
                        type="date"
                        name="dateFrom"
                        value={reportForm.dateFrom}
                        onChange={handleFormChange}
                        required
                        className="w-full px-4 py-2 rounded-lg border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block mb-2 text-gray-700 font-medium">Date To</label>
                      <input
                        type="date"
                        name="dateTo"
                        value={reportForm.dateTo}
                        onChange={handleFormChange}
                        required
                        className="w-full px-4 py-2 rounded-lg border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  </div>
                )}

                {/* Branch */}
                <div>
                  <label className="block mb-2 text-gray-700 font-medium">Branch</label>
                  <select
                    name="branchId"
                    value={reportForm.branchId}
                    onChange={handleFormChange}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="">All Branches</option>
                    {branches.map((branch: Branch) => (
                      <option key={branch.branch_id} value={branch.branch_id}>{branch.branch_name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-6">
                {/* Transaction Type */}
                {requiresTransactionType && (
                  <div>
                    <label className="block mb-2 text-gray-700 font-medium">Transaction Type (Optional)</label>
                    <select
                      name="transactionType"
                      value={reportForm.transactionType}
                      onChange={handleFormChange}
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="">All Transaction Types</option>
                      <option value="deposit">Deposits</option>
                      <option value="withdrawal">Withdrawals</option>
                      <option value="transfer">Transfers</option>
                      <option value="fdinterest">FD Interest Payments</option>
                      <option value="savingsinterest">Savings Interest Payments</option>
                    </select>
                  </div>
                )}

                {/* Email */}
                <div>
                  <label className="block mb-2 text-gray-700 font-medium">Email Report To (Optional)</label>
                  <input
                    type="email"
                    name="email"
                    value={reportForm.email}
                    onChange={handleFormChange}
                    placeholder="Enter email address"
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>
            </div>

            {/* Submit */}
            <div className="flex justify-end space-x-4 mt-8 pt-6 border-t border-gray-300">
              <Button
                type="submit"
                disabled={!reportForm.reportType || (requiresDateRange && (!reportForm.dateFrom || !reportForm.dateTo))}
                className={`bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-700 ${(!reportForm.reportType || (requiresDateRange && (!reportForm.dateFrom || !reportForm.dateTo))) ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                Generate Report
              </Button>
            </div>
          </form>
        </div>

        {reportData && (
          <div className="mt-8">
            <style jsx global>{`
              @media print {
                body * {
                  visibility: hidden;
                }
                #print-content, #print-content * {
                  visibility: visible;
                }
                #print-content {
                  position: absolute;
                  left: 0;
                  top: 0;
                  width: 100%;
                }
              }
            `}</style>
            <div className="flex justify-end mb-4">
              <Button
                onClick={handlePrint}
                className="bg-blue-600 text-white border-blue-600 hover:bg-blue-700"
              >
                Print Report
              </Button>
            </div>
            <div id="print-content">
              <ReportPrint 
                reportType={reportForm.reportType}
                fromDate={reportForm.dateFrom}
                toDate={reportForm.dateTo}
                branchName={branches.find((b: Branch) => b.branch_id === reportForm.branchId)?.branch_name || 'All Branches'}
                data={reportData.data}
                totals={reportData.totals}
                additionalData={reportData.additionalData}
              />
            </div>
          </div>
        )}
      </div>
    </main>
  );
}