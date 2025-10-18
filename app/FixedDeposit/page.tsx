'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { Button } from '@/app/components/ui/Button';
import { TextInput } from '@/app/components/ui/TextInput';
import FDStatementPrint from '@/app/components/FDStatementPrint';

interface HeaderProps {
  activeTab: string;
}

const Header: React.FC<HeaderProps> = ({ activeTab }) => {
  return (
    <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 space-y-4 sm:space-y-0">
      <div>
        <h1 className="text-3xl font-semibold text-gray-900">Fixed Deposit Management</h1>
        <p className="text-m text-gray-500">Manage fixed deposits and interest payments</p>
      </div>
      <div className="flex items-center space-x-4">
        <Link href="/" passHref>
          <Button type="button" variant="danger" size="md" className="w-full mt-6">
            Cancel
          </Button>
        </Link>
      </div>
    </header>
  );
};

interface FDDetails {
  fd_id: string;
  account_id: string;
  customer_name: string;
  amount: string;
  interest_rate: string;
  fd_type: string;
  start_date: string;
  maturity_date: string;
  status: string;
  current_value: string;
  monthly_interest: string;
  days_to_maturity: number;
  account_type_name: string;
  last_interest_paid: string | null;
  last_interest_amount: string | null;
  total_interests_paid: number;
  total_interest_paid_amount: string;
}

interface AccountHolder {
  customer_id: string;
  first_name: string;
  last_name: string;
  nic_number: string;
}

type FDFilterType = 'All' | 'Active' | 'Matured' | 'Closed' | '6 Months' | '1 Year' | '3 Years';

type FDSearchField = 'fdNumber' | 'accountNumber' | 'customerName';

