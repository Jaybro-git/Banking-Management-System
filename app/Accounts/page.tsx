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
        <h1 className="text-3xl font-semibold text-gray-900">Account Holders</h1>
        <p className="text-m text-gray-500">View and manage customer account information</p>
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

export default function AccountHoldersPage() {
  const [searchForm, setSearchForm] = useState({
    accountNumber: '',
    customerName: '',
    nicNumber: '',
    phone: '',
    email: ''
  });

  const [selectedCustomer, setSelectedCustomer] = useState({
    id: '1',
    firstName: 'John',
    lastName: 'Doe',
    fullName: 'John Doe',
    nicNumber: '123456789V',
    dateOfBirth: '1985-05-15',
    phone: '+94771234567',
    email: 'john.doe@email.com',
    address: '123 Main Street, Colombo 03',
    city: 'Colombo',
    postalCode: '00300',
    occupation: 'Software Engineer',
    monthlyIncome: '150,000',
    customerSince: '2020-03-15',
    status: 'Active',
    riskLevel: 'Low',
    lastLogin: '2024-08-20 14:30'
  });

  const [customerAccounts] = useState([
    {
      accountNumber: '1001234567',
      accountType: 'Savings Account',
      balance: '45,250.00',
      status: 'Active',
      openedDate: '2020-03-15',
      lastTransaction: '2024-08-20'
    },
    {
      accountNumber: '2001234567',
      accountType: 'Current Account',
      balance: '128,750.00',
      status: 'Active',
      openedDate: '2021-06-10',
      lastTransaction: '2024-08-19'
    },
    {
      accountNumber: 'FD001234567',
      accountType: 'Fixed Deposit',
      balance: '500,000.00',
      status: 'Active',
      openedDate: '2024-01-15',
      lastTransaction: '2024-08-15'
    }
  ]);

  const [updateForm, setUpdateForm] = useState({
    phone: selectedCustomer.phone,
    email: selectedCustomer.email,
    address: selectedCustomer.address,
    occupation: selectedCustomer.occupation,
    monthlyIncome: selectedCustomer.monthlyIncome
  });

  const [isEditing, setIsEditing] = useState(false);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchForm({ ...searchForm, [e.target.name]: e.target.value });
  };

  const handleUpdateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUpdateForm({ ...updateForm, [e.target.name]: e.target.value });
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate search - in real app, this would be an API call
    alert('Search functionality would be implemented here');
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    alert('Customer information updated successfully');
    setIsEditing(false);
  };

  const blockAccount = (accountNumber: string) => {
    if (confirm(`Are you sure you want to block account ${accountNumber}?`)) {
      alert(`Account ${accountNumber} has been blocked`);
    }
  };

  const unblockAccount = (accountNumber: string) => {
    alert(`Account ${accountNumber} has been unblocked`);
  };

  const viewTransactions = (accountNumber: string) => {
    alert(`Redirecting to transaction history for account ${accountNumber}`);
  };

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="mx-auto px-8 py-6 max-w-7xl">
        <Header activeTab="account-holders" />
        
        <div className="bg-white rounded-lg border border-gray-200 p-8">
          {/* Search Section */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Search Customer</h2>
            <form onSubmit={handleSearch}>
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-4">
                <TextInput
                  label="Account Number"
                  name="accountNumber"
                  value={searchForm.accountNumber}
                  onChange={handleSearchChange}
                  placeholder="Enter account number"
                />
                <TextInput
                  label="Customer Name"
                  name="customerName"
                  value={searchForm.customerName}
                  onChange={handleSearchChange}
                  placeholder="Enter customer name"
                />
                <TextInput
                  label="NIC Number"
                  name="nicNumber"
                  value={searchForm.nicNumber}
                  onChange={handleSearchChange}
                  placeholder="Enter NIC number"
                />
                <TextInput
                  label="Phone Number"
                  name="phone"
                  value={searchForm.phone}
                  onChange={handleSearchChange}
                  placeholder="Enter phone number"
                />
                <TextInput
                  label="Email Address"
                  name="email"
                  value={searchForm.email}
                  onChange={handleSearchChange}
                  placeholder="Enter email address"
                />
              </div>
              <div className="flex space-x-4">
                <Button type="submit" className="bg-emerald-600 text-white">
                  Search Customer
                </Button>
                <Button type="button" variant="secondary">
                  Clear All
                </Button>
                <Button type="button" className="bg-blue-600 text-white">
                  Advanced Search
                </Button>
              </div>
            </form>
          </div>

          {/* Customer Details */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            <div className="space-y-6">
              <div className="bg-emerald-50 p-6 rounded-lg border border-emerald-200">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="font-semibold text-gray-800">Customer Information</h3>
                  <div className="flex space-x-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      onClick={() => setIsEditing(!isEditing)}
                    >
                      {isEditing ? 'Cancel' : 'Edit'}
                    </Button>
                  </div>
                </div>

                {!isEditing ? (
                  <div className="space-y-3 text-sm">
                    <div className="grid grid-cols-2 gap-2">
                      <span className="font-medium">Full Name:</span>
                      <span>{selectedCustomer.fullName}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <span className="font-medium">NIC Number:</span>
                      <span>{selectedCustomer.nicNumber}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <span className="font-medium">Date of Birth:</span>
                      <span>{selectedCustomer.dateOfBirth}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <span className="font-medium">Phone:</span>
                      <span>{selectedCustomer.phone}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <span className="font-medium">Email:</span>
                      <span>{selectedCustomer.email}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <span className="font-medium">Address:</span>
                      <span>{selectedCustomer.address}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <span className="font-medium">Occupation:</span>
                      <span>{selectedCustomer.occupation}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <span className="font-medium">Monthly Income:</span>
                      <span>LKR {selectedCustomer.monthlyIncome}</span>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleUpdate} className="space-y-4">
                    <TextInput
                      label="Phone Number"
                      name="phone"
                      value={updateForm.phone}
                      onChange={handleUpdateChange}
                      required
                    />
                    <TextInput
                      label="Email Address"
                      name="email"
                      value={updateForm.email}
                      onChange={handleUpdateChange}
                      required
                    />
                    <TextInput
                      label="Address"
                      name="address"
                      value={updateForm.address}
                      onChange={handleUpdateChange}
                      required
                    />
                    <TextInput
                      label="Occupation"
                      name="occupation"
                      value={updateForm.occupation}
                      onChange={handleUpdateChange}
                      required
                    />
                    <TextInput
                      label="Monthly Income (LKR)"
                      name="monthlyIncome"
                      value={updateForm.monthlyIncome}
                      onChange={handleUpdateChange}
                      required
                    />
                    <Button type="submit" size="sm" className="bg-emerald-600 text-white">
                      Save Changes
                    </Button>
                  </form>
                )}
              </div>

              <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
                <h3 className="font-semibold text-gray-800 mb-4">Customer Status</h3>
                <div className="space-y-3 text-sm">
                  <div className="grid grid-cols-2 gap-2">
                    <span className="font-medium">Customer Since:</span>
                    <span>{selectedCustomer.customerSince}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <span className="font-medium">Status:</span>
                    <span className="text-green-600 font-medium">{selectedCustomer.status}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <span className="font-medium">Risk Level:</span>
                    <span className="text-green-600">{selectedCustomer.riskLevel}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <span className="font-medium">Last Login:</span>
                    <span>{selectedCustomer.lastLogin}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-yellow-50 p-6 rounded-lg border border-yellow-200">
                <h3 className="font-semibold text-gray-800 mb-4">Account Summary</h3>
                <div className="space-y-4">
                  {customerAccounts.map((account, index) => (
                    <div key={index} className="bg-white p-4 rounded border">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <div className="font-medium text-gray-800">{account.accountType}</div>
                          <div className="text-sm text-gray-600">{account.accountNumber}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold text-gray-800">LKR {account.balance}</div>
                          <div className={`text-sm ${account.status === 'Active' ? 'text-green-600' : 'text-red-600'}`}>
                            {account.status}
                          </div>
                        </div>
                      </div>
                      <div className="flex justify-between text-xs text-gray-500 mb-3">
                        <span>Opened: {account.openedDate}</span>
                        <span>Last Transaction: {account.lastTransaction}</span>
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          type="button"
                          size="sm"
                          variant="secondary"
                          onClick={() => viewTransactions(account.accountNumber)}
                        >
                          View Transactions
                        </Button>
                        {account.status === 'Active' ? (
                          <Button
                            type="button"
                            size="sm"
                            variant="danger"
                            onClick={() => blockAccount(account.accountNumber)}
                          >
                            Block
                          </Button>
                        ) : (
                          <Button
                            type="button"
                            size="sm"
                            className="bg-green-600 text-white"
                            onClick={() => unblockAccount(account.accountNumber)}
                          >
                            Unblock
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                <h3 className="font-semibold text-gray-800 mb-4">Quick Actions</h3>
                <div className="grid grid-cols-1 gap-3">
                  <Button type="button" className="bg-blue-600 text-white">
                    Generate Customer Report
                  </Button>
                  <Button type="button" variant="secondary">
                    Print Customer Details
                  </Button>
                  <Button type="button" variant="secondary">
                    Update KYC Documents
                  </Button>
                  <Button type="button" className="bg-purple-600 text-white">
                    Send Notification
                  </Button>
                  <Button type="button" variant="danger">
                    Close Customer Relationship
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
            <h3 className="font-semibold text-gray-800 mb-4">Recent Activity</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-gray-200">
                <div>
                  <span className="font-medium">Deposit</span>
                  <span className="text-sm text-gray-600 ml-2">Account: 1001234567</span>
                </div>
                <div className="text-right">
                  <div className="font-medium text-green-600">+LKR 25,000</div>
                  <div className="text-sm text-gray-500">2024-08-20 14:30</div>
                </div>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-200">
                <div>
                  <span className="font-medium">Withdrawal</span>
                  <span className="text-sm text-gray-600 ml-2">Account: 1001234567</span>
                </div>
                <div className="text-right">
                  <div className="font-medium text-red-600">-LKR 5,000</div>
                  <div className="text-sm text-gray-500">2024-08-19 10:15</div>
                </div>
              </div>
              <div className="flex justify-between items-center py-2">
                <div>
                  <span className="font-medium">Interest Payment</span>
                  <span className="text-sm text-gray-600 ml-2">FD: FD001234567</span>
                </div>
                <div className="text-right">
                  <div className="font-medium text-green-600">+LKR 11,875</div>
                  <div className="text-sm text-gray-500">2024-08-15 09:00</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}