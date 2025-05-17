import React from 'react';
import { Link } from 'react-router-dom';
import { CreditCard, ShieldCheck, BarChart2, Code } from 'lucide-react';
import Button from '../components/common/Button';
import Card from '../components/common/Card';

const Home = () => {
  const features = [
    {
      title: 'Multi-Provider Integration',
      description: 'Seamlessly integrate with multiple payment providers through a single, unified API.',
      icon: <CreditCard className="h-8 w-8 text-blue-600" />
    },
    {
      title: 'PCI-DSS Compliant',
      description: 'Secure tokenization and data handling that adheres to the highest security standards.',
      icon: <ShieldCheck className="h-8 w-8 text-blue-600" />
    },
    {
      title: 'Comprehensive Analytics',
      description: 'Detailed reporting and analytics to track payment performance and trends.',
      icon: <BarChart2 className="h-8 w-8 text-blue-600" />
    },
    {
      title: 'Developer-Friendly',
      description: 'Well-documented API with SDKs for major programming languages and frameworks.',
      icon: <Code className="h-8 w-8 text-blue-600" />
    }
  ];

  return (
    <div className="container mx-auto px-4 py-12">
      {/* Hero Section */}
      <div className="text-center mb-16">
        <h1 className="text-4xl md:text-5xl font-bold mb-4">
          Unified Payment Gateway Hub
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
          A single integration for all your payment needs. Connect with multiple payment providers through one simple API.
        </p>
        <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4">
          <Link to="/sandbox">
            <Button size="large">
              Try the Sandbox
            </Button>
          </Link>
          <Link to="/docs">
            <Button variant="outline" size="large">
              View Documentation
            </Button>
          </Link>
        </div>
      </div>

      {/* Features Section */}
      <div className="mb-16">
        <h2 className="text-3xl font-bold text-center mb-12">
          Key Features
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <Card key={index} className="h-full hover:shadow-lg transition-shadow">
              <div className="p-2 mb-4 inline-block bg-blue-100 rounded-lg">
                {feature.icon}
              </div>
              <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
              <p className="text-gray-600">{feature.description}</p>
            </Card>
          ))}
        </div>
      </div>

      {/* Providers Section */}
      <div className="mb-16">
        <h2 className="text-3xl font-bold text-center mb-12">
          Supported Payment Providers
        </h2>
        <div className="flex flex-wrap justify-center items-center gap-8">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <img src="/stripe-logo.svg" alt="Stripe" className="h-12" />
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <img src="/paypal-logo.svg" alt="PayPal" className="h-12" />
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <img src="/braintree-logo.svg" alt="Braintree" className="h-12" />
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-blue-600 text-white rounded-lg p-8 md:p-12 text-center">
        <h2 className="text-3xl font-bold mb-4">Ready to get started?</h2>
        <p className="text-xl mb-8 max-w-2xl mx-auto">
          Create an account today and simplify your payment integrations.
        </p>
        <Link to="/signup">
          <Button variant="secondary" size="large">
            Create Account
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default Home;