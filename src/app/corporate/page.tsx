"use client";

export default function CorporateOrders() {
  return (
    <div className="bg-gray-50 py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center">
          <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight sm:text-5xl">Corporate Watch Orders</h1>
          <p className="mt-4 text-xl text-gray-500">
            Elevate your corporate gifting with premium timepieces.
          </p>
        </div>

        <div className="mt-16 bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Why choose DappersFit for Corporate Gifts?</h3>
            <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-3">
              <div className="bg-gray-50 overflow-hidden shadow rounded-lg p-5">
                <dt className="text-sm font-medium text-gray-500 truncate">Bulk Purchases</dt>
                <dd className="mt-1 text-sm text-gray-900">Special pricing and dedicated account management for volume orders.</dd>
              </div>
              <div className="bg-gray-50 overflow-hidden shadow rounded-lg p-5">
                <dt className="text-sm font-medium text-gray-500 truncate">Employee Rewards</dt>
                <dd className="mt-1 text-sm text-gray-900">Recognize milestones and achievements with lasting, premium rewards.</dd>
              </div>
              <div className="bg-gray-50 overflow-hidden shadow rounded-lg p-5">
                <dt className="text-sm font-medium text-gray-500 truncate">Custom Branding (Coming Soon)</dt>
                <dd className="mt-1 text-sm text-gray-900">Personalized engraving and custom presentation boxes for your brand.</dd>
              </div>
            </div>

            <div className="mt-12">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-6">Contact our Corporate Team</h3>
              <form className="grid grid-cols-1 gap-y-6 sm:grid-cols-2 sm:gap-x-8">
                <div>
                  <label htmlFor="companyName" className="block text-sm font-medium text-gray-700">Company Name</label>
                  <input type="text" name="companyName" className="mt-1 py-2 px-3 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md border" />
                </div>
                <div>
                  <label htmlFor="contactName" className="block text-sm font-medium text-gray-700">Contact Name</label>
                  <input type="text" name="contactName" className="mt-1 py-2 px-3 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md border" />
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">Work Email</label>
                  <input type="email" name="email" className="mt-1 py-2 px-3 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md border" />
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor="requirements" className="block text-sm font-medium text-gray-700">Project Requirements (Estimated Quantity, Budget, Timeline)</label>
                  <textarea name="requirements" rows={4} className="mt-1 py-2 px-3 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md border"></textarea>
                </div>
                <div className="sm:col-span-2">
                  <button type="button" onClick={() => alert("Corporate Request Sent!")} className="w-full inline-flex items-center justify-center px-6 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-black hover:bg-gray-800">
                    Submit Inquiry
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
