'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { Button } from '@/app/components/ui/Button';
import { TextInput } from '@/app/components/ui/TextInput';
import CustomerForm, { CustomerFormData, CustomerData } from '@/app/components/CustomerForm';

interface HeaderProps {
  activeTab: string;
}

const Header: React.FC<HeaderProps> = ({ activeTab }) => {
  return (
    <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 space-y-4 sm:space-y-0">
      <div>
        <h1 className="text-3xl font-semibold text-gray-900">Open Account</h1>
        <p className="text-m text-gray-500">Create new customer banking accounts</p>
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

interface AccountType {
  account_type_id: string;
  account_type_name: string;
  interest_rate: string;
  min_age: number;
  max_age: number;
  minimum_balance: string;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

const defaultCustomerForm: CustomerFormData = {
  customerId: '',
  firstName: '',
  lastName: '',
  dateOfBirth: '',
  gender: '',
  email: '',
  phone: '',
  address: '',
  nicNumber: '',
  customerType: null,
  existingCustomer: null,
};

export default function OpenAccountPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [accountTypes, setAccountTypes] = useState<AccountType[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    accountType: '',
    initialDeposit: '',
    numberOfCustomers: 2,
  });
  const [customerForms, setCustomerForms] = useState<CustomerFormData[]>([{ ...defaultCustomerForm }]);

  const steps = [
    { number: 1, title: 'Account Type', subtitle: 'Product Selection', isActive: currentStep === 1, isCompleted: currentStep > 1 },
    { number: 2, title: 'Customer Details', subtitle: 'Customer Information', isActive: currentStep === 2, isCompleted: currentStep > 2 },
    { number: 3, title: 'Review and Submit', subtitle: 'Confirmation', isActive: currentStep === 3, isCompleted: false }
  ];

  // Fetch account types on mount
  useEffect(() => {
    fetchAccountTypes();
  }, []);

  // Reset customer forms when account type changes
  useEffect(() => {
    if (form.accountType) {
      if (isJointAccount()) {
        setForm(prev => ({ ...prev, numberOfCustomers: 2 }));
        setCustomerForms([{ ...defaultCustomerForm }, { ...defaultCustomerForm }]);
      } else {
        setForm(prev => ({ ...prev, numberOfCustomers: 1 }));
        setCustomerForms([{ ...defaultCustomerForm }]);
      }
    }
  }, [form.accountType]);

  const fetchAccountTypes = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/accounts/account-types`, {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch account types');
      const data = await response.json();
      setAccountTypes(data);
    } catch (err) {
      console.error('Error fetching account types:', err);
      setError('Failed to load account types');
    }
  };

  const checkExistingCustomer = async (index: number) => {
    const customerForm = customerForms[index];
    if (!customerForm.nicNumber) {
      setError('Please enter NIC number');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/api/accounts/customer/check/${customerForm.nicNumber}`, {
        credentials: 'include'
      });

      if (response.status === 404) {
        setError('Customer not found. Please register as new customer.');
        updateCustomerForm(index, { existingCustomer: null });
        return;
      }
      if (!response.ok) throw new Error('Failed to check customer');

      const data: CustomerData = await response.json();
      
      updateCustomerForm(index, {
        existingCustomer: data,
        customerId: data.customer_id,
        firstName: data.first_name,
        lastName: data.last_name,
        dateOfBirth: data.date_of_birth,
        gender: data.gender.toLowerCase(),
        email: data.email,
        phone: data.phone_number,
        address: data.address,
        customerType: 'existing'
      });

    } catch (err) {
      console.error('Error checking customer:', err);
      setError('Failed to check customer');
    } finally {
      setLoading(false);
    }
  };

  const updateCustomerForm = (index: number, updates: Partial<CustomerFormData>) => {
    setCustomerForms(prev => prev.map((form, i) => 
      i === index ? { ...form, ...updates } : form
    ));
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError(null);
  };

  const handleNumberOfCustomersChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const count = Math.min(6, Math.max(2, parseInt(e.target.value) || 2));
    setForm({ ...form, numberOfCustomers: count });
    
    if (count > customerForms.length) {
      const newForms = Array.from({ length: count - customerForms.length }, () => ({ ...defaultCustomerForm }));
      setCustomerForms(prev => [...prev, ...newForms]);
    } else if (count < customerForms.length) {
      setCustomerForms(prev => prev.slice(0, count));
    }
  };

  const handleNext = () => {
    if (currentStep < 3 && isStepValid(currentStep)) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isJointAccount()) {
        const payload = {
          accountTypeId: form.accountType,
          initialDeposit: parseFloat(form.initialDeposit || '0'),
          customers: customerForms.map(customerForm => ({
            customerId: customerForm.customerId,
            firstName: customerForm.firstName,
            lastName: customerForm.lastName,
            nicNumber: customerForm.nicNumber,
            dateOfBirth: customerForm.dateOfBirth,
            gender: customerForm.gender,
            phoneNumber: customerForm.phone,
            email: customerForm.email,
            address: customerForm.address,
          }))
        };

        const response = await fetch(`${API_BASE_URL}/api/accounts/account/joint/open`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(payload),
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Failed to open joint account');

        const customerNames = data.customers?.map((c: any) => `${c.first_name} ${c.last_name}`).join(', ');
        
        alert(
          `✅ Success!\n\nCustomers: ${customerNames}\nAccount ID: ${data.account.account_id}\nInitial Balance: LKR ${data.account.initial_balance}`
        );
      } else {
        const primaryCustomer = customerForms[0];
        const payload = {
          customerId: primaryCustomer.customerId,
          firstName: primaryCustomer.firstName,
          lastName: primaryCustomer.lastName,
          nicNumber: primaryCustomer.nicNumber,
          dateOfBirth: primaryCustomer.dateOfBirth,
          gender: primaryCustomer.gender,
          phoneNumber: primaryCustomer.phone,
          email: primaryCustomer.email,
          address: primaryCustomer.address,
          accountTypeId: form.accountType,
          initialDeposit: parseFloat(form.initialDeposit || '0'),
        };

        const response = await fetch(`${API_BASE_URL}/api/accounts/account/register-and-open`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(payload),
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Failed to open account');

        alert(
          `✅ Success!\n\nCustomer: ${data.customer.first_name} ${data.customer.last_name}\nCustomer ID: ${data.customer.customer_id}\nAccount ID: ${data.account.account_id}\nInitial Balance: LKR ${data.account.initial_balance}`
        );
      }
      
      window.location.href = '/';
    } catch (err: any) {
      console.error('Error opening account:', err);
      setError(err.message || 'Failed to open account');
    } finally {
      setLoading(false);
    }
  };

  const getSelectedAccountType = (): AccountType | undefined =>
    accountTypes.find(type => type.account_type_id === form.accountType);

  const getMinimumDeposit = (): string => getSelectedAccountType()?.minimum_balance || '0';

  const getAccountFeatures = (): string[] => {
    const type = getSelectedAccountType();
    if (!type) return [];
    const features = [
      `${type.interest_rate}% interest rate`,
      `Minimum balance: LKR ${type.minimum_balance}`,
    ];
    if (type.min_age && type.max_age) {
      features.push(`Age requirement: ${type.min_age}-${type.max_age} years`);
    }
    return features;
  };

  const isJointAccount = (): boolean => {
    const accountType = getSelectedAccountType();
    return accountType?.account_type_name.toLowerCase().includes('joint') || false;
  };

  const isStepValid = (step: number): boolean => {
    switch (step) {
      case 1:
        return !!form.accountType;
      case 2:
        return customerForms.every((customerForm, index) => {
          if (customerForm.customerType === 'existing') {
            return !!customerForm.nicNumber && !!customerForm.existingCustomer;
          }
          if (customerForm.customerType === 'new') {
            return !!(
              customerForm.firstName &&
              customerForm.lastName &&
              customerForm.nicNumber &&
              customerForm.dateOfBirth &&
              customerForm.gender &&
              customerForm.phone &&
              customerForm.email &&
              customerForm.address
            );
          }
          return false;
        });
      case 3:
        const minDeposit = parseFloat(getMinimumDeposit());
        const deposit = parseFloat(form.initialDeposit || '0');
        return !!form.initialDeposit && deposit >= minDeposit;
      default:
        return false;
    }
  };

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="mx-auto px-8 py-6 max-w-7xl">
        <Header activeTab="accounts" />

        {/* Error */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {/* Steps */}
        <div className="mb-8 flex justify-center overflow-x-auto">
          <div className="inline-flex items-center">
            {steps.map((step, index) => (
              <div key={step.number} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center text-sm font-semibold border-2 mb-2
                      ${step.isCompleted
                        ? 'bg-emerald-600 border-emerald-600 text-white'
                        : step.isActive
                        ? 'bg-emerald-50 border-emerald-500 text-gray-900'
                        : 'bg-white border-gray-300 text-gray-500'
                    }`}
                  >
                    {step.isCompleted ? '✓' : step.number}
                  </div>
                  <div className="text-center min-w-[120px]">
                    <div className={`text-sm font-medium ${step.isActive ? 'text-gray-900' : 'text-gray-400'}`}>
                      {step.title}
                    </div>
                    <div className="text-xs text-gray-400">{step.subtitle}</div>
                  </div>
                </div>
                {index < steps.length - 1 && (
                  <div className={`w-24 sm:w-32 md:w-48 lg:w-60 h-px mx-4 mt-6 flex-shrink-0 ${step.isCompleted ? 'bg-teal-600' : 'bg-gray-200'}`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Form */}
        <div className="bg-white rounded-lg border border-gray-200 p-8">
          <form onSubmit={handleSubmit}>
            {/* Step 1 */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Account Type</h2>
                <p className="text-gray-600 mb-6">Choose the account type for the customer.</p>

                <select
                  name="accountType"
                  value={form.accountType}
                  onChange={handleFormChange}
                  required
                  className="w-full px-4 py-2 rounded-lg border border-gray-300"
                >
                  <option value="">Select Account Type</option>
                  {accountTypes.map(type => (
                    <option key={type.account_type_id} value={type.account_type_id}>
                      {type.account_type_name}
                    </option>
                  ))}
                </select>

                {isJointAccount() && (
                  <div className="mt-4">
                    <label className="block mb-2 text-gray-700">Number of Account Holders</label>
                    <input
                      type="number"
                      name="numberOfCustomers"
                      min="2"
                      max="6"
                      value={form.numberOfCustomers}
                      onChange={handleNumberOfCustomersChange}
                      required
                      className="w-full px-4 py-2 rounded-lg border border-gray-300"
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      Joint accounts require 2-6 account holders (all have equal rights)
                    </p>
                  </div>
                )}

                {form.accountType && (
                  <div className="bg-emerald-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-gray-800 mb-3">Account Benefits</h4>
                    <ul className="text-sm text-gray-700 space-y-2">
                      {getAccountFeatures().map((feature, index) => (
                        <li key={index} className="flex items-start">
                          <span className="text-teal-600 mr-2">•</span>
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Step 2 */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  {isJointAccount() ? 'Joint Account Holders' : 'Customer Details'}
                </h2>
                <p className="text-gray-600 mb-6">
                  {isJointAccount() 
                    ? `Enter details for all ${form.numberOfCustomers} account holders (all have equal rights)`
                    : 'Enter customer information'
                  }
                </p>

                {customerForms.map((customerForm, index) => (
                  <CustomerForm
                    key={index}
                    index={index}
                    customerForm={customerForm}
                    onChange={updateCustomerForm}
                    onCheckExisting={checkExistingCustomer}
                    loading={loading}
                    variant={isJointAccount() ? 'joint' : 'single'}
                  />
                ))}
              </div>
            )}

            {/* Step 3 */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Review and Submit</h2>
                <p className="text-gray-600 mb-6">Please review all information and confirm the account opening.</p>

                <div className="bg-emerald-50 p-4 rounded-lg space-y-4">
                  <h3 className="font-semibold text-gray-800 mb-3">Account Summary</h3>
                  <p className="text-sm"><strong>Account Type:</strong> {getSelectedAccountType()?.account_type_name}</p>
                  <p className="text-sm"><strong>Interest Rate:</strong> {getSelectedAccountType()?.interest_rate}%</p>
                  
                  <div className="mt-4">
                    <h4 className="font-semibold text-gray-800 mb-2">
                      {isJointAccount() ? `Account Holders (${customerForms.length})` : 'Customer Details'}
                    </h4>
                    {customerForms.map((customer, index) => (
                      <div key={index} className="ml-4 mb-2">
                        <p className="text-sm">
                          {isJointAccount() 
                            ? <><strong>Holder {index + 1}:</strong> {customer.firstName} {customer.lastName} ({customer.nicNumber})</>
                            : <><strong>Customer:</strong> {customer.firstName} {customer.lastName} ({customer.nicNumber})</>
                          }
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <TextInput
                  label={`Initial Deposit (Minimum: LKR ${getMinimumDeposit()})`}
                  name="initialDeposit"
                  type="number"
                  value={form.initialDeposit}
                  onChange={handleFormChange}
                  required
                />
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="mt-8 flex justify-between">
              {currentStep > 1 && (
                <Button type="button" variant="secondary" onClick={handlePrevious}>
                  Previous
                </Button>
              )}
              {currentStep < 3 && (
                <Button type="button" variant="primary" onClick={handleNext} disabled={!isStepValid(currentStep)}>
                  Next
                </Button>
              )}
              {currentStep === 3 && (
                <Button type="submit" variant="primary" disabled={!isStepValid(3) || loading}>
                  {loading ? 'Submitting...' : 'Submit'}
                </Button>
              )}
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}