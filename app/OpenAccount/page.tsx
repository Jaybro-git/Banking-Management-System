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

export default function OpenAccountPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [form, setForm] = useState({
    accountType: '',
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    postalCode: '',
    nicNumber: '',
    occupation: '',
    monthlyIncome: '',
    initialDeposit: '',
    // Joint account specific fields
    jointFirstName: '',
    jointLastName: '',
    jointEmail: '',
    jointPhone: '',
    jointNicNumber: '',
    // Fixed deposit specific fields
    depositTerm: '',
    maturityInstructions: 'renew'
  });

  const steps = [
    { number: 1, title: 'Account Type', subtitle: 'Product Selection', isActive: currentStep === 1, isCompleted: currentStep > 1 },
    { number: 2, title: 'Personal Details', subtitle: 'Customer Information', isActive: currentStep === 2, isCompleted: currentStep > 2 },
    { number: 3, title: 'Review and Submit', subtitle: 'Confirmation', isActive: currentStep === 3, isCompleted: false }
  ];

  const accountTypes = [
    {
      id: 'savings',
      title: 'Savings',
      subtitle: 'Secure your future with smart savings',
      minDeposit: '1,000',
      interestRate: '4%',
      features: ['Free ATM transactions', 'Online banking access', '4% annual interest']
    },
    {
      id: 'children',
      title: 'Children\'s Account',
      subtitle: 'Educational savings for kids under 12',
      minDeposit: '500',
      interestRate: '5%',
      features: ['5% annual interest rate', 'Educational programs', 'No monthly fees']
    },
    {
      id: 'teen',
      title: 'Teen Account',
      subtitle: 'Banking for teenagers 13-17',
      minDeposit: '500',
      interestRate: '4.5%',
      features: ['Debit card included', 'Financial literacy programs', '4.5% interest']
    },
    {
      id: 'joint',
      title: 'Joint Account',
      subtitle: 'Shared banking for couples or families',
      minDeposit: '2,000',
      interestRate: '4%',
      features: ['Dual access', 'Joint monitoring', '4% annual interest']
    },
    {
      id: 'fixed',
      title: 'Fixed Deposit',
      subtitle: 'Grow your wealth with secure investments',
      minDeposit: '10,000',
      interestRate: 'Up to 10.5%',
      features: ['Guaranteed returns', 'Flexible terms', 'Up to 10.5% returns']
    }
  ];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleNext = () => {
    if (currentStep < 3) setCurrentStep(currentStep + 1);
  };

  const handlePrevious = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert(
      `Opening ${form.accountType} account for ${form.firstName} ${form.lastName} with initial deposit: LKR ${form.initialDeposit}`
    );
  };

  const getSelectedAccountType = () => {
    return accountTypes.find(type => type.id === form.accountType);
  };

  const getMinimumDeposit = () => {
    return getSelectedAccountType()?.minDeposit || '0';
  };

  const isStepValid = (step: number) => {
    switch (step) {
      case 1:
        return form.accountType && form.firstName && form.lastName && form.dateOfBirth;
      case 2:
        return form.email && form.phone && form.address && form.nicNumber && form.occupation && form.monthlyIncome;
      case 3:
        return form.initialDeposit;
      default:
        return false;
    }
  };

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="mx-auto px-8 py-6 max-w-7xl">
        <Header activeTab="accounts" />
        
        {/* Progress Steps */}
        <div className="mb-8 flex justify-center">
          <div className="inline-flex items-center max-w-8xl">
            {steps.map((step, index) => (
              <div key={step.number} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center text-sm font-semibold border-2 mb-2 transition-all
                    ${step.isCompleted 
                      ? 'bg-emerald-600 border-emerald-600 text-white' 
                      : step.isActive 
                        ? 'bg-emerald-50 border-emerald-500 text-gray-900'
                        : 'bg-white border-gray-300 text-gray-500'
                    }`}>
                    {step.isCompleted ? '✓' : step.number}
                  </div>
                  <div className="text-center">
                    <div className={`text-sm font-medium ${step.isActive ? 'text-gray-900' : 'text-gray-400'}`}>
                      {step.title}
                    </div>
                    <div className="text-xs text-gray-400">
                      {step.subtitle}
                    </div>
                  </div>
                </div>
                {index < steps.length - 1 && (
                  <div className={`w-60 h-px mx-4 mt-6 ${step.isCompleted ? 'bg-teal-600' : 'bg-gray-200'}`} />
                )}
              </div>
            ))}
          </div>
        </div>


        {/* Form Content */}
        <div className="bg-white rounded-lg border border-gray-200 p-8">
          <form onSubmit={handleSubmit}>
            {/* Step 1: Account Type Selection */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">Account Type</h2>
                  <p className="text-gray-600 mb-6">Choose the banking option and fill the required data of the customer.</p>
                </div>

                {/* Account Type*/}
                <div>
                  <select
                    name="accountType"
                    value={form.accountType}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="">Select Account Type</option>
                    <option value="savings">Savings Account</option>
                    <option value="children">Children's Account (Under 12)</option>
                    <option value="teen">Teen Account (13-17)</option>
                    <option value="joint">Joint Account</option>
                    <option value="fixed">Fixed Deposit Account</option>
                  </select>
                </div>

                {/* Selected Account Details */}
                {form.accountType && (
                  <div className="py-3">
                    <h3 className="font-semibold text-gray-900 mb-3">
                      {getSelectedAccountType()?.title} Account
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                          <TextInput
                            label="First Name"
                            name="firstName"
                            value={form.firstName}
                            onChange={handleChange}
                            required
                          />
                          <TextInput
                            label="Last Name"
                            name="lastName"
                            value={form.lastName}
                            onChange={handleChange}
                            required
                          />
                        </div>
                        <TextInput
                          label="NIC Number"
                          name="nicNumber"
                          value={form.nicNumber}
                          onChange={handleChange}
                          required
                        />
                        <div>
                          <label className="block mb-1 text-gray-700">Date of Birth</label>
                          <input
                            type="date"
                            name="dateOfBirth"
                            value={form.dateOfBirth}
                            onChange={handleChange}
                            required
                            className="w-full px-4 py-2 rounded-lg border border-gray-300 bg-gray-100 focus:outline-none focus:ring-2 focus:ring-teal-500"
                          />
                        </div>
                      </div>
                      <div className="bg-emerald-10 p-4 rounded-lg border border-gray-300">
                        <h4 className="font-semibold text-gray-800 mb-3">Account Benefits</h4>
                        <ul className="text-sm text-gray-700 space-y-2">
                          {getSelectedAccountType()?.features.map((feature, index) => (
                            <li key={index} className="flex items-start">
                              <span className="text-teal-600 mr-2">•</span>
                              {feature}
                            </li>
                          ))}
                        </ul>
                        <div className="mt-4 pt-4 border-t">
                          <div className="text-sm text-gray-600">
                            <div><strong>Interest rate:</strong> {getSelectedAccountType()?.interestRate}</div>
                            <div><strong>Minimum deposit:</strong> LKR {getSelectedAccountType()?.minDeposit}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Step 2: Personal Details */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">Personal Details</h2>
                  <p className="text-gray-600 mb-6">Please provide customer contact and employment information.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <h3 className="font-medium text-gray-900">Contact Information</h3>
                    <TextInput
                      label="Email Address"
                      type="email"
                      name="email"
                      value={form.email}
                      onChange={handleChange}
                      required
                    />
                    <TextInput
                      label="Phone Number"
                      type="tel"
                      name="phone"
                      value={form.phone}
                      onChange={handleChange}
                      required
                    />
                    <TextInput
                      label="Address"
                      name="address"
                      value={form.address}
                      onChange={handleChange}
                      required
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <TextInput
                        label="City"
                        name="city"
                        value={form.city}
                        onChange={handleChange}
                        required
                      />
                      <TextInput
                        label="Postal Code"
                        name="postalCode"
                        value={form.postalCode}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-medium text-gray-900">Employment Details</h3>
                    <TextInput
                      label="Occupation"
                      name="occupation"
                      value={form.occupation}
                      onChange={handleChange}
                      required
                    />
                    <TextInput
                      label="Monthly Income (LKR)"
                      name="monthlyIncome"
                      value={form.monthlyIncome}
                      onChange={handleChange}
                      required
                    />

                    {/* Joint Account Fields */}
                    {form.accountType === 'joint' && (
                      <div className="bg-yellow-50 p-4 rounded-lg">
                        <h4 className="font-semibold text-gray-800 mb-3">Joint Account Holder</h4>
                        <div className="space-y-3">
                          <div className="grid grid-cols-2 gap-2">
                            <TextInput
                              label="First Name"
                              name="jointFirstName"
                              value={form.jointFirstName}
                              onChange={handleChange}
                              required
                            />
                            <TextInput
                              label="Last Name"
                              name="jointLastName"
                              value={form.jointLastName}
                              onChange={handleChange}
                              required
                            />
                          </div>
                          <TextInput
                          label="NIC Number"
                          name="nicNumber"
                          value={form.nicNumber}
                          onChange={handleChange}
                          required
                          />
                        </div>
                      </div>
                    )}

                    {/* Fixed Deposit Fields */}
                    {form.accountType === 'fixed' && (
                      <div className="bg-yellow-50 px-4 py-6 rounded-lg">
                        <h4 className="font-semibold text-gray-800 mb-3">Fixed Deposit Terms</h4>
                        <div>
                          <label className="block mb-2 text-gray-700">Deposit Term</label>
                          <select
                            name="depositTerm"
                            value={form.depositTerm}
                            onChange={handleChange}
                            required
                            className="w-full px-4 py-2 rounded-lg border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                          >
                            <option value="">Select Term</option>
                            <option value="6months">6 Months (8.5% p.a.)</option>
                            <option value="1year">1 Year (9.0% p.a.)</option>
                            <option value="2years">2 Years (9.5% p.a.)</option>
                            <option value="3years">3 Years (10.0% p.a.)</option>
                            <option value="5years">5 Years (10.5% p.a.)</option>
                          </select>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Review & Submit */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">Review and Submit</h2>
                  <p className="text-gray-600 mb-6">Please review all information and confirm the account opening.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <div className="bg-emerald-50 p-4 rounded-lg">
                      <h3 className="font-semibold text-gray-800 mb-3">Account Summary</h3>
                      <div className="space-y-2 text-sm">
                        <div><strong>Account Type:</strong> {getSelectedAccountType()?.title}</div>
                        <div><strong>Account Holder:</strong> {form.firstName} {form.lastName}</div>
                        <div><strong>NIC:</strong> {form.nicNumber}</div>
                        <div><strong>Email:</strong> {form.email}</div>
                        <div><strong>Phone:</strong> {form.phone}</div>
                      </div>
                    </div>

                    <div className="py-4">
                      <TextInput
                        label={`Initial deposit amount (LKR) - Minimum: ${getSelectedAccountType()?.minDeposit}`}
                        name="initialDeposit"
                        value={form.initialDeposit}
                        onChange={handleChange}
                        required
                      />
                      <p className="text-sm text-gray-600 mt-2">
                        Enter the amount that the customer would like to open the account with.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="bg-yellow-50 p-4 rounded-lg">
                      <h3 className="font-semibold text-gray-800 mb-3">Terms & Conditions</h3>
                      <div className="space-y-2 text-sm text-gray-700">
                        <div>• I agree to the bank's terms and conditions</div>
                        <div>• I confirm all information provided is accurate</div>
                        <div>• I understand the account fees and charges</div>
                        <div>• I acknowledge the minimum balance requirements</div>
                      </div>
                    </div>

                    <div className="bg-green-50 p-4 rounded-lg">
                      <h3 className="font-semibold text-gray-800 mb-2">Next Steps</h3>
                      <div className="text-sm text-gray-700 space-y-1">
                        <div>• Account will be activated within 24 hours</div>
                        <div>• Debit card will be mailed within 5-7 days</div>
                        <div>• Online banking access will be provided</div>
                        <div>• Welcome kit will be sent to your address</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-300">
              <Button
                type="button"
                onClick={handlePrevious}
                variant="secondary"
                className={` ${currentStep === 1 ? 'invisible' : ''}`}
              >
                ← Go back
              </Button>
              
              {currentStep < 3 ? (
                <Button
                  type="button"
                  onClick={handleNext}
                  disabled={!isStepValid(currentStep)}
                  className={`bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-700 ${!isStepValid(currentStep) ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  Next step
                </Button>
              ) : (
                <Button
                  type="submit"
                  disabled={!isStepValid(currentStep)}
                  className={`bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-700 ${!isStepValid(currentStep) ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  Open Account
                </Button>
              )}
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}