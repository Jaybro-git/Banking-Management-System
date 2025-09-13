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

export default function FixedDepositPage() {
  const [activeTab, setActiveTab] = useState<'search' | 'create' | 'renew'>('search');
  const [searchForm, setSearchForm] = useState({
    fdNumber: '',
    accountNumber: '',
    customerName: ''
  });

  const [createForm, setCreateForm] = useState({
    accountNumber: '',
    depositAmount: '',
    term: '',
    interestRate: '',
    interestPayment: 'maturity',
    nomineeDetails: '',
    specialInstructions: '',
    receiptNumber: ''
  });

  const [selectedFD, setSelectedFD] = useState({
    fdNumber: 'FD001234567',
    customerName: 'John Doe',
    accountNumber: '1234567890',
    principalAmount: '500,000.00',
    interestRate: '9.5',
    term: '2 Years',
    startDate: '2024-01-15',
    maturityDate: '2026-01-15',
    currentValue: '599,500.00',
    status: 'Active',
    interestPayment: 'Quarterly',
    lastInterestPaid: '2024-07-15',
    nextInterestDue: '2024-10-15'
  });

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchForm({ ...searchForm, [e.target.name]: e.target.value });
  };

  const handleCreateChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setCreateForm({ ...createForm, [e.target.name]: e.target.value });
  };

  const generateFDNumber = () => {
    const fdNum = 'FD' + Date.now().toString().slice(-9);
    setCreateForm({ ...createForm, receiptNumber: fdNum });
  };

  const calculateMaturityAmount = () => {
    if (!createForm.depositAmount || !createForm.interestRate || !createForm.term) return 0;
    const principal = parseFloat(createForm.depositAmount);
    const rate = parseFloat(createForm.interestRate) / 100;
    const years = parseFloat(createForm.term.split(' ')[0]);
    return principal * Math.pow(1 + rate, years);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert(`Fixed Deposit created successfully! FD Number: ${createForm.receiptNumber}`);
  };

  const payInterest = () => {
    alert(`Interest payment of LKR 11,875.00 processed for FD ${selectedFD.fdNumber}`);
  };

  const renewFD = () => {
    alert(`FD ${selectedFD.fdNumber} has been renewed for another ${selectedFD.term}`);
  };

  const closeFD = () => {
    if (confirm('Are you sure you want to close this Fixed Deposit? This action cannot be undone.')) {
      alert(`FD ${selectedFD.fdNumber} has been closed. Amount LKR ${selectedFD.currentValue} will be transferred to linked account.`);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="mx-auto px-8 py-6 max-w-7xl">
        <Header activeTab="fixed-deposit" />
        
        {/* Tab Navigation */}
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
          
          {/* Search & Manage Tab */}
          {activeTab === 'search' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Search Fixed Deposits</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <TextInput
                  label="FD Number"
                  name="fdNumber"
                  value={searchForm.fdNumber}
                  onChange={handleSearchChange}
                  placeholder="Enter FD number"
                />
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
              </div>

              <div className="flex space-x-4">
                <Button type="button" className="bg-emerald-600 text-white">
                  Search FDs
                </Button>
                <Button type="button" variant="secondary">
                  Clear
                </Button>
              </div>

              {/* FD Details Display */}
              <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div className="bg-emerald-50 p-6 rounded-lg border border-emerald-200">
                    <h3 className="font-semibold text-gray-800 mb-4">Fixed Deposit Details</h3>
                    <div className="space-y-3 text-sm">
                      <div className="grid grid-cols-2 gap-2">
                        <span className="font-medium">FD Number:</span>
                        <span>{selectedFD.fdNumber}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <span className="font-medium">Customer:</span>
                        <span>{selectedFD.customerName}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <span className="font-medium">Account:</span>
                        <span>{selectedFD.accountNumber}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <span className="font-medium">Principal:</span>
                        <span>LKR {selectedFD.principalAmount}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <span className="font-medium">Interest Rate:</span>
                        <span>{selectedFD.interestRate}% p.a.</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <span className="font-medium">Term:</span>
                        <span>{selectedFD.term}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <span className="font-medium">Status:</span>
                        <span className="text-green-600 font-medium">{selectedFD.status}</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
                    <h3 className="font-semibold text-gray-800 mb-4">Maturity Information</h3>
                    <div className="space-y-3 text-sm">
                      <div className="grid grid-cols-2 gap-2">
                        <span className="font-medium">Start Date:</span>
                        <span>{selectedFD.startDate}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <span className="font-medium">Maturity Date:</span>
                        <span>{selectedFD.maturityDate}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <span className="font-medium">Current Value:</span>
                        <span className="font-semibold text-blue-600">LKR {selectedFD.currentValue}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <span className="font-medium">Days to Maturity:</span>
                        <span>456 days</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="bg-yellow-50 p-6 rounded-lg border border-yellow-200">
                    <h3 className="font-semibold text-gray-800 mb-4">Interest Payment Details</h3>
                    <div className="space-y-3 text-sm">
                      <div className="grid grid-cols-2 gap-2">
                        <span className="font-medium">Payment Mode:</span>
                        <span>{selectedFD.interestPayment}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <span className="font-medium">Last Paid:</span>
                        <span>{selectedFD.lastInterestPaid}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <span className="font-medium">Next Due:</span>
                        <span className="text-orange-600 font-medium">{selectedFD.nextInterestDue}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <span className="font-medium">Quarterly Amount:</span>
                        <span>LKR 11,875.00</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h3 className="font-semibold text-gray-800">Quick Actions</h3>
                    <div className="grid grid-cols-1 gap-3">
                      <Button 
                        type="button" 
                        onClick={payInterest}
                        className="bg-green-600 text-white hover:bg-green-700"
                      >
                        Pay Due Interest
                      </Button>
                      <Button 
                        type="button" 
                        onClick={renewFD}
                        className="bg-blue-600 text-white hover:bg-blue-700"
                      >
                        Renew FD
                      </Button>
                      <Button 
                        type="button" 
                        variant="secondary"
                        onClick={() => window.print()}
                      >
                        Print Statement
                      </Button>
                      <Button 
                        type="button" 
                        variant="danger"
                        onClick={closeFD}
                      >
                        Close FD (Premature)
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Create New FD Tab */}
          {activeTab === 'create' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Create New Fixed Deposit</h2>
              </div>

              <form onSubmit={handleCreateSubmit}>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <TextInput
                      label="Account Number"
                      name="accountNumber"
                      value={createForm.accountNumber}
                      onChange={handleCreateChange}
                      required
                      placeholder="Enter customer account number"
                    />

                    <TextInput
                      label="Deposit Amount (LKR)"
                      name="depositAmount"
                      value={createForm.depositAmount}
                      onChange={handleCreateChange}
                      required
                      placeholder="Minimum LKR 10,000"
                    />

                    <div>
                      <label className="block mb-2 text-gray-700 font-medium">Deposit Term</label>
                      <select
                        name="term"
                        value={createForm.term}
                        onChange={handleCreateChange}
                        required
                        className="w-full px-4 py-2 rounded-lg border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      >
                        <option value="">Select Term</option>
                        <option value="0.5 Years">6 Months (8.5% p.a.)</option>
                        <option value="1 Years">1 Year (9.0% p.a.)</option>
                        <option value="2 Years">2 Years (9.5% p.a.)</option>
                        <option value="3 Years">3 Years (10.0% p.a.)</option>
                        <option value="5 Years">5 Years (10.5% p.a.)</option>
                      </select>
                    </div>

                    <TextInput
                      label="Interest Rate (% p.a.)"
                      name="interestRate"
                      value={createForm.interestRate}
                      onChange={handleCreateChange}
                      required
                      placeholder="Auto-filled based on term"
                    />

                    <div>
                      <label className="block mb-2 text-gray-700 font-medium">Interest Payment</label>
                      <select
                        name="interestPayment"
                        value={createForm.interestPayment}
                        onChange={handleCreateChange}
                        required
                        className="w-full px-4 py-2 rounded-lg border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      >
                        <option value="maturity">At Maturity (Compound)</option>
                        <option value="monthly">Monthly Payout</option>
                        <option value="quarterly">Quarterly Payout</option>
                        <option value="yearly">Yearly Payout</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <div className="flex items-center space-x-2">
                        <TextInput
                          label="FD Number"
                          name="receiptNumber"
                          value={createForm.receiptNumber}
                          onChange={handleCreateChange}
                          required
                          placeholder="Generate FD number"
                        />
                        <Button
                          type="button"
                          onClick={generateFDNumber}
                          variant="secondary"
                          size="sm"
                          className="mt-6"
                        >
                          Generate
                        </Button>
                      </div>
                    </div>

                    <div>
                      <label className="block mb-2 text-gray-700 font-medium">Nominee Details</label>
                      <textarea
                        name="nomineeDetails"
                        value={createForm.nomineeDetails}
                        onChange={handleCreateChange}
                        rows={3}
                        className="w-full px-4 py-2 rounded-lg border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        placeholder="Nominee name, relationship, contact details..."
                      />
                    </div>

                    <div>
                      <label className="block mb-2 text-gray-700 font-medium">Special Instructions</label>
                      <textarea
                        name="specialInstructions"
                        value={createForm.specialInstructions}
                        onChange={handleCreateChange}
                        rows={3}
                        className="w-full px-4 py-2 rounded-lg border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        placeholder="Any special instructions for this FD..."
                      />
                    </div>

                    {/* Maturity Calculation */}
                    {createForm.depositAmount && createForm.interestRate && createForm.term && (
                      <div className="bg-green-50 p-4 rounded-lg">
                        <h4 className="font-semibold text-gray-800 mb-3">Maturity Calculation</h4>
                        <div className="text-sm text-gray-700 space-y-2">
                          <div><strong>Principal Amount:</strong> LKR {parseFloat(createForm.depositAmount).toLocaleString()}</div>
                          <div><strong>Interest Rate:</strong> {createForm.interestRate}% per annum</div>
                          <div><strong>Term:</strong> {createForm.term}</div>
                          <div className="pt-2 border-t">
                            <strong>Maturity Amount:</strong> LKR {calculateMaturityAmount().toLocaleString()}
                          </div>
                          <div><strong>Total Interest:</strong> LKR {(calculateMaturityAmount() - parseFloat(createForm.depositAmount || '0')).toLocaleString()}</div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex justify-end mt-8 pt-6 border-t border-gray-300">
                  <div className="flex space-x-4">
                    <Button type="button" variant="secondary">
                      Save as Draft
                    </Button>
                    <Button
                      type="submit"
                      disabled={!createForm.accountNumber || !createForm.depositAmount || !createForm.term || !createForm.receiptNumber}
                      className={`bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-700 ${(!createForm.accountNumber || !createForm.depositAmount || !createForm.term || !createForm.receiptNumber) ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      Create Fixed Deposit
                    </Button>
                  </div>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}