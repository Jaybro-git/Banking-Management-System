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
        <h1 className="text-3xl font-semibold text-gray-900">Withdrawal</h1>
        <p className="text-m text-gray-500">Process customer withdrawal requests</p>
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

export default function WithdrawalPage() {
  const [form, setForm] = useState({
    accountNumber: '',
    withdrawalAmount: '',
    withdrawalType: 'cash',
    purpose: '',
    verificationMethod: 'id',
    idNumber: '',
    fingerprint: false,
    remarks: '',
    receiptNumber: ''
  });

  const [accountInfo, setAccountInfo] = useState({
    customerName: '',
    accountType: '',
    currentBalance: '',
    availableBalance: '',
    dailyLimit: '',
    todayWithdrawn: '',
    isValid: false
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const value = e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value;
    setForm({ ...form, [e.target.name]: value });
    
    // Simulate account lookup when account number changes
    if (e.target.name === 'accountNumber' && e.target.value.length >= 10) {
      setAccountInfo({
        customerName: 'John Doe',
        accountType: 'Savings Account',
        currentBalance: '45,250.00',
        availableBalance: '43,250.00',
        dailyLimit: '100,000.00',
        todayWithdrawn: '15,000.00',
        isValid: true
      });
    } else if (e.target.name === 'accountNumber') {
      setAccountInfo({
        customerName: '',
        accountType: '',
        currentBalance: '',
        availableBalance: '',
        dailyLimit: '',
        todayWithdrawn: '',
        isValid: false
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert(
      `Withdrawal of LKR ${form.withdrawalAmount} processed for account ${form.accountNumber} (${accountInfo.customerName})`
    );
  };

  const generateReceiptNumber = () => {
    const receiptNum = 'WTH' + Date.now().toString().slice(-8);
    setForm({ ...form, receiptNumber: receiptNum });
  };

  const getRemainingDailyLimit = () => {
    const daily = parseFloat(accountInfo.dailyLimit.replace(/,/g, ''));
    const withdrawn = parseFloat(accountInfo.todayWithdrawn.replace(/,/g, ''));
    return (daily - withdrawn).toLocaleString();
  };

  const canWithdraw = () => {
    if (!form.withdrawalAmount || !accountInfo.isValid) return true;
    const amount = parseFloat(form.withdrawalAmount);
    const available = parseFloat(accountInfo.availableBalance.replace(/,/g, ''));
    const dailyRemaining = parseFloat(getRemainingDailyLimit().replace(/,/g, ''));
    return amount <= available && amount <= dailyRemaining;
  };

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="mx-auto px-8 py-6 max-w-6xl">
        <Header activeTab="withdrawal" />
        
        <div className="bg-white rounded-lg border border-gray-200 p-8">
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              
              {/* Left Column - Account & Withdrawal Details */}
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Account & Withdrawal Information</h2>
                </div>

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

                {accountInfo.isValid && (
                  <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-200">
                    <h3 className="font-semibold text-gray-800 mb-3">Account Details</h3>
                    <div className="space-y-2 text-sm">
                      <div><strong>Customer Name:</strong> {accountInfo.customerName}</div>
                      <div><strong>Account Type:</strong> {accountInfo.accountType}</div>
                      <div><strong>Current Balance:</strong> LKR {accountInfo.currentBalance}</div>
                      <div><strong>Available Balance:</strong> LKR {accountInfo.availableBalance}</div>
                    </div>
                  </div>
                )}

                <div>
                  <TextInput
                    label="Withdrawal Amount (LKR)"
                    name="withdrawalAmount"
                    value={form.withdrawalAmount}
                    onChange={handleChange}
                    required
                    placeholder="Enter withdrawal amount"
                  />
                </div>

                <div>
                  <label className="block mb-2 text-gray-700 font-medium">Withdrawal Type</label>
                  <select
                    name="withdrawalType"
                    value={form.withdrawalType}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="cash">Cash Withdrawal</option>
                    <option value="cheque">Cheque Withdrawal</option>
                    <option value="transfer">Transfer to Another Account</option>
                  </select>
                </div>

                <div>
                  <label className="block mb-2 text-gray-700 font-medium">Purpose</label>
                  <select
                    name="purpose"
                    value={form.purpose}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="">Select Purpose</option>
                    <option value="personal">Personal Use</option>
                    <option value="business">Business</option>
                    <option value="medical">Medical Emergency</option>
                    <option value="education">Education</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                {/* Withdrawal Limits & Warnings */}
                {accountInfo.isValid && (
                  <div className="bg-yellow-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-gray-800 mb-2">Daily Limits</h4>
                    <div className="text-sm text-gray-700 space-y-1">
                      <div><strong>Daily Limit:</strong> LKR {accountInfo.dailyLimit}</div>
                      <div><strong>Already Withdrawn Today:</strong> LKR {accountInfo.todayWithdrawn}</div>
                      <div><strong>Remaining Limit:</strong> LKR {getRemainingDailyLimit()}</div>
                    </div>
                    {!canWithdraw() && form.withdrawalAmount && (
                      <div className="mt-3 text-red-600 text-sm font-medium">
                        ⚠️ Withdrawal amount exceeds available balance or daily limit
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Right Column - Verification & Transaction Details */}
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Verification & Transaction Details</h2>
                </div>

                <div>
                  <label className="block mb-2 text-gray-700 font-medium">Verification Method</label>
                  <select
                    name="verificationMethod"
                    value={form.verificationMethod}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="id">National ID Card</option>
                    <option value="passport">Passport</option>
                    <option value="license">Driving License</option>
                    <option value="fingerprint">Biometric Verification</option>
                  </select>
                </div>

                {form.verificationMethod !== 'fingerprint' && (
                  <div>
                    <TextInput
                      label="ID Number"
                      name="idNumber"
                      value={form.idNumber}
                      onChange={handleChange}
                      required
                      placeholder="Enter ID number for verification"
                    />
                  </div>
                )}

                {form.verificationMethod === 'fingerprint' && (
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        name="fingerprint"
                        checked={form.fingerprint}
                        onChange={handleChange}
                        className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
                      />
                      <label className="text-sm font-medium text-gray-700">
                        Biometric verification completed successfully
                      </label>
                    </div>
                  </div>
                )}

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
                      size="sm"
                      className="mt-6"
                    >
                      Generate
                    </Button>
                  </div>
                </div>

                <div>
                  <label className="block mb-2 text-gray-700 font-medium">Remarks</label>
                  <textarea
                    name="remarks"
                    value={form.remarks}
                    onChange={handleChange}
                    rows={4}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="Additional notes about this withdrawal..."
                  />
                </div>

                {/* Balance After Withdrawal */}
                {form.withdrawalAmount && accountInfo.isValid && canWithdraw() && (
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-gray-800 mb-2">Balance After Withdrawal</h4>
                    <div className="text-sm text-gray-700 space-y-1">
                      <div><strong>Current Balance:</strong> LKR {accountInfo.currentBalance}</div>
                      <div><strong>Withdrawal Amount:</strong> LKR {form.withdrawalAmount}</div>
                      <div className="pt-2 border-t"><strong>New Balance:</strong> LKR {(parseFloat(accountInfo.currentBalance.replace(/,/g, '')) - parseFloat(form.withdrawalAmount || '0')).toLocaleString()}</div>
                    </div>
                  </div>
                )}

                {/* Transaction Summary */}
                {form.withdrawalAmount && accountInfo.isValid && (
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-gray-800 mb-3">Transaction Summary</h4>
                    <div className="text-sm text-gray-700 space-y-1">
                      <div><strong>Customer:</strong> {accountInfo.customerName}</div>
                      <div><strong>Account:</strong> {form.accountNumber}</div>
                      <div><strong>Amount:</strong> LKR {form.withdrawalAmount}</div>
                      <div><strong>Type:</strong> {form.withdrawalType.charAt(0).toUpperCase() + form.withdrawalType.slice(1)}</div>
                      <div><strong>Verification:</strong> {form.verificationMethod.toUpperCase()}</div>
                      <div><strong>Receipt:</strong> {form.receiptNumber || 'Not generated'}</div>
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
                  onClick={() => window.print()}
                >
                  Print Receipt
                </Button>
                <Button
                  type="submit"
                  disabled={!accountInfo.isValid || !form.withdrawalAmount || !form.receiptNumber || !canWithdraw() || !form.purpose}
                  className={`bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-700 ${(!accountInfo.isValid || !form.withdrawalAmount || !form.receiptNumber || !canWithdraw() || !form.purpose) ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  Process Withdrawal
                </Button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}