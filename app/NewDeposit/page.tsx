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
        <h1 className="text-3xl font-semibold text-gray-900">New Deposits</h1>
        <p className="text-m text-gray-500">Process deposit transactions for customers</p>
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

export default function NewDepositsPage() {
  const [form, setForm] = useState({
    accountNumber: '',
    depositAmount: '',
    depositType: 'savings',
    paymentMethod: 'cash',
    chequeNumber: '',
    chequeBank: '',
    chequeDate: '',
    remarks: '',
    receiptNumber: ''
  });

  const [accountInfo, setAccountInfo] = useState({
    customerName: '',
    accountType: '',
    currentBalance: '',
    isValid: false
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    
    if (e.target.name === 'accountNumber' && e.target.value.length >= 10) {
      // Mock account validation - in real app, this would be an API call
      setAccountInfo({
        customerName: 'John Doe',
        accountType: 'Savings Account',
        currentBalance: '45,250.00',
        isValid: true
      });
    } else if (e.target.name === 'accountNumber') {
      setAccountInfo({
        customerName: '',
        accountType: '',
        currentBalance: '',
        isValid: false
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert(
      `Deposit of LKR ${form.depositAmount} processed for account ${form.accountNumber} (${accountInfo.customerName})`
    );
  };

  const generateReceiptNumber = () => {
    const receiptNum = 'DEP' + Date.now().toString().slice(-8);
    setForm({ ...form, receiptNumber: receiptNum });
  };

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="mx-auto px-8 py-6 max-w-7xl">
        <Header activeTab="deposits" />
        
        {/* Form Content */}
        <div className="bg-white rounded-lg border border-gray-200 p-8">
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              
              {/* Left Column - Account & Deposit Details */}
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Account & Deposit Information</h2>
                </div>

                {/* Account Number */}
                <div>
                  <TextInput
                    label="Account Number"
                    name="accountNumber"
                    value={form.accountNumber}
                    onChange={handleChange}
                    required
                    placeholder="Enter customer account number"
                  />
                </div>

                {/* Account Info Display */}
                {accountInfo.isValid && (
                  <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-200">
                    <h3 className="font-semibold text-gray-800 mb-3">Account Details</h3>
                    <div className="space-y-2 text-sm">
                      <div><strong>Customer Name:</strong> {accountInfo.customerName}</div>
                      <div><strong>Account Type:</strong> {accountInfo.accountType}</div>
                      <div><strong>Current Balance:</strong> LKR {accountInfo.currentBalance}</div>
                    </div>
                  </div>
                )}

                {/* Deposit Amount */}
                <div>
                  <TextInput
                    label="Deposit Amount (LKR)"
                    name="depositAmount"
                    value={form.depositAmount}
                    onChange={handleChange}
                    required
                    placeholder="Enter deposit amount"
                  />
                </div>

                {/* Deposit Type */}
                <div>
                  <label className="block mb-2 text-gray-700 font-medium">Deposit Type</label>
                  <select
                    name="depositType"
                    value={form.depositType}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="savings">Savings Deposit</option>
                    <option value="current">Current Account Deposit</option>
                    <option value="loan">Loan Payment</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                {/* New Balance Preview */}
                {form.depositAmount && accountInfo.isValid && (
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-gray-800 mb-2">Balance Preview</h4>
                    <div className="text-sm text-gray-700 space-y-1">
                      <div><strong>Current Balance:</strong> LKR {accountInfo.currentBalance}</div>
                      <div><strong>Deposit Amount:</strong> LKR {form.depositAmount}</div>
                      <div className="pt-2 border-t"><strong>New Balance:</strong> LKR {(parseFloat(accountInfo.currentBalance.replace(/,/g, '')) + parseFloat(form.depositAmount || '0')).toLocaleString()}</div>
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column - Payment & Transaction Details */}
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Payment & Transaction Details</h2>
                </div>

                {/* Payment Method */}
                <div>
                  <label className="block mb-2 text-gray-700 font-medium">Payment Method</label>
                  <select
                    name="paymentMethod"
                    value={form.paymentMethod}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="cash">Cash</option>
                    <option value="cheque">Cheque</option>
                    <option value="transfer">Bank Transfer</option>
                    <option value="card">Debit Card</option>
                  </select>
                </div>

                {/* Cheque Details (conditional) */}
                {form.paymentMethod === 'cheque' && (
                  <div className="bg-yellow-50 p-4 rounded-lg space-y-4">
                    <h4 className="font-semibold text-gray-800">Cheque Details</h4>
                    <TextInput
                      label="Cheque Number"
                      name="chequeNumber"
                      value={form.chequeNumber}
                      onChange={handleChange}
                      required
                    />
                    <TextInput
                      label="Cheque Bank"
                      name="chequeBank"
                      value={form.chequeBank}
                      onChange={handleChange}
                      required
                    />
                    <div>
                      <label className="block mb-1 text-gray-700">Cheque Date</label>
                      <input
                        type="date"
                        name="chequeDate"
                        value={form.chequeDate}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-2 rounded-lg border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  </div>
                )}

                {/* Receipt Number */}
                <div>
                  <div className="flex items-center space-x-2">
                    <TextInput
                      label="Receipt Number"
                      name="receiptNumber"
                      value={form.receiptNumber}
                      onChange={handleChange}
                      required
                      placeholder="Generate or enter receipt number"
                    />
                    <Button
                      type="button"
                      onClick={generateReceiptNumber}
                      variant="secondary"
                      size="md"
                      className="mt-6"
                    >
                      Generate
                    </Button>
                  </div>
                </div>

                {/* Remarks */}
                <div>
                  <label className="block mb-2 text-gray-700 font-medium">Remarks</label>
                  <textarea
                    name="remarks"
                    value={form.remarks}
                    onChange={handleChange}
                    rows={4}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="Additional notes or remarks about this transaction..."
                  />
                </div>

                {/* Transaction Summary */}
                {form.depositAmount && accountInfo.isValid && (
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-gray-800 mb-3">Transaction Summary</h4>
                    <div className="text-sm text-gray-700 space-y-1">
                      <div><strong>Customer:</strong> {accountInfo.customerName}</div>
                      <div><strong>Account:</strong> {form.accountNumber}</div>
                      <div><strong>Amount:</strong> LKR {form.depositAmount}</div>
                      <div><strong>Method:</strong> {form.paymentMethod.charAt(0).toUpperCase() + form.paymentMethod.slice(1)}</div>
                      <div><strong>Receipt:</strong> {form.receiptNumber || 'Not generated'}</div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end mt-8 pt-6 border-t border-gray-300">
              <div className="flex space-x-4">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => window.print()}
                >
                  Print Receipt
                </Button>
                <Button
                  type="submit"
                  disabled={!accountInfo.isValid || !form.depositAmount || !form.receiptNumber}
                  className={`bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-700 ${(!accountInfo.isValid || !form.depositAmount || !form.receiptNumber) ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  Process Deposit
                </Button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}