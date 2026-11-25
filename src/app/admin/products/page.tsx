import { connection } from "next/server";
import prisma from "@/lib/prisma";
import Link from "next/link";
import { addProduct } from "@/app/actions";
import AdminNav from "@/components/admin/AdminNav";

export const dynamic = "force-dynamic";

export default async function AdminProducts() {
  await connection();
  const categories = await prisma.category.findMany();
  const products = await prisma.product.findMany({ include: { category: true } });

  return (
    <div className="bg-gray-100 min-h-screen text-gray-900 pb-20">
      <AdminNav />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 font-serif tracking-tight">Catalog & Inventory</h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">Manage luxury watch listings, pricing, and stock availability.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Add Product Form */}
          <div className="col-span-1 bg-white shadow sm:rounded-lg p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Add New Watch</h3>
            <form
              action={async (formData: FormData) => {
                "use server";
                await addProduct(formData);
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700">Watch Name</label>
                <input type="text" name="name" required className="mt-1 block w-full rounded-md border-gray-300 border shadow-sm p-2" placeholder="e.g. Submariner Date" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Brand</label>
                <input type="text" name="brand" required className="mt-1 block w-full rounded-md border-gray-300 border shadow-sm p-2" placeholder="e.g. Rolex" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Price (₹)</label>
                <input type="number" name="price" required className="mt-1 block w-full rounded-md border-gray-300 border shadow-sm p-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <textarea name="description" required rows={3} className="mt-1 block w-full rounded-md border-gray-300 border shadow-sm p-2"></textarea>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Category</label>
                <select name="categoryId" className="mt-1 block w-full rounded-md border-gray-300 border shadow-sm p-2 bg-white">
                  <option value="new">Auto-create from Brand</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="flex items-center space-x-4 pt-2">
                <div className="flex items-center">
                  <input type="checkbox" name="inStock" defaultChecked className="h-4 w-4 text-black focus:ring-black border-gray-300 rounded" />
                  <label className="ml-2 block text-sm text-gray-900">In Stock</label>
                </div>
                <div>
                  <input type="number" name="quantity" defaultValue={1} min={1} className="block w-20 rounded-md border-gray-300 border shadow-sm p-1 text-sm" placeholder="Qty" />
                </div>
              </div>
              <button type="submit" className="w-full mt-4 bg-black text-white px-4 py-2 rounded hover:bg-gray-800 transition">
                Save Product
              </button>
            </form>
          </div>

          {/* Product List */}
          <div className="col-span-2 bg-white shadow sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Current Inventory ({products.length})</h3>
            </div>
            <ul className="divide-y divide-gray-200 h-[600px] overflow-y-auto">
              {products.length === 0 && <li className="p-6 text-center text-gray-500">No products added yet.</li>}
              {products.map(product => (
                <li key={product.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                  <div>
                    <p className="text-sm font-bold text-gray-900">{product.name} <span className="text-gray-500 font-normal">by {product.brand}</span></p>
                    <p className="text-sm text-gray-500">₹{product.price.toLocaleString('en-IN')} • {product.category.name}</p>
                  </div>
                  <div>
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${product.inStock ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {product.inStock ? `Stock: ${product.quantity}` : 'Out of Stock'}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>

      </div>
    </div>
  );
}
