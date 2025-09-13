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
        <h1 className="text-3xl font-semibold text-gray-900">Transaction History</h1>
        <p className="text-m text-gray-500">View detailed transaction history for accounts</p>
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

export default function TransactionHistoryPage() {
  const [filterForm, setFilterForm] = useState({
    accountNumber: '',
    customerName: '',
    transactionType: '',
    dateFrom: '',
    dateTo: '',
    amountFrom: '',
    amountTo: '',
    status: ''
  });

  const [transactions] = useState([
    {
      id: 'TXN001234567',
      date: '2024-08-20',
      time: '14:30:25',
      accountNumber: '1001234567',
      customerName: 'John Doe',
      type: 'Deposit',
      description: 'Cash Deposit',
      amount: '+25,000.00',
      balance: '45,250.00',
      status: 'Completed',
      reference: 'DEP12345678',
      channel: 'Branch',
      processedBy: 'Agent001'
    },
    {
      id: 'TXN001234566',
      date: '2024-08-19',
      time: '10:15:40',
      accountNumber: '1001234567',
      customerName: 'John Doe',
      type: 'Withdrawal',
      description: 'Cash Withdrawal',
      amount: '-5,000.00',
      balance: '20,250.00',
      status: 'Completed',
      reference: 'WTH12345679',
      channel: 'ATM',
      processedBy: 'System'
    },
    {
      id: 'TXN001234565',
      date: '2024-08-18',
      time: '09:45:15',
      accountNumber: '2001234567',
      customerName: 'Jane Smith',
      type: 'Transfer',
      description: 'Online Transfer to 3001234567',
      amount: '-15,000.00',
      balance: '113,750.00',
      status: 'Completed',
      reference: 'TRF12345680',
      channel: 'Online Banking',
      processedBy: 'System'
    },
    {
      id: 'TXN001234564',
      date: '2024-08-17',
      time: '16:20:30',
      accountNumber: '1001234567',
      customerName: 'John Doe',
      type: 'Interest',
      description: 'Monthly Interest Credit',
      amount: '+750.00',
      balance: '25,250.00',
      status: 'Completed',
      reference: 'INT12345681',
      channel: 'System',
      processedBy: 'System'
    },
    {
      id: 'TXN001234563',
      date: '2024-08-16',
      time: '11:30:20',
      accountNumber: '3001234567',
      customerName: 'Bob Johnson',
      type: 'Deposit',
      description: 'Cheque Deposit',
      amount: '+50,000.00',
      balance: '75,500.00',
      status: 'Pending',
      reference: 'CHQ12345682',
      channel: 'Branch',
      processedBy: 'Agent002'
    },
    {
      id: 'TXN001234562',
      date: '2024-08-15',
      time: '13:45:10',
      accountNumber: 'FD001234567',
      customerName: 'John Doe',
      type: 'Interest',
      description: 'Fixed Deposit Interest Payment',
      amount: '+11,875.00',
      balance: '511,875.00',
      status: 'Completed',
      reference: 'FDI12345683',
      channel: 'System',
      processedBy: 'System'
    }
  ]);

  const [selectedTransaction, setSelectedTransaction] = useState(transactions[0]);

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFilterForm({ ...filterForm, [e.target.name]: e.target.value });
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    alert('Search functionality would filter transactions based on criteria');
  };

  const clearFilters = () => {
    setFilterForm({
      accountNumber: '',
      customerName: '',
      transactionType: '',
      dateFrom: '',
      dateTo: '',
      amountFrom: '',
      amountTo: '',
      status: ''
    });
  };

  const exportTransactions = () => {
    alert('Exporting transactions to Excel/PDF');
  };

  const reverseTransaction = (transactionId: string) => {
    if (confirm(`Are you sure you want to reverse transaction ${transactionId}? This action cannot be undone.`)) {
      alert(`Transaction ${transactionId} has been reversed`);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed': return 'text-green-600 bg-green-50';
      case 'Pending': return 'text-yellow-600 bg-yellow-50';
      case 'Failed': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getAmountColor = (amount: string) => {
    return amount.startsWith('+') ? 'text-green-600' : 'text-red-600';
  };

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="mx-auto px-8 py-6 max-w-7xl">
        <Header activeTab="transactions" />
        
        <div className="bg-white rounded-lg border border-gray-200 p-8">
          {/* Filter Section */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Filter Transactions</h2>
            <form onSubmit={handleSearch}>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                <TextInput
                  label="Account Number"
                  name="accountNumber"
                  value={filterForm.accountNumber}
                  onChange={handleFilterChange}
                  placeholder="Enter account number"
                />
                <TextInput
                  label="Customer Name"
                  name="customerName"
                  value={filterForm.customerName}
                  onChange={handleFilterChange}
                  placeholder="Enter customer name"
                />
                <div>
                  <label className="block mb-2 text-gray-700 font-medium">Transaction Type</label>
                  <select
                    name="transactionType"
                    value={filterForm.transactionType}
                    onChange={handleFilterChange}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="">All Types</option>
                    <option value="Deposit">Deposit</option>
                    <option value="Withdrawal">Withdrawal</option>
                    <option value="Transfer">Transfer</option>
                    <option value="Interest">Interest</option>
                    <option value="Fee">Fee</option>
                  </select>
                </div>
                <div>
                  <label className="block mb-2 text-gray-700 font-medium">Status</label>
                  <select
                    name="status"
                    value={filterForm.status}
                    onChange={handleFilterChange}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="">All Status</option>
                    <option value="Completed">Completed</option>
                    <option value="Pending">Pending</option>
                    <option value="Failed">Failed</option>
                  </select>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                <div>
                  <label className="block mb-2 text-gray-700 font-medium">Date From</label>
                  <input
                    type="date"
                    name="dateFrom"
                    value={filterForm.dateFrom}
                    onChange={handleFilterChange}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block mb-2 text-gray-700 font-medium">Date To</label>
                  <input
                    type="date"
                    name="dateTo"
                    value={filterForm.dateTo}
                    onChange={handleFilterChange}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <TextInput
                  label="Amount From (LKR)"
                  name="amountFrom"
                  value={filterForm.amountFrom}
                  onChange={handleFilterChange}
                  placeholder="Min amount"
                />
                <TextInput
                  label="Amount To (LKR)"
                  name="amountTo"
                  value={filterForm.amountTo}
                  onChange={handleFilterChange}
                  placeholder="Max amount"
                />
              </div>

              <div className="flex space-x-4">
                <Button type="submit" className="bg-emerald-600 text-white">
                  Search Transactions
                </Button>
                <Button type="button" variant="secondary" onClick={clearFilters}>
                  Clear Filters
                </Button>
                <Button type="button" className="bg-blue-600 text-white" onClick={exportTransactions}>
                  Export Results
                </Button>
              </div>
            </form>
          </div>

          {/* Transaction Table */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Transaction Results</h2>
              <div className="text-sm text-gray-600">
                Showing {transactions.length} transactions
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border border-gray-300 px-4 py-3 text-left text-sm font-medium text-gray-700">Date/Time</th>
                    <th className="border border-gray-300 px-4 py-3 text-left text-sm font-medium text-gray-700">Account</th>
                    <th className="border border-gray-300 px-4 py-3 text-left text-sm font-medium text-gray-700">Customer</th>
                    <th className="border border-gray-300 px-4 py-3 text-left text-sm font-medium text-gray-700">Type</th>
                    <th className="border border-gray-300 px-4 py-3 text-left text-sm font-medium text-gray-700">Description</th>
                    <th className="border border-gray-300 px-4 py-3 text-right text-sm font-medium text-gray-700">Amount</th>
                    <th className="border border-gray-300 px-4 py-3 text-center text-sm font-medium text-gray-700">Status</th>
                    <th className="border border-gray-300 px-4 py-3 text-center text-sm font-medium text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((transaction, index) => (
                    <tr 
                      key={transaction.id} 
                      className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-emerald-50 cursor-pointer`}
                      onClick={() => setSelectedTransaction(transaction)}
                    >
                      <td className="border border-gray-300 px-4 py-3 text-sm">
                        <div>{transaction.date}</div>
                        <div className="text-gray-500">{transaction.time}</div>
                      </td>
                      <td className="border border-gray-300 px-4 py-3 text-sm font-medium">
                        {transaction.accountNumber}
                      </td>
                      <td className="border border-gray-300 px-4 py-3 text-sm">
                        {transaction.customerName}
                      </td>
                      <td className="border border-gray-300 px-4 py-3 text-sm">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          transaction.type === 'Deposit' ? 'bg-green-100 text-green-800' :
                          transaction.type === 'Withdrawal' ? 'bg-red-100 text-red-800' :
                          transaction.type === 'Transfer' ? 'bg-blue-100 text-blue-800' :
                          'bg-purple-100 text-purple-800'
                        }`}>
                          {transaction.type}
                        </span>
                      </td>
                      <td className="border border-gray-300 px-4 py-3 text-sm">
                        {transaction.description}
                      </td>
                      <td className={`border border-gray-300 px-4 py-3 text-sm font-semibold text-right ${getAmountColor(transaction.amount)}`}>
                        LKR {transaction.amount}
                      </td>
                      <td className="border border-gray-300 px-4 py-3 text-center">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(transaction.status)}`}>
                          {transaction.status}
                        </span>
                      </td>
                      <td className="border border-gray-300 px-4 py-3 text-center">
                        <Button
                          type="button"
                          size="sm"
                          variant="secondary"
                          
                        >
                          View
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Transaction Details */}
          {selectedTransaction && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-emerald-50 p-6 rounded-lg border border-emerald-200">
                <h3 className="font-semibold text-gray-800 mb-4">Transaction Details</h3>
                <div className="space-y-3 text-sm">
                  <div className="grid grid-cols-2 gap-2">
                    <span className="font-medium">Transaction ID:</span>
                    <span className="font-mono">{selectedTransaction.id}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <span className="font-medium">Reference:</span>
                    <span className="font-mono">{selectedTransaction.reference}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <span className="font-medium">Date & Time:</span>
                    <span>{selectedTransaction.date} {selectedTransaction.time}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <span className="font-medium">Account Number:</span>
                    <span className="font-mono">{selectedTransaction.accountNumber}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <span className="font-medium">Customer Name:</span>
                    <span>{selectedTransaction.customerName}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <span className="font-medium">Transaction Type:</span>
                    <span>{selectedTransaction.type}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <span className="font-medium">Description:</span>
                    <span>{selectedTransaction.description}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <span className="font-medium">Amount:</span>
                    <span className={`font-semibold ${getAmountColor(selectedTransaction.amount)}`}>
                      LKR {selectedTransaction.amount}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <span className="font-medium">Balance After:</span>
                    <span className="font-semibold">LKR {selectedTransaction.balance}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <span className="font-medium">Status:</span>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(selectedTransaction.status)}`}>
                      {selectedTransaction.status}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
                  <h3 className="font-semibold text-gray-800 mb-4">Processing Information</h3>
                  <div className="space-y-3 text-sm">
                    <div className="grid grid-cols-2 gap-2">
                      <span className="font-medium">Channel:</span>
                      <span>{selectedTransaction.channel}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <span className="font-medium">Processed By:</span>
                      <span>{selectedTransaction.processedBy}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <span className="font-medium">Processing Time:</span>
                      <span>2.3 seconds</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <span className="font-medium">IP Address:</span>
                      <span>192.168.1.100</span>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                  <h3 className="font-semibold text-gray-800 mb-4">Available Actions</h3>
                  <div className="space-y-3">
                    <Button type="button" className="w-full bg-blue-600 text-white">
                      Print Transaction Receipt
                    </Button>
                    <Button type="button" variant="secondary" className="w-full">
                      Email Transaction Details
                    </Button>
                    <Button type="button" variant="secondary" className="w-full">
                      View Related Transactions
                    </Button>
                    {selectedTransaction.status === 'Completed' && selectedTransaction.type !== 'Interest' && (
                      <Button 
                        type="button" 
                        variant="danger" 
                        className="w-full"
                        onClick={() => reverseTransaction(selectedTransaction.id)}
                      >
                        Reverse Transaction
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}