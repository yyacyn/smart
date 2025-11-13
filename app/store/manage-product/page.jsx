'use client'
import { useEffect, useState } from "react"
import { toast } from "react-hot-toast"
import Image from "next/image"
import Loading from "@/components/Loading"
import { useAuth, useUser } from "@clerk/nextjs"
import axios from "axios"

export default function StoreManageProducts() {

    const { getToken } = useAuth()
    const { user } = useUser()

    const currency = process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || '$'

    const [loading, setLoading] = useState(true)
    const [products, setProducts] = useState([])
    const [editingProduct, setEditingProduct] = useState(null)
    const [editForm, setEditForm] = useState({})

    const fetchProducts = async () => {
        try {
            const token = await getToken()
            const { data } = await axios.get('/api/store/product', { headers: { Authorization: `Bearer ${token}` } })
            setProducts(data.products.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)))
        } catch (error) {
            toast.error(error?.response?.data?.error || error.message)
        }
        setLoading(false)
    }

    const toggleStock = async (productId) => {
        try {
            const token = await getToken()
            const { data } = await axios.post(`/api/store/stock-toggle`, { productId }, { headers: { Authorization: `Bearer ${token}` } })
            setProducts(prevProducts => prevProducts.map(product => product.id === productId ? { ...product, inStock: !product.inStock } : product))

            toast.success(data.message)
        } catch (error) {
            toast.error(error?.response?.data?.error || error.message)
        }
    }

    const handleEdit = async (e) => {
        e.preventDefault();
        try {
            const token = await getToken();
            
            // Make API call to update product
            const formData = new FormData();
            formData.append('name', editForm.name);
            formData.append('description', editForm.description);
            formData.append('mrp', editForm.mrp);
            formData.append('price', editForm.price);
            formData.append('category', editForm.category);
            formData.append('inStock', editForm.inStock);
            formData.append('stock', editForm.stock);
            formData.append('minStock', editForm.minStock || 0);
            if(editForm.weight) formData.append('weight', editForm.weight);
            if(editForm.dimensions) formData.append('dimensions', editForm.dimensions);
            if(editForm.model) formData.append('model', editForm.model);
            if(editForm.additionalInfo) formData.append('additionalInfo', editForm.additionalInfo);
            formData.append('status', editForm.status);
            if(editForm.sku) formData.append('sku', editForm.sku);
            if(editForm.barcode) formData.append('barcode', editForm.barcode);
            if(editForm.shippingWeight) formData.append('shippingWeight', editForm.shippingWeight);
            if(editForm.shippingLength) formData.append('shippingLength', editForm.shippingLength);
            if(editForm.shippingWidth) formData.append('shippingWidth', editForm.shippingWidth);
            if(editForm.shippingHeight) formData.append('shippingHeight', editForm.shippingHeight);
            if(editForm.warranty) formData.append('warranty', editForm.warranty);
            if(editForm.returnPolicy) formData.append('returnPolicy', editForm.returnPolicy);
            if(editForm.tags) formData.append('tags', editForm.tags);
            if(editForm.metaTitle) formData.append('metaTitle', editForm.metaTitle);
            if(editForm.metaDescription) formData.append('metaDescription', editForm.metaDescription);

            const response = await axios.put(`/api/store/product/${editingProduct.id}`, formData, { 
                headers: { Authorization: `Bearer ${token}` } 
            });

            toast.success(response.data.message);

            // Update local state
            setProducts(prev => prev.map(product => 
                product.id === editingProduct.id ? { ...product, ...editForm } : product
            ));

            // Close the edit modal
            setEditingProduct(null);
        } catch (error) {
            toast.error(error?.response?.data?.error || error.message);
        }
    };

    const handleDelete = async (productId) => {
        if (!window.confirm("Are you sure you want to delete this product?")) {
            return;
        }

        try {
            const token = await getToken();
            await axios.delete(`/api/store/product/${productId}`, { 
                headers: { Authorization: `Bearer ${token}` } 
            });

            toast.success("Product deleted successfully");
            setProducts(prev => prev.filter(product => product.id !== productId));
        } catch (error) {
            toast.error(error?.response?.data?.error || error.message);
        }
    };

    const startEdit = (product) => {
        setEditingProduct(product);
        setEditForm({
            name: product.name,
            description: product.description,
            mrp: product.mrp,
            price: product.price,
            category: product.category?.id || product.categoryId || "",
            inStock: product.inStock,
            stock: product.stock,
            minStock: product.minStock || 0,
            weight: product.weight || "",
            dimensions: product.dimensions || "",
            model: product.model || "",
            additionalInfo: product.additionalInfo || "",
            status: product.status || "draft",
            sku: product.sku || "",
            barcode: product.barcode || "",
            shippingWeight: product.shippingWeight || "",
            shippingLength: product.shippingLength || "",
            shippingWidth: product.shippingWidth || "",
            shippingHeight: product.shippingHeight || "",
            warranty: product.warranty || "",
            returnPolicy: product.returnPolicy || "",
            tags: product.tags || "",
            metaTitle: product.metaTitle || "",
            metaDescription: product.metaDescription || "",
        });
    };

    useEffect(() => {
        if (user) {
            fetchProducts()
        }
    }, [user])

    if (loading) return <Loading />

    return (
        <>
            <h1 className="text-2xl text-slate-500 mb-5">Manage <span className="text-slate-800 font-medium">Products</span></h1>
            <table className="w-full max-w-6xl text-left ring ring-slate-200 rounded overflow-hidden text-sm">
                <thead className="bg-slate-50 text-gray-700 uppercase tracking-wider">
                    <tr>
                        <th className="px-4 py-3">Image</th>
                        <th className="px-4 py-3">Name</th>
                        <th className="px-4 py-3 hidden md:table-cell">Category</th>
                        <th className="px-4 py-3 hidden md:table-cell">Stock</th>
                        <th className="px-4 py-3 hidden md:table-cell">Price</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3">Actions</th>
                    </tr>
                </thead>
                <tbody className="text-slate-700">
                    {products.map((product) => (
                        <tr key={product.id} className="border-t border-gray-200 hover:bg-gray-50">
                            <td className="px-4 py-3">
                                <Image width={40} height={40} className='p-1 shadow rounded cursor-pointer' src={product.images[0]} alt="" />
                            </td>
                            <td className="px-4 py-3 max-w-xs">
                                <div className="font-medium">{product.name}</div>
                                <div className="text-xs text-slate-500 truncate hidden md:table-cell">{product.description}</div>
                            </td>
                            <td className="px-4 py-3 hidden md:table-cell">
                                {product.category?.name || product.categoryId || "N/A"}
                            </td>
                            <td className="px-4 py-3 hidden md:table-cell">
                                <div className="flex items-center">
                                    <span className={`inline-block w-3 h-3 rounded-full mr-2 ${product.inStock ? 'bg-green-500' : 'bg-red-500'}`}></span>
                                    {product.stock || 0} in stock
                                </div>
                            </td>
                            <td className="px-4 py-3 hidden md:table-cell">{currency} {product.price.toLocaleString()}</td>
                            <td className="px-4 py-3">
                                <span className={`px-2 py-1 rounded-full text-xs ${
                                    product.status === "published" ? "bg-green-100 text-green-800" :
                                    product.status === "draft" ? "bg-yellow-100 text-yellow-800" :
                                    "bg-gray-100 text-gray-800"
                                }`}>
                                    {product.status}
                                </span>
                            </td>
                            <td className="px-4 py-3 text-center">
                                <div className="flex justify-center gap-2">
                                    <button 
                                        onClick={() => startEdit(product)}
                                        className="text-blue-600 hover:text-blue-800"
                                    >
                                        Edit
                                    </button>
                                    <button 
                                        onClick={() => toast.promise(toggleStock(product.id), { loading: "Updating stock status..." })}
                                        className={`${product.inStock ? 'text-red-600 hover:text-red-800' : 'text-green-600 hover:text-green-800'}`}
                                    >
                                        {product.inStock ? 'Unlist' : 'List'}
                                    </button>
                                    <button 
                                        onClick={() => handleDelete(product.id)}
                                        className="text-red-600 hover:text-red-800"
                                    >
                                        Delete
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* Edit Product Modal */}
            {editingProduct && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6">
                            <h2 className="text-xl font-bold mb-4">Edit Product: {editingProduct.name}</h2>
                            
                            <form onSubmit={handleEdit}>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Name</label>
                                        <input 
                                            type="text" 
                                            value={editForm.name} 
                                            onChange={(e) => setEditForm({...editForm, name: e.target.value})} 
                                            className="w-full p-2 border border-gray-300 rounded" 
                                            required 
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Category ID</label>
                                        <input 
                                            type="text" 
                                            value={editForm.category || ""} 
                                            onChange={(e) => setEditForm({...editForm, category: e.target.value})} 
                                            className="w-full p-2 border border-gray-300 rounded" 
                                            required 
                                        />
                                    </div>
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Actual Price</label>
                                        <input 
                                            type="number" 
                                            value={editForm.mrp} 
                                            onChange={(e) => setEditForm({...editForm, mrp: parseFloat(e.target.value)})} 
                                            className="w-full p-2 border border-gray-300 rounded" 
                                            required 
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Offer Price</label>
                                        <input 
                                            type="number" 
                                            value={editForm.price} 
                                            onChange={(e) => setEditForm({...editForm, price: parseFloat(e.target.value)})} 
                                            className="w-full p-2 border border-gray-300 rounded" 
                                            required 
                                        />
                                    </div>
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Status</label>
                                        <select 
                                            value={editForm.status} 
                                            onChange={(e) => setEditForm({...editForm, status: e.target.value})} 
                                            className="w-full p-2 border border-gray-300 rounded" 
                                        >
                                            <option value="draft">Draft</option>
                                            <option value="published">Published</option>
                                            <option value="archived">Archived</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1">In Stock</label>
                                        <div className="flex items-center">
                                            <input 
                                                type="checkbox" 
                                                checked={editForm.inStock} 
                                                onChange={(e) => setEditForm({...editForm, inStock: e.target.checked})} 
                                                className="h-4 w-4"
                                            />
                                            <span className="ml-2">Product is in stock</span>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Stock Quantity</label>
                                        <input 
                                            type="number" 
                                            value={editForm.stock} 
                                            onChange={(e) => setEditForm({...editForm, stock: parseInt(e.target.value)})} 
                                            className="w-full p-2 border border-gray-300 rounded" 
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Minimum Stock Level</label>
                                        <input 
                                            type="number" 
                                            value={editForm.minStock} 
                                            onChange={(e) => setEditForm({...editForm, minStock: parseInt(e.target.value)})} 
                                            className="w-full p-2 border border-gray-300 rounded" 
                                        />
                                    </div>
                                </div>
                                
                                <div className="mb-4">
                                    <label className="block text-sm font-medium mb-1">Description</label>
                                    <textarea 
                                        value={editForm.description} 
                                        onChange={(e) => setEditForm({...editForm, description: e.target.value})} 
                                        className="w-full p-2 border border-gray-300 rounded" 
                                        rows="3"
                                    ></textarea>
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-1">SKU</label>
                                        <input 
                                            type="text" 
                                            value={editForm.sku || ""} 
                                            onChange={(e) => setEditForm({...editForm, sku: e.target.value})} 
                                            className="w-full p-2 border border-gray-300 rounded" 
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Barcode</label>
                                        <input 
                                            type="text" 
                                            value={editForm.barcode || ""} 
                                            onChange={(e) => setEditForm({...editForm, barcode: e.target.value})} 
                                            className="w-full p-2 border border-gray-300 rounded" 
                                        />
                                    </div>
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Weight (kg)</label>
                                        <input 
                                            type="text" 
                                            value={editForm.weight || ""} 
                                            onChange={(e) => setEditForm({...editForm, weight: e.target.value})} 
                                            className="w-full p-2 border border-gray-300 rounded" 
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Dimensions (L x W x H)</label>
                                        <input 
                                            type="text" 
                                            value={editForm.dimensions || ""} 
                                            onChange={(e) => setEditForm({...editForm, dimensions: e.target.value})} 
                                            className="w-full p-2 border border-gray-300 rounded" 
                                        />
                                    </div>
                                </div>
                                
                                <div className="mb-4">
                                    <label className="block text-sm font-medium mb-1">Additional Information</label>
                                    <textarea 
                                        value={editForm.additionalInfo || ""} 
                                        onChange={(e) => setEditForm({...editForm, additionalInfo: e.target.value})} 
                                        className="w-full p-2 border border-gray-300 rounded" 
                                        rows="2"
                                    ></textarea>
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Warranty</label>
                                        <input 
                                            type="text" 
                                            value={editForm.warranty || ""} 
                                            onChange={(e) => setEditForm({...editForm, warranty: e.target.value})} 
                                            className="w-full p-2 border border-gray-300 rounded" 
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Return Policy</label>
                                        <input 
                                            type="text" 
                                            value={editForm.returnPolicy || ""} 
                                            onChange={(e) => setEditForm({...editForm, returnPolicy: e.target.value})} 
                                            className="w-full p-2 border border-gray-300 rounded" 
                                        />
                                    </div>
                                </div>
                                
                                <div className="mb-4">
                                    <label className="block text-sm font-medium mb-1">Tags (comma separated)</label>
                                    <input 
                                        type="text" 
                                        value={editForm.tags || ""} 
                                        onChange={(e) => setEditForm({...editForm, tags: e.target.value})} 
                                        className="w-full p-2 border border-gray-300 rounded" 
                                    />
                                </div>
                                
                                <div className="flex justify-end gap-3">
                                    <button 
                                        type="button" 
                                        onClick={() => setEditingProduct(null)}
                                        className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-100"
                                    >
                                        Cancel
                                    </button>
                                    <button 
                                        type="submit" 
                                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                                    >
                                        Save Changes
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}