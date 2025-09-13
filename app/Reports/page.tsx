'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Button } from '@/app/components/ui/Button';
import { TextInput } from '@/app/components/ui/TextInput';

interface HeaderProps {
  activeTab: string;
}

const Header: React.FC<HeaderProps> = ({ activeTab }) => {
  return (
    <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 space-y-4 sm:space-y-0">
      <div>
        <h1 className="text-3xl font-semibold text-gray-900">View Reports</h1>
        <p className="text-m text-gray-500">Generate and view detailed reports on transactions and accounts</p>
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

export default function ViewReportsPage() {
  const [activeTab, setActiveTab] = useState<'generate' | 'saved' | 'scheduled'>('generate');
  const [reportForm, setReportForm] = useState({
    reportType: '',
    dateFrom: '',
    dateTo: '',
    accountNumber: '',
    branchCode: '',
    customerType: '',
    transactionType: '',
    amountRange: '',
    format: 'pdf',
    email: '',
    reportName: ''
  });

  const [savedReports] = useState([
    {
      id: 'RPT001',
      name: 'Daily Transaction Summary',
      type: 'Transaction Report',
      dateGenerated: '2024-08-20 09:00',
      period: '2024-08-19 to 2024-08-19',
      size: '2.3 MB',
      format: 'PDF',
      status: 'Completed'
    },
    {
      id: 'RPT002',
      name: 'Weekly Account Summary',
      type: 'Account Report',
      dateGenerated: '2024-08-18 10:30',
      period: '2024-08-12 to 2024-08-18',
      size: '5.7 MB',
      format: 'Excel',
      status: 'Completed'
    },
    {
      id: 'RPT003',
      name: 'Fixed Deposit Maturity Report',
      type: 'FD Report',
      dateGenerated: '2024-08-17 14:15',
      period: '2024-09-01 to 2024-12-31',
      size: '1.8 MB',
      format: 'PDF',
      status: 'Completed'
    }
  ]);

  const reportTypes = [
    { id: 'daily-transactions', name: 'Daily Transaction Summary', description: 'Summary of all transactions for a specific day' },
    { id: 'account-balance', name: 'Account Balance Report', description: 'Current balance status of all accounts' },
    { id: 'customer-statement', name: 'Customer Statement', description: 'Detailed statement for specific customers' },
    { id: 'fd-maturity', name: 'Fixed Deposit Maturity', description: 'FDs maturing in specified period' },
    { id: 'transaction-volume', name: 'Transaction Volume Analysis', description: 'Analysis of transaction patterns and volumes' },
    { id: 'inactive-accounts', name: 'Inactive Accounts Report', description: 'Accounts with no activity in specified period' },
    { id: 'interest-payment', name: 'Interest Payment Report', description: 'Interest payments made in specified period' },
    { id: 'audit-trail', name: 'Audit Trail Report', description: 'Comprehensive audit trail for compliance' }
  ];

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setReportForm({ ...reportForm, [e.target.name]: e.target.value });
  };

  const generateReport = (e: React.FormEvent) => {
    e.preventDefault();
    alert(`Generating ${reportTypes.find(r => r.id === reportForm.reportType)?.name} report...`);
  };

  const downloadReport = (reportId: string) => {
    alert(`Downloading report ${reportId}`);
  };

  const previewReport = (reportId: string) => {
    alert(`Opening preview for report ${reportId}`);
  };

  const deleteReport = (reportId: string) => {
    if (confirm(`Are you sure you want to delete report ${reportId}?`)) {
      alert(`Report ${reportId} deleted`);
    }
  };

  const scheduleReport = () => {
    alert('Report scheduling functionality would be implemented here');
  };

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="mx-auto px-8 py-6 max-w-7xl">
        <Header activeTab="reports" />
        
        {/* Tab Navigation */}
        <div className="mb-6 border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('generate')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'generate' 
                ? 'border-emerald-500 text-emerald-600' 
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
            >
              Generate Reports
            </button>
            <button
              onClick={() => setActiveTab('saved')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'saved' 
                ? 'border-emerald-500 text-emerald-600' 
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
            >
              Saved Reports
            </button>
            <button
              onClick={() => setActiveTab('scheduled')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'scheduled' 
                ? 'border-emerald-500 text-emerald-600' 
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
            >
              Scheduled Reports
            </button>
          </nav>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-8">
          
          {/* Generate Reports Tab */}
          {activeTab === 'generate' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Generate New Report</h2>
              </div>

              <form onSubmit={generateReport}>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="space-y-6">
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

                    {reportForm.reportType && (
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <h4 className="font-semibold text-gray-800 mb-2">Report Description</h4>
                        <p className="text-sm text-gray-700">
                          {reportTypes.find(r => r.id === reportForm.reportType)?.description}
                        </p>
                      </div>
                    )}

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

                    <TextInput
                      label="Account Number (Optional)"
                      name="accountNumber"
                      value={reportForm.accountNumber}
                      onChange={handleFormChange}
                      placeholder="Leave blank for all accounts"
                    />

                    <TextInput
                      label="Branch Code (Optional)"
                      name="branchCode"
                      value={reportForm.branchCode}
                      onChange={handleFormChange}
                      placeholder="Leave blank for all branches"
                    />
                  </div>

                  <div className="space-y-6">
                    <div>
                      <label className="block mb-2 text-gray-700 font-medium">Customer Type (Optional)</label>
                      <select
                        name="customerType"
                        value={reportForm.customerType}
                        onChange={handleFormChange}
                        className="w-full px-4 py-2 rounded-lg border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      >
                        <option value="">All Customer Types</option>
                        <option value="individual">Individual</option>
                        <option value="corporate">Corporate</option>
                        <option value="senior">Senior Citizen</option>
                      </select>
                    </div>

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
                        <option value="interest">Interest Payments</option>
                      </select>
                    </div>

                    <div>
                      <label className="block mb-2 text-gray-700 font-medium">Amount Range (Optional)</label>
                      <select
                        name="amountRange"
                        value={reportForm.amountRange}
                        onChange={handleFormChange}
                        className="w-full px-4 py-2 rounded-lg border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      >
                        <option value="">All Amounts</option>
                        <option value="0-10000">LKR 0 - 10,000</option>
                        <option value="10000-50000">LKR 10,000 - 50,000</option>
                        <option value="50000-100000">LKR 50,000 - 100,000</option>
                        <option value="100000+">Above LKR 100,000</option>
                      </select>
                    </div>

                    <div>
                      <label className="block mb-2 text-gray-700 font-medium">Output Format</label>
                      <select
                        name="format"
                        value={reportForm.format}
                        onChange={handleFormChange}
                        required
                        className="w-full px-4 py-2 rounded-lg border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      >
                        <option value="pdf">PDF Document</option>
                        <option value="excel">Excel Spreadsheet</option>
                        <option value="csv">CSV File</option>
                      </select>
                    </div>

                    <TextInput
                      label="Email Report To (Optional)"
                      type="email"
                      name="email"
                      value={reportForm.email}
                      onChange={handleFormChange}
                      placeholder="Enter email address"
                    />

                    <TextInput
                      label="Report Name"
                      name="reportName"
                      value={reportForm.reportName}
                      onChange={handleFormChange}
                      required
                      placeholder="Enter custom report name"
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-4 mt-8 pt-6 border-t border-gray-300">
                  <Button type="button" variant="secondary" onClick={scheduleReport}>
                    Schedule Report
                  </Button>
                  <Button type="button" variant="secondary">
                    Save as Template
                  </Button>
                  <Button
                    type="submit"
                    disabled={!reportForm.reportType || !reportForm.dateFrom || !reportForm.dateTo || !reportForm.reportName}
                    className={`bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-700 ${(!reportForm.reportType || !reportForm.dateFrom || !reportForm.dateTo || !reportForm.reportName) ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    Generate Report
                  </Button>
                </div>
              </form>
            </div>
          )}

          {/* Saved Reports Tab */}
          {activeTab === 'saved' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-900">Saved Reports</h2>
                <Button type="button" className="bg-red-600 text-white">
                  Clear All Reports
                </Button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-300">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="border border-gray-300 px-4 py-3 text-left text-sm font-medium text-gray-700">Report Name</th>
                      <th className="border border-gray-300 px-4 py-3 text-left text-sm font-medium text-gray-700">Type</th>
                      <th className="border border-gray-300 px-4 py-3 text-left text-sm font-medium text-gray-700">Generated</th>
                      <th className="border border-gray-300 px-4 py-3 text-left text-sm font-medium text-gray-700">Period</th>
                      <th className="border border-gray-300 px-4 py-3 text-left text-sm font-medium text-gray-700">Size</th>
                      <th className="border border-gray-300 px-4 py-3 text-left text-sm font-medium text-gray-700">Format</th>
                      <th className="border border-gray-300 px-4 py-3 text-center text-sm font-medium text-gray-700">Status</th>
                      <th className="border border-gray-300 px-4 py-3 text-center text-sm font-medium text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {savedReports.map((report, index) => (
                      <tr key={report.id} className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-emerald-50`}>
                        <td className="border border-gray-300 px-4 py-3 text-sm font-medium">
                          {report.name}
                        </td>
                        <td className="border border-gray-300 px-4 py-3 text-sm">
                          {report.type}
                        </td>
                        <td className="border border-gray-300 px-4 py-3 text-sm">
                          {report.dateGenerated}
                        </td>
                        <td className="border border-gray-300 px-4 py-3 text-sm">
                          {report.period}
                        </td>
                        <td className="border border-gray-300 px-4 py-3 text-sm">
                          {report.size}
                        </td>
                        <td className="border border-gray-300 px-4 py-3 text-sm">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            report.format === 'PDF' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                          }`}>
                            {report.format}
                          </span>
                        </td>
                        <td className="border border-gray-300 px-4 py-3 text-center">
                          <span className="px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800">
                            {report.status}
                          </span>
                        </td>
                        <td className="border border-gray-300 px-4 py-3 text-center">
                          <div className="flex space-x-1 justify-center">
                            <Button
                              type="button"
                              size="sm"
                              variant="secondary"
                              onClick={() => previewReport(report.id)}
                            >
                              Preview
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              className="bg-blue-600 text-white"
                              onClick={() => downloadReport(report.id)}
                            >
                              Download
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="danger"
                              onClick={() => deleteReport(report.id)}
                            >
                              Delete
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="font-semibold text-gray-800 mb-3">Report Statistics</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-white p-4 rounded border">
                    <div className="text-2xl font-bold text-blue-600">12</div>
                    <div className="text-sm text-gray-600">Total Reports</div>
                  </div>
                  <div className="bg-white p-4 rounded border">
                    <div className="text-2xl font-bold text-green-600">45.8 MB</div>
                    <div className="text-sm text-gray-600">Total Size</div>
                  </div>
                  <div className="bg-white p-4 rounded border">
                    <div className="text-2xl font-bold text-purple-600">3</div>
                    <div className="text-sm text-gray-600">This Week</div>
                  </div>
                  <div className="bg-white p-4 rounded border">
                    <div className="text-2xl font-bold text-orange-600">7 Days</div>
                    <div className="text-sm text-gray-600">Retention Period</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Scheduled Reports Tab */}
          {activeTab === 'scheduled' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-900">Scheduled Reports</h2>
                <Button type="button" className="bg-emerald-600 text-white">
                  Create New Schedule
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-emerald-50 p-6 rounded-lg border border-emerald-200">
                  <h3 className="font-semibold text-gray-800 mb-3">Daily Transaction Summary</h3>
                  <div className="space-y-2 text-sm text-gray-700">
                    <div><strong>Frequency:</strong> Daily at 9:00 AM</div>
                    <div><strong>Recipients:</strong> manager@bank.com</div>
                    <div><strong>Format:</strong> PDF</div>
                    <div><strong>Last Run:</strong> 2024-08-20 09:00</div>
                    <div><strong>Next Run:</strong> 2024-08-21 09:00</div>
                    <div><strong>Status:</strong> <span className="text-green-600">Active</span></div>
                  </div>
                  <div className="flex space-x-2 mt-4">
                    <Button type="button" size="sm" variant="secondary">Edit</Button>
                    <Button type="button" size="sm" variant="danger">Pause</Button>
                  </div>
                </div>

                <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
                  <h3 className="font-semibold text-gray-800 mb-3">Weekly Account Summary</h3>
                  <div className="space-y-2 text-sm text-gray-700">
                    <div><strong>Frequency:</strong> Weekly (Monday) at 8:00 AM</div>
                    <div><strong>Recipients:</strong> accounts@bank.com</div>
                    <div><strong>Format:</strong> Excel</div>
                    <div><strong>Last Run:</strong> 2024-08-19 08:00</div>
                    <div><strong>Next Run:</strong> 2024-08-26 08:00</div>
                    <div><strong>Status:</strong> <span className="text-green-600">Active</span></div>
                  </div>
                  <div className="flex space-x-2 mt-4">
                    <Button type="button" size="sm" variant="secondary">Edit</Button>
                    <Button type="button" size="sm" variant="danger">Pause</Button>
                  </div>
                </div>

                <div className="bg-yellow-50 p-6 rounded-lg border border-yellow-200">
                  <h3 className="font-semibold text-gray-800 mb-3">Monthly FD Maturity</h3>
                  <div className="space-y-2 text-sm text-gray-700">
                    <div><strong>Frequency:</strong> Monthly (1st) at 10:00 AM</div>
                    <div><strong>Recipients:</strong> fd@bank.com</div>
                    <div><strong>Format:</strong> PDF</div>
                    <div><strong>Last Run:</strong> 2024-08-01 10:00</div>
                    <div><strong>Next Run:</strong> 2024-09-01 10:00</div>
                    <div><strong>Status:</strong> <span className="text-orange-600">Paused</span></div>
                  </div>
                  <div className="flex space-x-2 mt-4">
                    <Button type="button" size="sm" variant="secondary">Edit</Button>
                    <Button type="button" size="sm" className="bg-green-600 text-white">Resume</Button>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="font-semibold text-gray-800 mb-3">Schedule Management</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium text-gray-700 mb-2">Active Schedules</h4>
                    <div className="text-3xl font-bold text-green-600">2</div>
                    <div className="text-sm text-gray-600">Reports running automatically</div>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-700 mb-2">Paused Schedules</h4>
                    <div className="text-3xl font-bold text-orange-600">1</div>
                    <div className="text-sm text-gray-600">Reports temporarily disabled</div>
                  </div>
                </div>
                <div className="mt-4 p-4 bg-blue-50 rounded border-l-4 border-blue-500">
                  <div className="font-medium text-blue-800">Next Scheduled Report</div>
                  <div className="text-sm text-blue-600">Daily Transaction Summary - Tomorrow at 9:00 AM</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}