export default function FixedDepositPage() {
  const [activeTab, setActiveTab] = useState<'search' | 'create'>('search');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [fdFilterType, setFdFilterType] = useState<FDFilterType>('All');
  const [fdSearchField, setFdSearchField] = useState<FDSearchField>('fdNumber');
  const [fdSearchQuery, setFdSearchQuery] = useState('');
  const [total, setTotal] = useState(0);

  const [expandedFDs, setExpandedFDs] = useState<{ [key: string]: boolean }>({});
  const [fdHistory, setFdHistory] = useState<{ [key: string]: any[] }>({});
  const [loadingHistory, setLoadingHistory] = useState<{ [key: string]: boolean }>({});

  const [createForm, setCreateForm] = useState({
    accountNumber: '',
    amount: '',
    term: ''
  });



  const [accountHolders, setAccountHolders] = useState<AccountHolder[]>([]);
  const [checkingAccount, setCheckingAccount] = useState(false);

  const [searchResults, setSearchResults] = useState<FDDetails[]>([]);

  const [printFD, setPrintFD] = useState<FDDetails | null>(null);
  const [printHistory, setPrintHistory] = useState<any[]>([]);

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

  const filterTypes: FDFilterType[] = [
    'All',
    'Active',
    'Matured',
    'Closed',
    '6 Months',
    '1 Year',
    '3 Years',
  ];

  const fetchFDs = async () => {
    setLoading(true);
    setError(null);

    try {
      let backendFilter = '';
      if (fdFilterType === 'Active') backendFilter = 'ACTIVE';
      else if (fdFilterType === 'Matured') backendFilter = 'MATURED';
      else if (fdFilterType === 'Closed') backendFilter = 'CLOSED';
      else if (fdFilterType === '6 Months') backendFilter = '6_MONTHS';
      else if (fdFilterType === '1 Year') backendFilter = '1_YEAR';
      else if (fdFilterType === '3 Years') backendFilter = '3_YEARS';
      else backendFilter = '';

      const queryParams = new URLSearchParams({
        filterType: backendFilter,
        limit: '100',
        offset: '0',
      });

      if (fdSearchQuery) {
        const paramKey = fdSearchField === 'fdNumber' ? 'fdNumber' :
                         fdSearchField === 'accountNumber' ? 'accountNumber' :
                         'customerName';
        queryParams.append(paramKey, fdSearchQuery);
      }

      const response = await fetch(`${API_BASE_URL}/api/fixed-deposit/search?${queryParams.toString()}`, {
        method: 'GET',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });

      if (response.status === 401) throw new Error('Session expired. Please log in again.');
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `Server error: ${response.status}`);
      }

      const data = await response.json();

      const groupedData = data.reduce((acc: FDDetails[], current: FDDetails) => {
        const existing = acc.find(f => f.fd_id === current.fd_id);
        if (existing) {
          existing.customer_name += `, ${current.customer_name}`;
        } else {
          acc.push({ ...current });
        }
        return acc;
      }, []);

      setSearchResults(groupedData || []);
      setTotal(groupedData.length || 0);
    } catch (err: any) {
      console.error('Error fetching FDs:', err);
      setError(err.message || 'Failed to fetch fixed deposits');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'search') {
      const debounceTimer = setTimeout(() => {
        fetchFDs();
      }, 300);
      return () => clearTimeout(debounceTimer);
    }
  }, [activeTab, fdFilterType, fdSearchField, fdSearchQuery]);

  const handleCreateChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setCreateForm({ ...createForm, [name]: value });
    
    if (name === 'accountNumber') {
      setAccountHolders([]);
    }
  };

  const handleCheckAccount = async () => {
    if (!createForm.accountNumber) {
      alert('Please enter an account number');
      return;
    }

    setCheckingAccount(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/fixed-deposit/check-account/${createForm.accountNumber}`, {
        method: 'GET',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to check account');
      }

      const data = await response.json();
      setAccountHolders(data.holders || []);
    } catch (err: any) {
      alert(err.message);
      setAccountHolders([]);
    } finally {
      setCheckingAccount(false);
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/fixed-deposit/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include', 
        body: JSON.stringify({
          accountId: createForm.accountNumber,
          amount: parseFloat(createForm.amount),
          term: createForm.term
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create fixed deposit');
      }

      const data = await response.json();
      alert(`✓ Fixed Deposit created successfully!\n\nFD Number: ${data.fd.fd_id}\nAmount: LKR ${parseFloat(data.fd.amount).toFixed(2)}\nInterest Rate: ${data.fd.interest_rate}%\nMonthly Interest: LKR ${data.fd.monthly_interest}\n\nReference: ${data.transaction.reference_number}`);
      
      setCreateForm({
        accountNumber: '',
        amount: '',
        term: ''
      });
      setAccountHolders([]);

      setTimeout(() => {
        setActiveTab('search');
        fetchFDs();
      }, 500);
    } catch (err: any) {
      alert(`✗ Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const renewFD = async (fdId: string) => {
    const term = prompt('Enter new term (0.5 for 6 months, 1 for 1 year, 3 for 3 years):');
    if (!term) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/fixed-deposit/renew/${fdId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ term })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to renew FD');
      }

      const data = await response.json();
      alert(`✓ FD renewed successfully!\n\nOld FD: ${fdId}\nNew FD: ${data.new_fd.fd_id}\nAmount: LKR ${parseFloat(data.new_fd.amount).toFixed(2)}\nNew Interest Rate: ${data.new_fd.interest_rate}%`);
      
      fetchFDs();
    } catch (err: any) {
      alert(`✗ Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const closeFD = async (fdId: string) => {
    if (!confirm('Are you sure you want to close this Fixed Deposit? This action cannot be undone.')) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/fixed-deposit/close/${fdId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to close FD');
      }

      const data = await response.json();
      alert(`✓ FD closed successfully!\n\nFD Number: ${fdId}\nPrincipal Returned: LKR ${data.principal_returned}\nPending Interest: LKR ${data.pending_interest_paid}\nTotal Returned: LKR ${data.total_returned}`);
      
      fetchFDs();
    } catch (err: any) {
      alert(`✗ Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const getTermDisplay = (fdType: string) => {
    switch (fdType) {
      case '6_MONTHS': return '6 Months';
      case '1_YEAR': return '1 Year';
      case '3_YEARS': return '3 Years';
      default: return fdType;
    }
  };

  const getInterestRateDisplay = (term: string) => {
    switch (term) {
      case '0.5': return '13';
      case '1': return '14';
      case '3': return '15';
      default: return '';
    }
  };

  const calculateMaturityAmount = () => {
    if (!createForm.amount || !createForm.term) return 0;
    const principal = parseFloat(createForm.amount);
    const term = parseFloat(createForm.term);
    let rate = 0;
    
    if (term === 0.5) rate = 0.13;
    else if (term === 1) rate = 0.14;
    else if (term === 3) rate = 0.15;
    
    const months = term * 12;
    const monthlyRate = rate / 12;
    const maturityAmount = principal * Math.pow(1 + monthlyRate, months);
    
    return maturityAmount;
  };

  const calculateMonthlyInterest = () => {
    if (!createForm.amount || !createForm.term) return 0;
    const principal = parseFloat(createForm.amount);
    const rateStr = getInterestRateDisplay(createForm.term);
    if (!rateStr) return 0;
    const rate = parseFloat(rateStr) / 100;
    return (principal * rate) / 12;
  };

  const formatCurrency = (amount: string | number) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('en-LK', {
      style: 'currency',
      currency: 'LKR',
      minimumFractionDigits: 2,
    }).format(num);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);

    return date.toLocaleString('en-LK', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  const fetchInterestHistory = async (fdId: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/fixed-deposit/${fdId}/interest-history`, {
        method: 'GET',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch interest history');
      }

      return await response.json();
    } catch (err) {
      console.error('Error fetching interest history:', err);
      alert('Failed to fetch interest history');
      return [];
    }
  };

  const toggleFDHistory = async (fdId: string) => {
    setExpandedFDs(prev => ({ ...prev, [fdId]: !prev[fdId] }));

    if (!fdHistory[fdId]) {
      setLoadingHistory(prev => ({ ...prev, [fdId]: true }));
      try {
        const response = await fetch(`${API_BASE_URL}/api/fixed-deposit/${fdId}/interest-history`, {
          method: 'GET',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
          throw new Error(errorData.error || `Server error: ${response.status}`);
        }

        const data = await response.json();
        setFdHistory(prev => ({ ...prev, [fdId]: data }));
      } catch (err: any) {
        console.error('Error fetching FD history:', err);
        setError(err.message || 'Failed to fetch interest history');
      } finally {
        setLoadingHistory(prev => ({ ...prev, [fdId]: false }));
      }
    }
  };

  const handlePrint = async (fd: FDDetails) => {
    const history = await fetchInterestHistory(fd.fd_id);
    setPrintFD(fd);
    setPrintHistory(history);
    setTimeout(() => window.print(), 300);
  };

  return (
    <>
      <main className="min-h-screen bg-gray-50 print:hidden">
        <div className="mx-auto px-8 py-6 max-w-7xl">
          <Header activeTab="fixed-deposit" />

          <div className="mb-6 border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('search')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'search' 
                  ? 'border-emerald-500 text-emerald-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
              >
                Search & Manage FDs
              </button>
              <button
                onClick={() => setActiveTab('create')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'create' 
                  ? 'border-emerald-500 text-emerald-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
              >
                Create New FD
              </button>
            </nav>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-8">
            {activeTab === 'search' && (
              <div className="flex flex-col h-[calc(100vh-270px)]">
                <div className="bg-white sticky top-0 space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-sm font-medium text-gray-600">Fixed Deposit Lookup</h2>
                    <span className="text-xs text-gray-400">
                      {total} {total === 1 ? 'FD' : 'FDs'} found
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {filterTypes.map((type) => (
                      <Button
                        key={type}
                        variant="filter"
                        active={fdFilterType === type}
                        onClick={() => setFdFilterType(type)}
                      >
                        {type}
                      </Button>
                    ))}
                  </div>

                  <div className="flex flex-wrap gap-2 items-center">
                    <select
                      value={fdSearchField}
                      onChange={(e) => setFdSearchField(e.target.value as FDSearchField)}
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="fdNumber">FD Number</option>
                      <option value="accountNumber">Account Number</option>
                      <option value="customerName">Customer Name</option>
                    </select>
                    <input
                      type="text"
                      placeholder={`Search by ${fdSearchField === 'fdNumber' ? 'FD Number' : fdSearchField === 'accountNumber' ? 'Account Number' : 'Customer Name'}`}
                      value={fdSearchQuery}
                      onChange={(e) => setFdSearchQuery(e.target.value)}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-sm flex-1 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto mt-4 pr-2">
                  {loading && (
                    <div className="flex justify-center items-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
                    </div>
                  )}

                  {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                      {error}
                    </div>
                  )}

                  {!loading && !error && (
                    <div className="space-y-4">
                      {searchResults.length === 0 ? (
                        <div className="text-center py-8 text-gray-500 text-sm">
                          No fixed deposits found matching your criteria
                        </div>
                      ) : (
                        searchResults.map((fd) => (
                          <div
                            key={fd.fd_id}
                            className="p-4 rounded-lg border border-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow duration-200"
                          >
                            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <h4 className="text-sm font-medium text-gray-900">
                                    {fd.fd_id}
                                  </h4>
                                  <span
                                    className={`px-2 py-0.5 text-xs rounded-full ${
                                      fd.status === 'ACTIVE'
                                        ? 'bg-green-100 text-green-800'
                                        : fd.status === 'MATURED'
                                        ? 'bg-blue-100 text-blue-800'
                                        : 'bg-red-100 text-red-800'
                                    }`}
                                  >
                                    {fd.status}
                                  </span>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-xs text-gray-600">
                                  <p>
                                    <span className="font-medium">Customer:</span> {fd.customer_name}
                                  </p>
                                  <p>
                                    <span className="font-medium">Account:</span> {fd.account_id}
                                  </p>
                                  <p>
                                    <span className="font-medium">Account Type:</span> {fd.account_type_name}
                                  </p>
                                  <p>
                                    <span className="font-medium">Principal:</span>{' '}
                                    <span className="font-semibold text-emerald-600">
                                      {formatCurrency(fd.amount)}
                                    </span>
                                  </p>
                                  <p>
                                    <span className="font-medium">Interest Rate:</span> {fd.interest_rate}% p.a.
                                  </p>
                                  <p>
                                    <span className="font-medium">Term:</span> {getTermDisplay(fd.fd_type)}
                                  </p>
                                  <p>
                                    <span className="font-medium">Start Date:</span> {formatDate(fd.start_date)}
                                  </p>
                                  <p>
                                    <span className="font-medium">Maturity Date:</span> {formatDate(fd.maturity_date)}
                                  </p>
                                  <p>
                                    <span className="font-medium">Days to Maturity:</span> {fd.days_to_maturity}
                                  </p>
                                  <p>
                                    <span className="font-medium">Current Value:</span>{' '}
                                    <span className="font-semibold text-emerald-600">
                                      {formatCurrency(parseFloat(fd.amount) + parseFloat(fd.total_interest_paid_amount))}
                                    </span>
                                  </p>
                                  <p>
                                    <span className="font-medium">Monthly Interest:</span> {formatCurrency(fd.monthly_interest)}
                                  </p>
                                  <p>
                                    <span className="font-medium">Total Interest Paid:</span>{' '}
                                    <span className="font-semibold text-emerald-600">
                                      {formatCurrency(fd.total_interest_paid_amount)}
                                    </span>
                                  </p>
                                </div>

                                <div className="mt-3 text-xs text-gray-700">
                                  <p className="font-medium mb-1">Interest Details:</p>
                                  <div className="border border-gray-100 rounded-lg divide-y divide-gray-100">
                                    <div 
                                      className="p-2 bg-gray-50 hover:bg-gray-100 transition cursor-pointer flex justify-between items-center"
                                      onClick={() => toggleFDHistory(fd.fd_id)}
                                    >
                                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-4 gap-y-1 text-[11px] text-gray-600 flex-1">
                                        <p>
                                          <span className="font-medium">Monthly Interests Paid:</span> {fd.total_interests_paid}
                                        </p>
                                        <p>
                                          <span className="font-medium">Last Paid:</span> {formatDate(fd.last_interest_paid)}
                                        </p>
                                        <p>
                                          <span className="font-medium">Last Amount:</span>{' '}
                                          {fd.last_interest_amount ? formatCurrency(fd.last_interest_amount) : 'N/A'}
                                        </p>
                                      </div>
                                      <div className="text-gray-500 ml-2">
                                        {expandedFDs[fd.fd_id] ? '▲' : '▼'}
                                      </div>
                                    </div>
                                    {expandedFDs[fd.fd_id] && (
                                      <div className="p-2 bg-gray-50">
                                        {loadingHistory[fd.fd_id] ? (
                                          <p className="text-sm text-gray-500 text-center">Loading history...</p>
                                        ) : fdHistory[fd.fd_id] && fdHistory[fd.fd_id].length > 0 ? (
                                          <div className="grid gap-x-4 gap-y-1 text-[11px] text-gray-600 flex-1">
                                            <h5 className="font-semibold text-gray-800 mb-2 text-sm">Interest Payment History</h5>
                                            <div className="grid grid-cols-3 gap-4 text-xs font-medium text-gray-800 mb-1">
                                              <span>Date</span>
                                              <span>Processed By</span>
                                              <span className="text-right">Amount</span>
                                            </div>
                                            {fdHistory[fd.fd_id].map((hist: any, index: number) => (
                                              <div key={index} className="grid grid-cols-3 gap-4 text-xs text-gray-600 border-b border-gray-100 pb-1">
                                                <span>{formatDate(hist.time_date_stamp)}</span>
                                                <span>{hist.employee_name || (hist.transaction_type === 'FD_INTEREST' ? 'System' : 'N/A')}</span>
                                                <span className="text-right font-medium">{formatCurrency(hist.amount)}</span>
                                              </div>
                                            ))}
                                          </div>
                                        ) : (
                                          <p className="text-sm text-gray-500 text-center italic">No interest payments yet</p>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>

                              <div className="flex flex-col gap-2 mt-2 sm:mt-0">
                                {fd.status === 'ACTIVE' && (
                                  <>
                                    <Button 
                                      type="button" 
                                      variant="primary"
                                      className="whitespace-nowrap"
                                      onClick={() => renewFD(fd.fd_id)}
                                      disabled={loading}
                                    >
                                      Renew
                                    </Button>
                                    <Button 
                                      type="button" 
                                      variant="danger"
                                      className="whitespace-nowrap bg-red-100"
                                      onClick={() => closeFD(fd.fd_id)}
                                      disabled={loading}
                                    >
                                      Close
                                    </Button>
                                  </>
                                )}
                                <Button 
                                  type="button" 
                                  variant="secondary"
                                  className="whitespace-nowrap"
                                  onClick={() => handlePrint(fd)}
                                  disabled={loading}
                                >
                                  Print
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'create' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Create New Fixed Deposit</h2>
                  <p className="text-sm text-gray-600">
                    Note: Only Adult, Teen, Senior, and Joint accounts can open Fixed Deposits. 
                    One FD per account is allowed.
                  </p>
                </div>

                <form onSubmit={handleCreateSubmit}>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="space-y-6">
                      <div>
                        <TextInput
                          label="Account Number"
                          name="accountNumber"
                          value={createForm.accountNumber}
                          onChange={handleCreateChange}
                          required
                          placeholder="Enter savings account number"
                        />
                        <Button
                          type="button"
                          onClick={handleCheckAccount}
                          variant="secondary"
                          disabled={checkingAccount || !createForm.accountNumber}
                          className="mt-2"
                        >
                          {checkingAccount ? 'Checking...' : 'Check Account'}
                        </Button>

                        {accountHolders.length > 0 && (
                          <div className="mt-4 p-4 bg-emerald-50 rounded-lg">
                            <h4 className="font-semibold text-gray-800 mb-2">Account Holder{accountHolders.length > 1 ? 's' : ''}</h4>
                            {accountHolders.map((holder, index) => (
                              <p key={holder.customer_id} className="text-sm text-gray-700">
                                {accountHolders.length > 1 && `${index + 1}. `}
                                <strong>{holder.first_name} {holder.last_name}</strong> (NIC: {holder.nic_number})
                              </p>
                            ))}
                          </div>
                        )}
                      </div>

                      <div>
                        <label className="block mb-2 text-gray-700 font-medium">
                          Deposit Amount (LKR) <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="number"
                          name="amount"
                          value={createForm.amount}
                          onChange={handleCreateChange}
                          required
                          min="0"
                          step="0.01"
                          placeholder="Enter deposit amount"
                          className="w-full px-4 py-2 rounded-lg border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>

                      <div>
                        <label className="block mb-2 text-gray-700 font-medium">
                          Deposit Term <span className="text-red-500">*</span>
                        </label>
                        <select
                          name="term"
                          value={createForm.term}
                          onChange={handleCreateChange}
                          required
                          className="w-full px-4 py-2 rounded-lg border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        >
                          <option value="">Select Term</option>
                          <option value="0.5">6 Months (13% p.a.)</option>
                          <option value="1">1 Year (14% p.a.)</option>
                          <option value="3">3 Years (15% p.a.)</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div className="bg-green-50 p-6 rounded-lg border border-green-200">
                        <h4 className="font-semibold text-gray-800 mb-3">Fixed Deposit Terms</h4>
                        <div className="text-sm text-gray-700 space-y-2">
                          <div><strong>6 Months:</strong> 13% per annum</div>
                          <div><strong>1 Year:</strong> 14% per annum</div>
                          <div><strong>3 Years:</strong> 15% per annum</div>
                          <div className="pt-2 border-t border-green-300 mt-3">
                            <strong>Interest Payment:</strong> Monthly, credited to linked savings account
                          </div>
                          <div><strong>Calculation Cycle:</strong> 30-day month</div>
                          <div><strong>Eligible Accounts:</strong> Adult, Teen, Senior, Joint</div>
                          <div className="text-red-600"><strong>Limit:</strong> One FD per account</div>
                        </div>
                      </div>

                      {createForm.amount && createForm.term && (
                        <div className="bg-green-50 p-6 rounded-lg border border-green-200">
                          <h4 className="font-semibold text-gray-800 mb-3">Maturity Calculation</h4>
                          <div className="text-sm text-gray-700 space-y-2">
                            <div>
                              <strong>Principal Amount:</strong> {formatCurrency(createForm.amount)}
                            </div>
                            <div>
                              <strong>Interest Rate:</strong> {getInterestRateDisplay(createForm.term)}% per annum
                            </div>
                            <div>
                              <strong>Term:</strong> {createForm.term === '0.5' ? '6 Months' : `${createForm.term} Year${createForm.term === '1' ? '' : 's'}`}
                            </div>
                            <div>
                              <strong>Monthly Interest:</strong> {formatCurrency(calculateMonthlyInterest())}
                            </div>
                            <div className="pt-2 border-t border-green-300 mt-3">
                              <strong>Estimated Maturity Amount:</strong> {formatCurrency(calculateMaturityAmount())}
                            </div>
                            <div>
                              <strong>Total Interest:</strong> {formatCurrency(calculateMaturityAmount() - parseFloat(createForm.amount || '0'))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-end mt-8 pt-6 border-t border-gray-300">
                    <div className="flex space-x-4">
                      <Button 
                        type="button" 
                        variant="secondary"
                        onClick={() => {
                          setCreateForm({
                            accountNumber: '',
                            amount: '',
                            term: ''
                          });
                          setAccountHolders([]);
                          setError(null);
                        }}
                      >
                        Clear Form
                      </Button>
                      <Button
                        type="submit"
                        disabled={!createForm.accountNumber || !createForm.amount || !createForm.term || loading}
                        className={`bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-700 ${(!createForm.accountNumber || !createForm.amount || !createForm.term || loading) ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        {loading ? 'Creating...' : 'Create Fixed Deposit'}
                      </Button>
                    </div>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      </main>

      <div className="hidden print:block">
        {printFD && (
          <FDStatementPrint 
            fd={printFD} 
            history={printHistory} 
            formatDate={formatDate} 
            formatCurrency={formatCurrency} 
            getTermDisplay={getTermDisplay} 
          />
        )}
      </div>
    </>
  );
}