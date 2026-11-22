"use client";

import { useState } from "react";
import { submitWatchRequest } from "../actions";

export default function RequestWatch() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    phoneNumber: "",
    whatsappNumber: "",
    email: "",
    brand: "",
    otherBrand: "",
    modelName: "",
    referenceNumber: "",
    productUrl: "",
    budgetRange: "",
    condition: "No Preference",
    timeline: "Just Researching",
    specialRequirements: "",
    preferredColor: "",
    dialColor: "",
    strapPreference: "",
    materialPreference: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const form = new FormData(e.target as HTMLFormElement);
    const result = await submitWatchRequest(form);
    
    if (result.success) {
      alert("Request Submitted! Our team will contact you shortly.");
      // Redirect or clear form here
    } else {
      alert("Error submitting request.");
    }
    setIsSubmitting(false);
  };

  const brands = [
    "Rolex", "Omega", "Patek Philippe", "Richard Mille", "Rado", 
    "Tissot", "Versace", "Carrera", "Casio", "G-Shock", 
    "Hublot", "Fossil", "Michael Kors", "Diesel", "Invicta", "Other"
  ];

  return (
    <div className="max-w-4xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-extrabold tracking-tight text-gray-900">Request A Watch</h1>
        <p className="mt-4 text-lg text-gray-500">
          Looking for a specific timepiece not in our catalog? Let us source it for you.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-12">
        {/* Personal Details */}
        <div className="bg-white shadow px-4 py-5 sm:rounded-lg sm:p-6">
          <h2 className="text-xl font-bold leading-6 text-gray-900 mb-6">1. Your Information</h2>
          <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">Full Name *</label>
              <input type="text" name="fullName" required onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-black focus:ring-black sm:text-sm p-2 border" />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email Address *</label>
              <input type="email" name="email" required onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-black focus:ring-black sm:text-sm p-2 border" />
            </div>
            <div>
              <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700">Phone Number *</label>
              <input type="tel" name="phoneNumber" required onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-black focus:ring-black sm:text-sm p-2 border" />
            </div>
            <div>
              <label htmlFor="whatsappNumber" className="block text-sm font-medium text-gray-700">WhatsApp Number</label>
              <input type="tel" name="whatsappNumber" onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-black focus:ring-black sm:text-sm p-2 border" />
            </div>
          </div>
        </div>

        {/* Watch Details */}
        <div className="bg-white shadow px-4 py-5 sm:rounded-lg sm:p-6">
          <h2 className="text-xl font-bold leading-6 text-gray-900 mb-6">2. Watch Details</h2>
          <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
            <div>
              <label htmlFor="brand" className="block text-sm font-medium text-gray-700">Brand *</label>
              <select name="brand" required onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-black focus:ring-black sm:text-sm p-2 border bg-white">
                <option value="">Select a brand</option>
                {brands.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
            {formData.brand === "Other" && (
              <div>
                <label htmlFor="otherBrand" className="block text-sm font-medium text-gray-700">Specify Brand</label>
                <input type="text" name="otherBrand" onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-black focus:ring-black sm:text-sm p-2 border" />
              </div>
            )}
            <div className="sm:col-span-2">
              <label htmlFor="modelName" className="block text-sm font-medium text-gray-700">Model Name *</label>
              <input type="text" name="modelName" required onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-black focus:ring-black sm:text-sm p-2 border" />
            </div>
            <div>
              <label htmlFor="referenceNumber" className="block text-sm font-medium text-gray-700">Reference Number (Optional)</label>
              <input type="text" name="referenceNumber" onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-black focus:ring-black sm:text-sm p-2 border" />
            </div>
            <div>
              <label htmlFor="productUrl" className="block text-sm font-medium text-gray-700">Product URL (Optional)</label>
              <input type="url" name="productUrl" onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-black focus:ring-black sm:text-sm p-2 border" />
            </div>
          </div>
        </div>

        {/* Requirements */}
        <div className="bg-white shadow px-4 py-5 sm:rounded-lg sm:p-6">
          <h2 className="text-xl font-bold leading-6 text-gray-900 mb-6">3. Requirements & Timeline</h2>
          <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
            <div>
              <label htmlFor="budgetRange" className="block text-sm font-medium text-gray-700">Budget Range</label>
              <input type="text" name="budgetRange" placeholder="e.g., ₹5,000 - ₹10,000" onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-black focus:ring-black sm:text-sm p-2 border" />
            </div>
            <div>
              <label htmlFor="condition" className="block text-sm font-medium text-gray-700">Condition</label>
              <select name="condition" onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-black focus:ring-black sm:text-sm p-2 border bg-white">
                <option value="New">New</option>
                <option value="Pre-Owned">Pre-Owned</option>
                <option value="No Preference">No Preference</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="timeline" className="block text-sm font-medium text-gray-700">Purchase Timeline</label>
              <select name="timeline" onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-black focus:ring-black sm:text-sm p-2 border bg-white">
                <option value="Immediately">Immediately</option>
                <option value="Within 1 Week">Within 1 Week</option>
                <option value="Within 1 Month">Within 1 Month</option>
                <option value="Just Researching">Just Researching</option>
              </select>
            </div>
          </div>
        </div>

        {/* Notes & Preferences */}
        <div className="bg-white shadow px-4 py-5 sm:rounded-lg sm:p-6">
          <h2 className="text-xl font-bold leading-6 text-gray-900 mb-6">4. Preferences & Notes</h2>
          <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
            <div>
              <label htmlFor="dialColor" className="block text-sm font-medium text-gray-700">Preferred Dial Color</label>
              <input type="text" name="dialColor" onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-black focus:ring-black sm:text-sm p-2 border" />
            </div>
            <div>
              <label htmlFor="strapPreference" className="block text-sm font-medium text-gray-700">Strap Preference</label>
              <input type="text" name="strapPreference" onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-black focus:ring-black sm:text-sm p-2 border" />
            </div>
            <div>
              <label htmlFor="materialPreference" className="block text-sm font-medium text-gray-700">Material Preference</label>
              <input type="text" name="materialPreference" onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-black focus:ring-black sm:text-sm p-2 border" />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="specialRequirements" className="block text-sm font-medium text-gray-700">Special Requirements or Notes</label>
              <textarea name="specialRequirements" rows={3} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-black focus:ring-black sm:text-sm p-2 border"></textarea>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex justify-center py-3 px-8 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-black hover:bg-gray-800 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black"
          >
            {isSubmitting ? "Submitting..." : "Request This Watch"}
          </button>
        </div>
      </form>
    </div>
  );
}
