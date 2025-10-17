'use client';

import React from 'react';
import { use } from 'react';
import Link from 'next/link';
import { Button } from '@/app/components/ui/Button';

interface FDInfo {
  fd_id: string;
  amount: number;
  fd_type: string;
  status: string;
}

interface AccountData {
  account_id: string;
  current_balance: number;
  account_status: string;
  account_type_name: string;
  type_code: string;
  last_transaction_type: string | null;
  last_transaction_amount: number | null;
  last_transaction_date: string | null;
  branch_name: string;
  fd?: FDInfo;
}

interface CustomerData {
  customer_id: string;
  first_name: string;
  last_name: string;
  nic_number: string;
  phone_number: string;
  email: string;
  customer_status: string;
  total_accounts: number;
  total_balance: number;
  accounts: AccountData[];
  date_of_birth: string;
  gender: string;
  address: string;
  registration_date: string;
  agent_first_name: string;
  agent_last_name: string;
}

interface Transaction {
  transaction_id: string;
  account_id: string;
  transaction_type: string;
  amount: number;
  balance_before: number | null;
  time_date_stamp: string;
  description: string;
  status: string;
  reference_number: string;
}

const CustomerProfilePage = ({ params: paramsPromise }: { params: Promise<{ customerId: string }> }) => {
  const params = use(paramsPromise);
  const [customer, setCustomer] = React.useState<CustomerData | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [statementStartDate, setStatementStartDate] = React.useState('');
  const [statementEndDate, setStatementEndDate] = React.useState('');
  const [selectedAccount, setSelectedAccount] = React.useState('all');
  const [printStatementData, setPrintStatementData] = React.useState<any>(null);

  React.useEffect(() => {
    const fetchCustomer = async () => {
      setLoading(true);
      setError(null);
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
        const response = await fetch(`${apiUrl}/api/profile/customer/${params.customerId}`, {
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

        // Fetch FD info for each account
        const processedAccounts = await Promise.all(
          data.accounts.map(async (acc: any) => {
            try {
              const fdRes = await fetch(
                `${apiUrl}/api/fixed-deposit/search?accountNumber=${acc.account_id}`,
                {
                  method: 'GET',
                  credentials: 'include',
                  headers: { 'Content-Type': 'application/json' },
                }
              );

              if (!fdRes.ok) {
                return { ...acc, current_balance: Number(acc.current_balance) };
              }

              const fdData = await fdRes.json();
              const activeFD = fdData.find((fd: any) => fd.status === 'ACTIVE');
              if (activeFD) {
                return {
                  ...acc,
                  current_balance: Number(acc.current_balance),
                  fd: {
                    fd_id: activeFD.fd_id,
                    amount: parseFloat(activeFD.amount),
                    fd_type: activeFD.fd_type,
                    status: activeFD.status,
                  },
                };
              }
              return { ...acc, current_balance: Number(acc.current_balance) };
            } catch {
              return { ...acc, current_balance: Number(acc.current_balance) };
            }
          })
        );

        setCustomer({
          ...data.customer,
          customer_status: data.customer.status,
          accounts: processedAccounts,
          total_accounts: processedAccounts.length,
          total_balance: processedAccounts.reduce((sum: number, a: any) => sum + Number(a.current_balance), 0),
        });
      } catch (err) {
        console.error(err);
        setError(err instanceof Error ? err.message : 'Failed to fetch customer');
      } finally {
        setLoading(false);
      }
    };

    fetchCustomer();
  }, [params.customerId]);

  React.useEffect(() => {
    if (printStatementData) {
      window.print();
    }
  }, [printStatementData]);

  const isPositiveTransaction = (type: string) =>
    ['INITIAL', 'DEPOSIT', 'FD_INTEREST', 'SAVINGS_INTEREST', 'TRANSFER_IN'].includes(type);

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-LK', {
      style: 'currency',
      currency: 'LKR',
      minimumFractionDigits: 2,
    }).format(amount);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    const d = new Date(dateString);
    d.setHours(d.getHours() + 5);
    d.setMinutes(d.getMinutes() + 30);
    return d.toLocaleString('en-LK', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  const getTermDisplay = (fdType: string) => {
    switch (fdType) {
      case '6_MONTHS':
        return '6 Months';
      case '1_YEAR':
        return '1 Year';
      case '3_YEARS':
        return '3 Years';
      default:
        return fdType;
    }
  };

  const handlePrintStatement = async () => {
    if (!statementStartDate || !statementEndDate) {
      alert('Please select both start and end dates');
      return;
    }
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      let allTxns: Transaction[] = [];

      if (selectedAccount === 'all') {
        for (const acc of customer!.accounts) {
          const res = await fetch(
            `${apiUrl}/api/transactions/account/${acc.account_id}/history?startDate=${statementStartDate}&endDate=${statementEndDate}&limit=1000&offset=0`,
            { method: 'GET', credentials: 'include', headers: { 'Content-Type': 'application/json' } }
          );
          if (res.ok) {
            const data = await res.json();
            allTxns.push(...data);
          }
        }
      } else {
        const res = await fetch(
          `${apiUrl}/api/transactions/account/${selectedAccount}/history?startDate=${statementStartDate}&endDate=${statementEndDate}&limit=1000&offset=0`,
          { method: 'GET', credentials: 'include', headers: { 'Content-Type': 'application/json' } }
        );
        if (res.ok) {
          const data = await res.json();
          allTxns = data;
        }
      }

      // Sort by ascending time
      const sortedTxns = allTxns.sort(
        (a, b) => new Date(a.time_date_stamp).getTime() - new Date(b.time_date_stamp).getTime()
      );

      // Group by account
      const transactionsByAccount = sortedTxns.reduce((acc, txn) => {
        if (!acc[txn.account_id]) acc[txn.account_id] = [];
        acc[txn.account_id].push(txn);
        return acc;
      }, {} as Record<string, Transaction[]>);

      // Compute running balances per account
      const transactionsWithRunningBalanceByAccount: Record<string, any[]> = {};

      Object.entries(transactionsByAccount).forEach(([accId, txns]) => {
        let prevAfter = 0;
        const computedTxns: any[] = [];

        for (let i = 0; i < txns.length; i++) {
          const txn = txns[i];
          const balanceBefore =
            txn.balance_before !== null && txn.balance_before !== undefined
              ? Number(txn.balance_before)
              : prevAfter;
          const balanceAfter =
            balanceBefore +
            (isPositiveTransaction(txn.transaction_type)
              ? Number(txn.amount)
              : -Number(txn.amount));

          computedTxns.push({ ...txn, balanceBefore, balanceAfter });
          prevAfter = balanceAfter;
        }

        transactionsWithRunningBalanceByAccount[accId] = computedTxns;
      });

      setPrintStatementData({
        customer,
        transactionsByAccount: transactionsWithRunningBalanceByAccount,
        startDate: statementStartDate,
        endDate: statementEndDate,
        selectedAccount,
      });
    } catch (err) {
      console.error('Error fetching statement:', err);
      alert('Failed to fetch bank statement');
    }
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

  if (!customer)
    return <div className="text-center py-8 text-gray-500 text-sm">Customer not found</div>;

  return (
    <main className="flex-1 overflow-y-auto p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 space-y-4 sm:space-y-0">
          <div>
            <h1 className="text-3xl font-semibold text-gray-900">Customer Profile</h1>
            <p className="text-m text-gray-500">View customer details and accounts</p>
          </div>
          <Link href="/" passHref>
            <Button type="button" variant="danger" size="md" className="w-full mt-6">
              Back
            </Button>
          </Link>
        </header>

        {/* Customer Info */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-2xl font-bold mb-4">
              {customer.first_name} {customer.last_name}
            </h2>
            <Button
              variant={customer.customer_status === 'ACTIVE' ? 'danger' : 'primary'}
              onClick={async () => {
                const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
                try {
                  const response = await fetch(`${apiUrl}/api/profile/customer/${customer.customer_id}/status-toggle`, {
                    method: 'PUT',
                    credentials: 'include',
                    headers: { 'Content-Type': 'application/json' },
                  });

                  if (!response.ok) {
                    const errData = await response.json().catch(() => ({}));
                    throw new Error(errData.error || 'Failed to update status');
                  }

                  const updated = await response.json();
                  setCustomer((prev) => prev ? { ...prev, customer_status: updated.status } : prev);
                  alert(`Customer status changed to ${updated.status}`);
                } catch (err) {
                  if (err instanceof Error) {
                    alert(err.message);
                  } else {
                    alert('Error updating status');
                  }
                }
              }}
            >
              {customer.customer_status === 'ACTIVE'
                ? 'Close Customer Account'
                : 'Activate Customer Account'}
            </Button>
          </div>
          <div className="flex items-center gap-2 mb-4">
            <span
              className={`px-2 py-0.5 text-xs rounded-full ${
                customer.customer_status === 'ACTIVE'
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-red-100 text-red-800'
              }`}
            >
              {customer.customer_status}
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 text-sm text-gray-700">
            <p><span className="font-medium">NIC:</span> {customer.nic_number}</p>
            <p><span className="font-medium">Phone:</span> {customer.phone_number}</p>
            <p><span className="font-medium">Email:</span> {customer.email}</p>
            <p><span className="font-medium">Address:</span> {customer.address}</p>
            <p><span className="font-medium">Date of Birth:</span> {new Date(customer.date_of_birth).toLocaleDateString('en-LK')}</p>
            <p><span className="font-medium">Gender:</span> {customer.gender}</p>
            <p><span className="font-medium">Registration Date:</span> {new Date(customer.registration_date).toLocaleDateString('en-LK')}</p>
            <p><span className="font-medium">Agent:</span> {customer.agent_first_name} {customer.agent_last_name}</p>
          </div>
          <div className="mt-6 pt-4 border-t border-gray-200 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 text-sm text-gray-700">
            <p><span className="font-medium">Total Accounts:</span> {customer.total_accounts}</p>
            <p>
              <span className="font-medium">Total Balance:</span>
              <span className="font-semibold text-emerald-600"> {formatCurrency(customer.total_balance)}</span>
            </p>
          </div>
        </div>

        {/* Accounts */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold mb-4">Accounts</h2>
          <div className="space-y-4">
            {customer.accounts.map((acc) => (
              <div key={acc.account_id} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">Account Number: {acc.account_id}</h3>
                    <span
                      className={`px-2 py-0.5 text-xs rounded-full ${
                        acc.account_status === 'ACTIVE'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {acc.account_status}
                    </span>
                  </div>

                  <Button
                    variant={acc.account_status === 'ACTIVE' ? 'danger' : 'primary'}
                    size="sm"
                    onClick={async () => {
                      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
                      try {
                        const res = await fetch(`${apiUrl}/api/profile/account/${acc.account_id}/status-toggle`, {
                          method: 'PUT',
                          credentials: 'include',
                          headers: { 'Content-Type': 'application/json' },
                        });

                        if (!res.ok) {
                          const errData = await res.json().catch(() => ({}));
                          throw new Error(errData.error || 'Failed to update account status');
                        }

                        const updated = await res.json();
                        setCustomer((prev) => {
                          if (!prev) return prev;
                          return {
                            ...prev,
                            accounts: prev.accounts.map((a) =>
                              a.account_id === acc.account_id ? { ...a, account_status: updated.status } : a
                            ),
                          };
                        });
                        alert(`Account ${acc.account_id} is now ${updated.status}`);
                      } catch (err) {
                        if (err instanceof Error) {
                          alert(err.message);
                        } else {
                          alert('Error updating account status');
                        }
                      }
                    }}
                  >
                    {acc.account_status === 'ACTIVE' ? 'Deactivate Account' : 'Activate Account'}
                  </Button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-1 text-xs text-gray-700">
                  <p><span className="font-medium">Type:</span> {acc.account_type_name}</p>
                  <p>
                    <span className="font-medium">Balance:</span>
                    <span className="font-semibold text-emerald-600"> {formatCurrency(acc.current_balance)}</span>
                  </p>
                  <p><span className="font-medium">Branch:</span> {acc.branch_name}</p>
                  {acc.last_transaction_type && (
                    <>
                      <p><span className="font-medium">Last Transaction:</span> {acc.last_transaction_type}</p>
                      <p><span className="font-medium">Amount:</span> {formatCurrency(acc.last_transaction_amount || 0)}</p>
                      <p><span className="font-medium">Date:</span> {formatDate(acc.last_transaction_date)}</p>
                    </>
                  )}
                  {acc.fd && (
                    <>
                      <p><span className="font-medium">FD ID:</span> {acc.fd.fd_id}</p>
                      <p><span className="font-medium">FD Amount:</span> {formatCurrency(acc.fd.amount)}</p>
                      <p><span className="font-medium">Term:</span> {getTermDisplay(acc.fd.fd_type)}</p>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bank Statement */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold mb-4">Bank Statement</h2>
          <div className="flex flex-wrap gap-4 mb-4 items-center">
            <select
              value={selectedAccount}
              onChange={(e) => setSelectedAccount(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="all">Customer Bank Statement</option>
              {customer.accounts.map(acc => (
                <option key={acc.account_id} value={acc.account_id}>{acc.account_id} Bank Statement</option>
              ))}
            </select>
            <input
              type="date"
              value={statementStartDate}
              onChange={(e) => setStatementStartDate(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <input
              type="date"
              value={statementEndDate}
              onChange={(e) => setStatementEndDate(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <Button variant="primary" onClick={handlePrintStatement}>Print</Button>
          </div>
        </div>
      </div>

      {/* Hidden Print Statement */}
      {printStatementData && (
        <div className="hidden print:block">
          <style>{`
            @media print {
              body * { visibility: hidden; }
              .print-statement-container, .print-statement-container * { visibility: visible; }
              .print-statement-container { position: absolute; left: 0; top: 0; width: 100%; font-size: 12px; }
              table { width: 100%; border-collapse: collapse; }
              th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
              th { background-color: #f2f2f2; }
            }
          `}</style>

          <div className="print-statement-container">
            <div className="text-right mr-4 mt-4 text-2xl font-bold text-green-800 ml-4">
              B<span className="text-2xl font-normal">-TRUST</span>
            </div>
            <h1 className="text-2xl font-bold mb-4">
              {printStatementData.selectedAccount === 'all' ? 'Customer' : 'Account'} Bank Statement
            </h1>
            <p><strong>Customer:</strong> {printStatementData.customer.first_name} {printStatementData.customer.last_name}</p>
            <p><strong>NIC:</strong> {printStatementData.customer.nic_number}</p>
            <p><strong>Address:</strong> {printStatementData.customer.address}</p>
            {printStatementData.selectedAccount !== 'all' && (
              <p><strong>Account:</strong> {printStatementData.selectedAccount}</p>
            )}
            <p className="mb-4"><strong>Period:</strong> {printStatementData.startDate} to {printStatementData.endDate}</p>

            {printStatementData.transactionsByAccount &&
              Object.entries(printStatementData.transactionsByAccount).map(([accountId, txns]: any) => (
                <div key={accountId} className="mb-6">
                  <h3 className="font-semibold text-lg mb-2">Account: {accountId}</h3>
                  <table>
                    <thead>
                      <tr>
                        <th>Date & Time</th>
                        <th>Type</th>
                        <th>Amount</th>
                        <th>Description</th>
                        <th>Balance Before</th>
                        <th>Balance After</th>
                      </tr>
                    </thead>
                    <tbody>
                      {txns.map((txn: any) => (
                        <tr key={txn.transaction_id}>
                          <td>{formatDate(txn.time_date_stamp)}</td>
                          <td>{txn.transaction_type}</td>
                          <td>{formatCurrency(Number(txn.amount))}</td>
                          <td>{txn.description}</td>
                          <td>{formatCurrency(Number(txn.balanceBefore))}</td>
                          <td>{formatCurrency(Number(txn.balanceAfter))}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {txns.length > 0 && (
                    <>
                      <p className="mt-2"><strong>Balance Before Period:</strong> {formatCurrency(txns[0].balanceBefore)}</p>
                      <p><strong>Balance After Period:</strong> {formatCurrency(txns[txns.length - 1].balanceAfter)}</p>
                    </>
                  )}
                </div>
              ))}
          </div>
        </div>
      )}
    </main>
  );
};

export default CustomerProfilePage;