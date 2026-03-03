"use client";

import { useState } from "react";
import { Mail, Phone, MapPin, MessageSquare } from "lucide-react";
import Header from "@/components/ui/auth-header";
import Footer from "@/components/ui/auth-footer";

export default function SimpleContact() {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    company: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus('');

    // Enhanced validation
    if (!formData.fullName.trim()) {
      setSubmitStatus('Please enter your full name.');
      setIsSubmitting(false);
      return;
    }

    if (!formData.email.trim()) {
      setSubmitStatus('Please enter your email address.');
      setIsSubmitting(false);
      return;
    }

    if (!validateEmail(formData.email)) {
      setSubmitStatus('Please enter a valid email address.');
      setIsSubmitting(false);
      return;
    }

    if (!formData.message.trim()) {
      setSubmitStatus('Please enter your message.');
      setIsSubmitting(false);
      return;
    }

    try {
      // Simulate form submission
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Show success message
      setSubmitStatus('success');
      
      // Reset form after a delay
      setTimeout(() => {
        setFormData({
          fullName: '',
          email: '',
          phone: '',
          company: '',
          message: ''
        });
        setSubmitStatus('');
      }, 3000);
      
    } catch (error) {
      setSubmitStatus('Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <style jsx>{`
        html {
          scroll-behavior: smooth;
        }

        .contact-card {
          transition: all 0.3s ease;
          cursor: pointer;
        }

        .contact-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
        }

        .form-input {
          transition: all 0.2s ease;
          border: 1px solid #d1d5db;
          background-color: #ffffff;
          color: #1f2937;
        }

        .form-input:focus {
          border-color: #3aafa9;
          outline: none;
          box-shadow: 0 0 0 3px rgba(58, 175, 169, 0.1);
        }

        .form-input::placeholder {
          color: #9ca3af;
        }

        .submit-button {
          background: linear-gradient(135deg, #3aafa9 0%, #2d8f89 100%);
          transition: all 0.3s ease;
        }

        .submit-button:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 8px 20px rgba(58, 175, 169, 0.3);
        }

        .submit-button:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .success-message {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          animation: slideIn 0.3s ease-out;
        }

        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>

      {/* Header */}
      <Header />

      {/* Hero Section */}
      <section className="py-16 bg-gradient-to-br from-primary/10 via-primary/5 to-primary/20">
        <div className="container mx-auto px-6 text-center">
          <h1 className="text-5xl font-bold mb-4 text-gray-900">
            Reach Out To Us <span className="text-primary">Today</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            We'd love to hear from you. Send us a message and we'll respond as soon as possible.
          </p>
        </div>
      </section>

      {/* Contact Form */}
      <section className="pb-12">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-sm border p-6 md:p-8">
            <div className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">
                    Full name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    placeholder="Ex. John Doe"
                    className="form-input w-full px-3 py-2 rounded-md text-sm"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">
                    Email address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="example@gmail.com"
                    className="form-input w-full px-3 py-2 rounded-md text-sm"
                    required
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">
                    Phone number
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="+1 234 567 890"
                    className="form-input w-full px-3 py-2 rounded-md text-sm"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">
                    Company
                  </label>
                  <input
                    type="text"
                    name="company"
                    value={formData.company}
                    onChange={handleInputChange}
                    placeholder="Ex. Company Co"
                    className="form-input w-full px-3 py-2 rounded-md text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">
                  Message <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleInputChange}
                  placeholder="Type your message here..."
                  rows={4}
                  className="form-input w-full px-3 py-2 rounded-md resize-none text-sm"
                  required
                />
              </div>

              {/* Status Messages */}
              {submitStatus === 'success' && (
                <div className="success-message p-4 rounded-md text-sm text-white">
                  <div className="flex items-center">
                    <Mail className="w-5 h-5 mr-2" />
                    <div>
                      <div className="font-medium">Message sent successfully!</div>
                      <div className="text-green-100 text-xs mt-1">We'll get back to you as soon as possible.</div>
                    </div>
                  </div>
                </div>
              )}

              {submitStatus && submitStatus !== 'success' && (
                <div className="p-3 rounded-md text-sm bg-red-50 text-red-700 border border-red-200">
                  {submitStatus}
                </div>
              )}

              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="submit-button w-full py-3 px-6 text-white font-medium rounded-md text-sm flex items-center justify-center"
              >
                <Mail className="w-4 h-4 mr-2" />
                {isSubmitting ? 'Sending Message...' : 'Send Message'}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
}