import prisma from "@/lib/prisma";
import Link from "next/link";
import AdminNav from "@/components/admin/AdminNav";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const requests = await prisma.watchRequest.findMany({
    orderBy: { createdAt: "desc" }
  });

  return (
    <div className="bg-gray-100 min-h-screen text-gray-900 pb-20">
      <AdminNav />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 font-serif tracking-tight">Watch Sourcing Requests</h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">Review custom watch sourcing and concierge requests submitted by clients.</p>
        </div>

        <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-10">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200 flex justify-between items-center">
            <div>
              <h3 className="text-lg leading-6 font-medium text-gray-900">Watch Requests</h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">Manage customer sourcing requests.</p>
            </div>
            <div>
              <button className="bg-black text-white px-4 py-2 text-sm rounded hover:bg-gray-800">Export CSV</button>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Watch</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Budget</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Timeline</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {requests.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-10 text-center text-sm text-gray-500">No requests found.</td>
                  </tr>
                ) : (
                  requests.map(req => (
                    <tr key={req.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(req.createdAt).toLocaleDateString()}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{req.fullName}</div>
                        <div className="text-sm text-gray-500">{req.email}</div>
                        <div className="text-sm text-gray-500">{req.phoneNumber}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{req.brand}</div>
                        <div className="text-sm text-gray-500">{req.modelName}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{req.budgetRange || "-"}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{req.timeline || "-"}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          req.status === "New Request" ? "bg-green-100 text-green-800" : 
                          req.status === "Completed" ? "bg-gray-100 text-gray-800" : 
                          "bg-yellow-100 text-yellow-800"
                        }`}>
                          {req.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <a href="#" className="text-indigo-600 hover:text-indigo-900 mr-4">View</a>
                        <a href={`https://wa.me/${req.whatsappNumber?.replace(/\D/g,'')}`} target="_blank" className="text-green-600 hover:text-green-900">WhatsApp</a>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
