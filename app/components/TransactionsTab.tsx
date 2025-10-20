// components/TransactionsTab.tsx
import React, { useState, useEffect } from 'react';
import { Button } from './ui/Button';
import { Printer } from 'lucide-react';
import TransactionReceiptPrint from './TransactionReceiptPrint';

interface Transaction {
  transaction_id: string;
  account_id: string;
  transaction_type: string;
  amount: number;
  balance_before: number;
  time_date_stamp: string;
  description: string;
  status: string;
  reference_number: string;
  employee_id?: string;
  employee_name?: string;
  customer_name?: string;
  branch_name?: string;
}

interface TransactionsTabProps {
  filterType: string;
  setFilterType: (type: string) => void;
  searchField: "customer" | "account" | "ref" | "date";
  setSearchField: (field: "customer" | "account" | "ref" | "date") => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

export const TransactionsTab: React.FC<TransactionsTabProps> = ({
  filterType,
  setFilterType,
  searchField,
  setSearchField,
  searchQuery,
  setSearchQuery,
}) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedTxns, setExpandedTxns] = useState<{ [key: string]: boolean }>({});
  const [printData, setPrintData] = useState<any>(null);
  const [total, setTotal] = useState(0);
  const [currentEmployeeId, setCurrentEmployeeId] = useState<string | null>(null);

  // New state for date range
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/auth/me`, { credentials: 'include' });
        if (!res.ok) throw new Error('Failed to fetch user');
        const data = await res.json();
        setCurrentEmployeeId(data.employee_id);
      } catch (err) {
        console.error('Error fetching user:', err);
      }
    };

    fetchUser();
    fetchTransactions();
  }, []);

  useEffect(() => {
    if (printData) {
      window.print();
    }
  }, [printData]);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/transactions/all`, {
        credentials: 'include'
      });
      const data = await response.json();
      
      if (data.error) {
        console.error('Error fetching transactions:', data.error);
      } else {
        const sorted = data.sort((a: Transaction, b: Transaction) => 
          new Date(b.time_date_stamp).getTime() - new Date(a.time_date_stamp).getTime()
        );
        setTransactions(sorted);
        setTotal(sorted.length);
      }
    } catch (err) {
      console.error('Error fetching transactions:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleExpanded = (txnId: string) => {
    setExpandedTxns(prev => ({
      ...prev,
      [txnId]: !prev[txnId]
    }));
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);

    return date.toLocaleString('en-LK', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-LK', { 
      style: 'currency', 
      currency: 'LKR',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const getTransactionTypeDisplay = (type: string) => {
    const typeMap: { [key: string]: string } = {
      'INITIAL': 'Initial Deposit',
      'DEPOSIT': 'Deposit',
      'WITHDRAWAL': 'Withdrawal',
      'FD_INTEREST': 'FD Interest',
      'SAVINGS_INTEREST': 'Savings Interest',
      'TRANSFER_IN': 'Transfer In',
      'TRANSFER_OUT': 'Transfer Out'
    };
    return typeMap[type] || type;
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'DEPOSIT':
      case 'INITIAL':
      case 'TRANSFER_IN':
        return 'text-emerald-600';
      case 'WITHDRAWAL':
      case 'TRANSFER_OUT':
        return 'text-amber-600';
      case 'FD_INTEREST':
      case 'SAVINGS_INTEREST':
        return 'text-blue-600';
      default:
        return 'text-gray-600';
    }
  };

  const handlePrint = async (txn: Transaction) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/transactions/${txn.transaction_id}/full`, {
        credentials: 'include'
      });

      if (!response.ok) {
        let errorMsg = 'Error fetching transaction details';
        try {
          const errorData = await response.json();
          errorMsg = errorData.error || errorMsg;
        } catch {}
        alert(errorMsg);
        return;
      }

      const data = await response.json();

      if (data.error) {
        alert('Error fetching transaction details');
        return;
      }

      setPrintData(data);
    } catch (err) {
      console.error('Error preparing print:', err);
      alert('Failed to prepare print');
    }
  };

  const filteredTransactions = transactions.filter((txn) => {
    let matchesFilter = true;

    // Type filters
    if (filterType === "Processed by me") {
      matchesFilter = !!currentEmployeeId && txn.employee_id === currentEmployeeId;
    } else if (filterType !== "All") {
      if (filterType === "Deposit" && !['DEPOSIT', 'INITIAL', 'TRANSFER_IN'].includes(txn.transaction_type)) {
        matchesFilter = false;
      }
      if (filterType === "Initial Deposit" && txn.transaction_type !== 'INITIAL') {
        matchesFilter = false;
      }
      if (filterType === "Withdrawal" && !['WITHDRAWAL', 'TRANSFER_OUT'].includes(txn.transaction_type)) {
        matchesFilter = false;
      }
      if (filterType === "Transfer" && !['TRANSFER_IN', 'TRANSFER_OUT'].includes(txn.transaction_type)) {
        matchesFilter = false;
      }
      if (filterType === "FD Interest" && txn.transaction_type !== 'FD_INTEREST') {
        matchesFilter = false;
      }
      if (filterType === "Savings Interest" && txn.transaction_type !== 'SAVINGS_INTEREST') {
        matchesFilter = false;
      }
    }

    if (!matchesFilter) return false;

    // Search filters
    const query = searchQuery.toLowerCase();

    if (searchField === "date") {
      const txnDate = new Date(txn.time_date_stamp);
      let afterStart = true;
      if (startDate) {
        afterStart = txnDate >= new Date(`${startDate}T00:00:00`);
      }
      let beforeEnd = true;
      if (endDate) {
        beforeEnd = txnDate <= new Date(`${endDate}T23:59:59.999`);
      }
      return afterStart && beforeEnd;
    }

    if (!searchQuery) return true;

    switch (searchField) {
      case "customer":
        return txn.customer_name?.toLowerCase().includes(query) || false;
      case "account":
        return txn.account_id.toLowerCase().includes(query);
      case "ref":
        return txn.reference_number.toLowerCase().includes(query);
      default:
        return true;
    }
  });

  return (
    <div className="flex flex-col h-[calc(100vh-135px)]">
      {/* Sticky Header Section */}
      <div className="bg-white sticky top-0 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium text-gray-600">Transaction Lookup</h2>
          <span className="text-xs text-gray-400">
            {total} {total === 1 ? 'transaction' : 'transactions'} found
          </span>
        </div>

        {/* Filter Buttons */}
        <div className="flex flex-wrap gap-2">
          {['All', 'Deposit', 'Initial Deposit', 'Withdrawal', 'Transfer', 'FD Interest', 'Savings Interest', 'Processed by me'].map((type) => (
            <Button
              key={type}
              variant="filter"
              active={filterType === type}
              onClick={() => setFilterType(type)}
            >
              {type}
            </Button>
          ))}
        </div>

        {/* Search Bar */}
        <div className="flex flex-wrap gap-2 items-center">
          <select
            value={searchField}
            onChange={(e) => setSearchField(e.target.value as "customer" | "account" | "ref" | "date")}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="customer">Customer Name</option>
            <option value="account">Account Number</option>
            <option value="ref">Reference Number</option>
            <option value="date">Date</option>
          </select>
          {searchField === "date" ? (
            <div className="flex gap-2 flex-1">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          ) : (
            <input
              type="text"
              placeholder={`Search by ${searchField}`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm flex-1 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          )}
        </div>
      </div>

      {/* Scrollable Transactions List */}
      <div className="flex-1 overflow-y-auto mt-4 pr-2">
        {loading && (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
          </div>
        )}

        {!loading && (
          <div className="space-y-4">
            {filteredTransactions.length === 0 ? (
              <div className="text-center py-8 text-gray-500 text-sm">
                No transactions found matching your criteria
              </div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200 bg-white shadow-sm rounded-lg">
                <thead className="bg-gray-50 sticky top-0 z-10">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[15%]">Date & Time</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[20%]">Customer Name</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[10%]">Account</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[10%]">Type</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[10%]">Amount</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[15%]">Reference</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[10%]">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredTransactions.map((txn) => (
                    <React.Fragment key={txn.transaction_id}>
                      <tr className="hover:bg-gray-50">
                        <td className="px-4 py-2 whitespace-nowrap text-xs text-gray-900 w-[15%]">{formatDate(txn.time_date_stamp)}</td>
                        <td className="px-4 py-2 whitespace-nowrap text-xs text-gray-900 w-[20%]">{txn.customer_name || 'N/A'}</td>
                        <td className="px-4 py-2 whitespace-nowrap text-xs text-gray-900 w-[10%]">{txn.account_id}</td>
                        <td className="px-4 py-2 whitespace-nowrap w-[10%]">
                          <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${getTypeColor(txn.transaction_type)} bg-opacity-10`}>
                            {getTransactionTypeDisplay(txn.transaction_type)}
                          </span>
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-xs w-[10%]">
                          <span className={`font-semibold ${getTypeColor(txn.transaction_type)}`}>
                            {formatCurrency(txn.amount)}
                          </span>
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-xs text-gray-900 w-[15%]">{txn.reference_number}</td>
                        <td className="px-4 py-2 whitespace-nowrap text-xs text-gray-900 w-[10%]">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handlePrint(txn)}
                              className="p-2 hover:bg-gray-100 cursor-pointer rounded-lg transition"
                              title="Print Receipt"
                            >
                              <Printer className="w-4 h-4 text-gray-600" />
                            </button>
                            <button
                              onClick={() => toggleExpanded(txn.transaction_id)}
                              className="text-gray-500 hover:text-gray-700 cursor-pointer px-2"
                            >
                              {expandedTxns[txn.transaction_id] ? '▲' : '▼'}
                            </button>
                          </div>
                        </td>
                      </tr>
                      {expandedTxns[txn.transaction_id] && (
                        <tr>
                          <td colSpan={7} className="px-4 py-4 bg-gray-50">
                            <div className="text-xs text-gray-700">
                              <div className="rounded-lg p-2 bg-gray-50">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1">
                                  <p>
                                    <span className="font-medium">Transaction ID:</span> {txn.transaction_id}
                                  </p>
                                  <p>
                                    <span className="font-medium">Status:</span>{' '}
                                    <span className={`${txn.status === 'SUCCESS' ? 'text-emerald-600' : 'text-red-600'} font-medium`}>
                                      {txn.status}
                                    </span>
                                  </p>
                                  <p>
                                    <span className="font-medium">Processed By:</span> {txn.employee_name || 'System'}
                                  </p>
                                  <p>
                                    <span className="font-medium">Employee ID:</span> {txn.employee_id || 'N/A'}
                                  </p>
                                  <p>
                                    <span className="font-medium">Branch:</span> {txn.branch_name || 'N/A'}
                                  </p>
                                  <p>
                                    <span className="font-medium">Balance Before:</span> {formatCurrency(txn.balance_before)}
                                  </p>
                                  <p className="col-span-2">
                                    <span className="font-medium">Description:</span> {txn.description}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>

      {/* Hidden Print Components - Render only when printing */}
      {printData && (
        <div className="hidden print:block">
          <style>{`
            @media print {
              body * {
                visibility: hidden;
              }
              .print-container, .print-container * {
                visibility: visible;
              }
              .print-container {
                position: absolute;
                left: 0;
                top: 0;
                width: 100%;
              }
            }
          `}</style>
          <div className="print-container">
            <TransactionReceiptPrint data={printData} />
          </div>
        </div>
      )}
    </div>
  );
};