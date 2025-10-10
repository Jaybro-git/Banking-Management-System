import React, { useState, useEffect } from 'react';
import { Button } from './ui/Button';

type CustomerFilterType =
  | 'All'
  | 'Adult Accounts'
  | 'Joint Accounts'
  | 'Fixed Deposits'
  | 'Children Accounts'
  | 'Teen Accounts'
  | 'Senior Accounts'
  | 'Processed by Me';

type CustomerSearchField = 'account' | 'customer' | 'nic';

interface CustomersTabProps {
  customerFilterType: CustomerFilterType;
  setCustomerFilterType: (type: CustomerFilterType) => void;
  customerSearchField: CustomerSearchField;
  setCustomerSearchField: (field: CustomerSearchField) => void;
  customerSearchQuery: string;
  setCustomerSearchQuery: (query: string) => void;
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
}

export const CustomersTab: React.FC<CustomersTabProps> = ({
  customerFilterType,
  setCustomerFilterType,
  customerSearchField,
  setCustomerSearchField,
  customerSearchQuery,
  setCustomerSearchQuery,
}) => {
  const [customers, setCustomers] = useState<CustomerData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);

  const filterTypes: CustomerFilterType[] = [
    'All',
    'Adult Accounts',
    'Joint Accounts',
    'Fixed Deposits',
    'Children Accounts',
    'Teen Accounts',
    'Senior Accounts',
    'Processed by Me',
  ];

  const fetchCustomers = async () => {
    setLoading(true);
    setError(null);

    try {
      const queryParams = new URLSearchParams({
        filterType: customerFilterType,
        searchField: customerSearchField,
        searchQuery: customerSearchQuery || '',
        limit: '100',
        offset: '0',
      });

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const response = await fetch(
        `${apiUrl}/api/customer-lookup/customers?${queryParams}`,
        {
          method: 'GET',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
        }
      );

      if (response.status === 401) throw new Error('Session expired. Please log in again.');
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `Server error: ${response.status}`);
      }

      const data = await response.json();
      setCustomers(data.customers || []);
      setTotal(data.total || 0);
    } catch (err) {
      console.error('Error fetching customers:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch customers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      fetchCustomers();
    }, 300);
    return () => clearTimeout(debounceTimer);
  }, [customerFilterType, customerSearchField, customerSearchQuery]);

  const handleViewProfile = (customerId: string) => {
    window.location.href = `/dashboard/customers/${customerId}`;
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-LK', {
      style: 'currency',
      currency: 'LKR',
      minimumFractionDigits: 2,
    }).format(amount);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    // Add 5 hours 30 minutes for Sri Lanka time
    date.setHours(date.getHours() + 5);
    date.setMinutes(date.getMinutes() + 30);

    return date.toLocaleString('en-LK', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  return (
    <div className="flex flex-col h-[calc(100vh-135px)]">
      {/* Sticky Header Section */}
      <div className="bg-white sticky top-0 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium text-gray-600">Customer Lookup</h2>
          <span className="text-xs text-gray-400">
            {total} {total === 1 ? 'customer' : 'customers'} found
          </span>
        </div>

        {/* Filter Buttons */}
        <div className="flex flex-wrap gap-2">
          {filterTypes.map((type) => (
            <Button
              key={type}
              variant="filter"
              active={customerFilterType === type}
              onClick={() => setCustomerFilterType(type)}
            >
              {type}
            </Button>
          ))}
        </div>

        {/* Search Bar */}
        <div className="flex flex-wrap gap-2 items-center">
          <select
            value={customerSearchField}
            onChange={(e) => setCustomerSearchField(e.target.value as CustomerSearchField)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="account">Account Number</option>
            <option value="customer">Customer Name</option>
            <option value="nic">NIC Number</option>
          </select>
          <input
            type="text"
            placeholder={`Search by ${customerSearchField === 'nic' ? 'NIC' : customerSearchField}`}
            value={customerSearchQuery}
            onChange={(e) => setCustomerSearchQuery(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm flex-1 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
      </div>

      {/* Scrollable Customers List */}
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
            {customers.length === 0 ? (
              <div className="text-center py-8 text-gray-500 text-sm">
                No customers found matching your criteria
              </div>
            ) : (
              customers.map((customer) => (
                <div
                  key={customer.customer_id}
                  className="p-4 rounded-lg border border-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow duration-200"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="text-sm font-medium text-gray-900">
                          {customer.first_name} {customer.last_name}
                        </h4>
                        <span
                          className={`px-2 py-0.5 text-xs rounded-full ${
                            customer.customer_status === 'ACTIVE'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {customer.customer_status}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-xs text-gray-600">
                        <p>
                          <span className="font-medium">NIC:</span> {customer.nic_number}
                        </p>
                        <p>
                          <span className="font-medium">Phone:</span> {customer.phone_number}
                        </p>
                        <p>
                          <span className="font-medium">Total Accounts:</span>{' '}
                          {customer.total_accounts}
                        </p>
                        <p>
                          <span className="font-medium">Total Balance:</span>{' '}
                          <span className="font-semibold text-emerald-600">
                            {formatCurrency(customer.total_balance)}
                          </span>
                        </p>
                      </div>

                      {/* Accounts List */}
                      <div className="mt-3 text-xs text-gray-700">
                        <p className="font-medium mb-1">Accounts:</p>
                        <div className="border border-gray-100 rounded-lg divide-y divide-gray-100">
                          {customer.accounts.map((acc) => (
                            <div
                              key={acc.account_id}
                              className="p-2 bg-gray-50 hover:bg-gray-100 transition"
                            >
                              <div className="flex flex-wrap justify-between items-center">
                                <p>
                                  <span className="font-medium">Account:</span> {acc.account_id}
                                </p>
                                <span
                                  className={`px-2 py-0.5 text-[10px] rounded-full ${
                                    acc.account_status === 'ACTIVE'
                                      ? 'bg-green-100 text-green-800'
                                      : 'bg-gray-100 text-gray-800'
                                  }`}
                                >
                                  {acc.account_status}
                                </span>
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-4 gap-y-1 mt-1 text-[11px] text-gray-600">
                                <p>
                                  <span className="font-medium">Type:</span> {acc.account_type_name}
                                </p>
                                <p>
                                  <span className="font-medium">Current Balance:</span>{' '}
                                  {formatCurrency(acc.current_balance)}
                                </p>
                                <p>
                                  <span className="font-medium">Branch:</span> {acc.branch_name}
                                </p>
                                {acc.last_transaction_type && (
                                  <>
                                    <p>
                                      <span className="font-medium">Last Transaction:</span>{' '}
                                      {acc.last_transaction_type}
                                    </p>
                                    <p>
                                      <span className="font-medium">Amount:</span>{' '}
                                      {formatCurrency(acc.last_transaction_amount || 0)}
                                    </p>
                                    <p>
                                      <span className="font-medium">Date:</span>{' '}
                                      {formatDate(acc.last_transaction_date)}
                                    </p>
                                  </>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <Button
                      variant="primary"
                      className="mt-2 sm:mt-0 whitespace-nowrap"
                      onClick={() => handleViewProfile(customer.customer_id)}
                    >
                      View Profile
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};
