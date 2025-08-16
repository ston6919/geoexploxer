import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useRouter } from 'next/router';
import Head from 'next/head';
import axios from 'axios';
import Cookies from 'js-cookie';

interface OnboardingData {
  business_name: string;
  industry: string;
  business_description: string;
  year_founded: string;
  business_size: string;
  target_market: string;
  target_demographics: string;
  geographic_markets: string;
  products_services: string;
  unique_value_proposition: string;
  pricing_strategy: string;
  main_competitors: string;
  competitive_advantages: string;
  business_goals: string;
  current_challenges: string;
  current_marketing: string;
  brand_values: string;
  website_url: string;
}

const INDUSTRY_CHOICES = [
  { value: 'tech', label: 'Technology' },
  { value: 'healthcare', label: 'Healthcare' },
  { value: 'finance', label: 'Finance & Banking' },
  { value: 'retail', label: 'Retail & E-commerce' },
  { value: 'education', label: 'Education' },
  { value: 'other', label: 'Other' },
];

const BUSINESS_SIZE_CHOICES = [
  { value: 'startup', label: 'Startup (1-10 employees)' },
  { value: 'small', label: 'Small Business (11-50 employees)' },
  { value: 'medium', label: 'Medium Business (51-200 employees)' },
  { value: 'large', label: 'Large Business (200+ employees)' },
];

export default function Onboarding() {
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { user } = useAuth();
  const router = useRouter();

  const [formData, setFormData] = useState<OnboardingData>({
    business_name: '',
    industry: '',
    business_description: '',
    year_founded: '',
    business_size: '',
    target_market: '',
    target_demographics: '',
    geographic_markets: '',
    products_services: '',
    unique_value_proposition: '',
    pricing_strategy: '',
    main_competitors: '',
    competitive_advantages: '',
    business_goals: '',
    current_challenges: '',
    current_marketing: '',
    brand_values: '',
    website_url: '',
  });

  useEffect(() => {
    if (!user) {
      router.push('/');
    } else {
      // Load existing business profile data if it exists
      loadExistingProfile();
    }
  }, [user, router]);

  const loadExistingProfile = async () => {
    try {
      const response = await axios.get('/api/business/profile/');
      if (response.data) {
        console.log('Loading existing profile:', response.data);
        setFormData({
          business_name: response.data.business_name || '',
          industry: response.data.industry || '',
          business_description: response.data.business_description || '',
          year_founded: response.data.year_founded?.toString() || '',
          business_size: response.data.business_size || '',
          target_market: response.data.target_market || '',
          target_demographics: response.data.target_demographics || '',
          geographic_markets: response.data.geographic_markets || '',
          products_services: response.data.products_services || '',
          unique_value_proposition: response.data.unique_value_proposition || '',
          pricing_strategy: response.data.pricing_strategy || '',
          main_competitors: response.data.main_competitors || '',
          competitive_advantages: response.data.competitive_advantages || '',
          business_goals: response.data.business_goals || '',
          current_challenges: response.data.current_challenges || '',
          current_marketing: response.data.current_marketing || '',
          brand_values: response.data.brand_values || '',
          website_url: response.data.website_url || '',
        });
      }
    } catch (error) {
      console.log('No existing profile found or error loading:', error);
      // This is expected if no profile exists yet
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const nextStep = () => setCurrentStep(currentStep + 1);
  const prevStep = () => setCurrentStep(currentStep - 1);

  const handleSubmit = async () => {
    setIsLoading(true);
    setError('');

    try {
      console.log('Submitting form data:', formData);
      console.log('User:', user);
      
      // Get the auth token from cookies
      const token = Cookies.get('access_token');
      console.log('Auth token:', token ? 'Present' : 'Missing');
      
      if (!token) {
        setError('Authentication required. Please login again.');
        return;
      }
      
      const response = await axios.post('/api/business/profile/', {
        ...formData,
        onboarding_completed: true,
      }, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      });

      console.log('Response:', response.data);

      if (response.status === 200) {
        router.push('/dashboard');
      }
    } catch (error: any) {
      console.error('Onboarding error:', error);
      
      if (error.response) {
        console.error('Error response:', error.response.data);
        console.error('Error status:', error.response.status);
        console.error('Error headers:', error.response.headers);
        
        // Show the full error response for debugging
        const errorMessage = error.response.data.detail || 
                           error.response.data.message || 
                           JSON.stringify(error.response.data) ||
                           'Unknown error';
        setError(`Failed to save business profile: ${errorMessage}`);
      } else if (error.request) {
        setError('Network error. Please check your connection.');
      } else {
        setError('Failed to save business profile. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Basic Business Information</h2>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Business Name *</label>
              <input
                type="text"
                name="business_name"
                value={formData.business_name}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 px-4 py-3"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Industry *</label>
              <select
                name="industry"
                value={formData.industry}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 px-4 py-3"
                required
              >
                <option value="">Select an industry</option>
                {INDUSTRY_CHOICES.map((industry) => (
                  <option key={industry.value} value={industry.value}>
                    {industry.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Business Description *</label>
              <textarea
                name="business_description"
                value={formData.business_description}
                onChange={handleInputChange}
                rows={4}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 px-4 py-3"
                placeholder="Describe what your business does..."
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Year Founded</label>
                <input
                  type="number"
                  name="year_founded"
                  value={formData.year_founded}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 px-4 py-3"
                  placeholder="2020"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Business Size *</label>
                <select
                  name="business_size"
                  value={formData.business_size}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 px-4 py-3"
                  required
                >
                  <option value="">Select business size</option>
                  {BUSINESS_SIZE_CHOICES.map((size) => (
                    <option key={size.value} value={size.value}>
                      {size.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Target Market & Services</h2>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Target Market *</label>
              <textarea
                name="target_market"
                value={formData.target_market}
                onChange={handleInputChange}
                rows={3}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 px-4 py-3"
                placeholder="Describe your ideal customers..."
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Target Demographics *</label>
              <textarea
                name="target_demographics"
                value={formData.target_demographics}
                onChange={handleInputChange}
                rows={3}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 px-4 py-3"
                placeholder="Age, gender, income level, etc."
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Geographic Markets *</label>
              <textarea
                name="geographic_markets"
                value={formData.geographic_markets}
                onChange={handleInputChange}
                rows={3}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 px-4 py-3"
                placeholder="Where do you operate/sell?"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Products/Services *</label>
              <textarea
                name="products_services"
                value={formData.products_services}
                onChange={handleInputChange}
                rows={4}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 px-4 py-3"
                placeholder="What products or services do you offer?"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Unique Value Proposition *</label>
              <textarea
                name="unique_value_proposition"
                value={formData.unique_value_proposition}
                onChange={handleInputChange}
                rows={3}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 px-4 py-3"
                placeholder="What makes you different from competitors?"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Pricing Strategy *</label>
              <textarea
                name="pricing_strategy"
                value={formData.pricing_strategy}
                onChange={handleInputChange}
                rows={3}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 px-4 py-3"
                placeholder="How do you price your offerings?"
                required
              />
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Competition & Goals</h2>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Main Competitors *</label>
              <textarea
                name="main_competitors"
                value={formData.main_competitors}
                onChange={handleInputChange}
                rows={3}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 px-4 py-3"
                placeholder="Who are your main competitors?"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Competitive Advantages *</label>
              <textarea
                name="competitive_advantages"
                value={formData.competitive_advantages}
                onChange={handleInputChange}
                rows={3}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 px-4 py-3"
                placeholder="What advantages do you have over competitors?"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Business Goals *</label>
              <textarea
                name="business_goals"
                value={formData.business_goals}
                onChange={handleInputChange}
                rows={3}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 px-4 py-3"
                placeholder="What are your main business objectives?"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Current Challenges *</label>
              <textarea
                name="current_challenges"
                value={formData.current_challenges}
                onChange={handleInputChange}
                rows={3}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 px-4 py-3"
                placeholder="What challenges are you currently facing?"
                required
              />
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Marketing & Branding</h2>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Current Marketing</label>
              <textarea
                name="current_marketing"
                value={formData.current_marketing}
                onChange={handleInputChange}
                rows={3}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 px-4 py-3"
                placeholder="What marketing channels do you use?"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Brand Values *</label>
              <textarea
                name="brand_values"
                value={formData.brand_values}
                onChange={handleInputChange}
                rows={3}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 px-4 py-3"
                placeholder="What are your core brand values?"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Website URL</label>
              <input
                type="url"
                name="website_url"
                value={formData.website_url}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 px-4 py-3"
                placeholder="https://yourwebsite.com"
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (!user) {
    return null;
  }

  return (
    <>
      <Head>
        <title>Business Onboarding - GEOExplorer</title>
      </Head>

      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow-lg p-8">
            {/* Progress Bar */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">
                  Step {currentStep} of 4
                </span>
                <span className="text-sm text-gray-500">
                  {Math.round((currentStep / 4) * 100)}% Complete
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(currentStep / 4) * 100}%` }}
                ></div>
              </div>
            </div>

            {/* Form Content */}
            {renderStep()}

            {/* Error Message */}
            {error && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
                <p className="text-red-600">{error}</p>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="mt-8 flex justify-between">
              <button
                type="button"
                onClick={prevStep}
                disabled={currentStep === 1}
                className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>

              {currentStep < 4 ? (
                <button
                  type="button"
                  onClick={nextStep}
                  className="px-6 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
                >
                  Next
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isLoading}
                  className="px-6 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50"
                >
                  {isLoading ? 'Saving...' : 'Complete Onboarding'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
