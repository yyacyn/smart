'use client'
import { assets } from "@/assets/assets"
import { useAuth } from "@clerk/nextjs"
import Image from "next/image"
import { useState, useEffect } from "react"
import { toast } from "react-hot-toast"
import axios from "axios"

export default function StoreAddProduct() {

    const [categories, setCategories] = useState([])
    const [categoriesLoading, setCategoriesLoading] = useState(true)
    
    const [images, setImages] = useState({ 1: null, 2: null, 3: null, 4: null })
    const [productInfo, setProductInfo] = useState({
        name: "",
        description: "",
        mrp: 0,
        price: 0,
        categoryId: "",
        inStock: true,
        stock: 0,
        minStock: 0,
        weight: "",
        dimensions: "",
        model: "",
        additionalInfo: "",
        status: "draft",
        sku: "",
        barcode: "",
        shippingWeight: "",
        shippingLength: "",
        shippingWidth: "",
        shippingHeight: "",
        warranty: "",
        returnPolicy: "",
        tags: "",
        metaTitle: "",
        metaDescription: "",
    })
    const [loading, setLoading] = useState(false)

    const {getToken} = useAuth()

    // Fetch categories from API
    const fetchCategories = async () => {
        try {
            const token = await getToken()
            const { data } = await axios.get('/api/categories', { 
                headers: { Authorization: `Bearer ${token}` } 
            })
            
            setCategories(data.data)
        } catch (error) {
            console.error('Error fetching categories:', error)
            toast.error('Failed to load categories')
        } finally {
            setCategoriesLoading(false)
        }
    }

    useEffect(() => {
        fetchCategories()
    }, [])

    const onChangeHandler = (e) => {
        // Handle checkbox input
        if(e.target.type === 'checkbox') {
            setProductInfo({ ...productInfo, [e.target.name]: e.target.checked })
        } else {
            setProductInfo({ ...productInfo, [e.target.name]: e.target.value })
        }
    }

    const onSubmitHandler = async (e) => {
        e.preventDefault()
        try {
            // kalau ga ada gambar yang diupload
            if(!images[1] && !images[2] && !images[3] && !images[4] ) {
                return toast.error('Please upload at least one product image')
            }
            setLoading(true)

            const formData = new FormData()
            formData.append('name', productInfo.name)
            formData.append('description', productInfo.description)
            formData.append('mrp', productInfo.mrp)
            formData.append('price', productInfo.price)
            formData.append('category', productInfo.categoryId) // Use categoryId field
            formData.append('inStock', productInfo.inStock)
            formData.append('stock', productInfo.stock)
            formData.append('minStock', productInfo.minStock || 0)
            if(productInfo.weight) formData.append('weight', productInfo.weight)
            if(productInfo.dimensions) formData.append('dimensions', productInfo.dimensions)
            if(productInfo.model) formData.append('model', productInfo.model)
            if(productInfo.additionalInfo) formData.append('additionalInfo', productInfo.additionalInfo)
            formData.append('status', productInfo.status)
            if(productInfo.sku) formData.append('sku', productInfo.sku)
            if(productInfo.barcode) formData.append('barcode', productInfo.barcode)
            if(productInfo.shippingWeight) formData.append('shippingWeight', productInfo.shippingWeight)
            if(productInfo.shippingLength) formData.append('shippingLength', productInfo.shippingLength)
            if(productInfo.shippingWidth) formData.append('shippingWidth', productInfo.shippingWidth)
            if(productInfo.shippingHeight) formData.append('shippingHeight', productInfo.shippingHeight)
            if(productInfo.warranty) formData.append('warranty', productInfo.warranty)
            if(productInfo.returnPolicy) formData.append('returnPolicy', productInfo.returnPolicy)
            if(productInfo.tags) formData.append('tags', productInfo.tags)
            if(productInfo.metaTitle) formData.append('metaTitle', productInfo.metaTitle)
            if(productInfo.metaDescription) formData.append('metaDescription', productInfo.metaDescription)

            // menambahkan gambar ke formData
            Object.keys(images).forEach((key) => {
                if(images[key]) {
                    formData.append('images', images[key])
                }
            })

            const token = await getToken()
            const { data } = await axios.post('/api/store/product', formData, { headers: { Authorization: `Bearer ${token}` } })
            toast.success(data.message)

            // reset form
            setProductInfo({
                name: "",
                description: "",
                mrp: 0,
                price: 0,
                categoryId: "",
                inStock: true,
                stock: 0,
                minStock: 0,
                weight: "",
                dimensions: "",
                model: "",
                additionalInfo: "",
                status: "draft",
                sku: "",
                barcode: "",
                shippingWeight: "",
                shippingLength: "",
                shippingWidth: "",
                shippingHeight: "",
                warranty: "",
                returnPolicy: "",
                tags: "",
                metaTitle: "",
                metaDescription: "",
            })
            // reset images
            setImages({ 1: null, 2: null, 3: null, 4: null })
        } catch (error) {
            toast.error(error.response?.data?.error || error.message)
        } finally {
            setLoading(false)
        }

    }


    return (
        <form onSubmit={e => {e.preventDefault(); toast.promise(onSubmitHandler(e), { loading: "Adding Product..." })}} className="text-slate-500 mb-28">
            <h1 className="text-2xl">Add New <span className="text-slate-800 font-medium">Products</span></h1>
            <p className="mt-7">Product Images</p>

            <div htmlFor="" className="flex gap-3 mt-4">
                {Object.keys(images).map((key) => (
                    <label key={key} htmlFor={`images${key}`}>
                        <Image width={300} height={300} className='h-15 w-auto border border-slate-200 rounded cursor-pointer' src={images[key] ? URL.createObjectURL(images[key]) : assets.upload_area} alt="" />
                        <input type="file" accept='image/*' id={`images${key}`} onChange={e => setImages({ ...images, [key]: e.target.files[0] })} hidden />
                    </label>
                ))}
            </div>

            <label htmlFor="" className="flex flex-col gap-2 my-6 ">
                Name
                <input type="text" name="name" onChange={onChangeHandler} value={productInfo.name} placeholder="Enter product name" className="w-full max-w-sm p-2 px-4 outline-none border border-slate-200 rounded" required />
            </label>

            <label htmlFor="" className="flex flex-col gap-2 my-6 ">
                Description
                <textarea name="description" onChange={onChangeHandler} value={productInfo.description} placeholder="Enter product description" rows={5} className="w-full max-w-sm p-2 px-4 outline-none border border-slate-200 rounded resize-none" required />
            </label>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                    <label htmlFor="" className="flex flex-col gap-2">
                        Actual Price ($)
                        <input type="number" name="mrp" onChange={onChangeHandler} value={productInfo.mrp} placeholder="0" rows={5} className="w-full p-2 px-4 outline-none border border-slate-200 rounded resize-none" required />
                    </label>
                </div>
                <div>
                    <label htmlFor="" className="flex flex-col gap-2">
                        Offer Price ($)
                        <input type="number" name="price" onChange={onChangeHandler} value={productInfo.price} placeholder="0" rows={5} className="w-full p-2 px-4 outline-none border border-slate-200 rounded resize-none" required />
                    </label>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-6">
                <div>
                    <label htmlFor="" className="flex flex-col gap-2">
                        Category
                        {categoriesLoading ? (
                            <div className="w-full p-2 px-4 border border-slate-200 rounded bg-gray-100">Loading categories...</div>
                        ) : (
                            <select 
                                name="categoryId" 
                                onChange={onChangeHandler} 
                                value={productInfo.categoryId} 
                                className="w-full p-2 px-4 outline-none border border-slate-200 rounded" 
                                required
                            >
                                <option value="">Select a category</option>
                                {categories.map((category) => (
                                    <option key={category.id} value={category.id}>{category.name}</option>
                                ))}
                            </select>
                        )}
                    </label>
                </div>
                <div>
                    <label htmlFor="" className="flex flex-col gap-2">
                        Status
                        <select name="status" onChange={onChangeHandler} value={productInfo.status} className="w-full p-2 px-4 outline-none border border-slate-200 rounded">
                            <option value="draft">Draft</option>
                            <option value="published">Published</option>
                            <option value="archived">Archived</option>
                        </select>
                    </label>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-6">
                <div>
                    <label htmlFor="" className="flex flex-col gap-2">
                        SKU
                        <input type="text" name="sku" onChange={onChangeHandler} value={productInfo.sku} placeholder="Enter product SKU" className="w-full p-2 px-4 outline-none border border-slate-200 rounded" />
                    </label>
                </div>
                <div>
                    <label htmlFor="" className="flex flex-col gap-2">
                        Barcode
                        <input type="text" name="barcode" onChange={onChangeHandler} value={productInfo.barcode} placeholder="Enter product barcode (if any)" className="w-full p-2 px-4 outline-none border border-slate-200 rounded" />
                    </label>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-6">
                <div>
                    <label htmlFor="" className="flex flex-col gap-2">
                        In Stock
                        <div className="flex items-center">
                            <input 
                                type="checkbox" 
                                name="inStock" 
                                onChange={onChangeHandler} 
                                checked={productInfo.inStock} 
                                className="w-5 h-5"
                            />
                            <span className="ml-2">Product is in stock</span>
                        </div>
                    </label>
                </div>
                <div>
                    <label htmlFor="" className="flex flex-col gap-2">
                        Stock Quantity
                        <input type="number" name="stock" onChange={onChangeHandler} value={productInfo.stock} placeholder="0" className="w-full p-2 px-4 outline-none border border-slate-200 rounded" />
                    </label>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-6">
                <div>
                    <label htmlFor="" className="flex flex-col gap-2">
                        Minimum Stock Level
                        <input type="number" name="minStock" onChange={onChangeHandler} value={productInfo.minStock} placeholder="0" className="w-full p-2 px-4 outline-none border border-slate-200 rounded" />
                    </label>
                </div>
                <div>
                    <label htmlFor="" className="flex flex-col gap-2">
                        Weight (kg)
                        <input type="text" name="weight" onChange={onChangeHandler} value={productInfo.weight} placeholder="e.g. 1.5 kg" className="w-full p-2 px-4 outline-none border border-slate-200 rounded" />
                    </label>
                </div>
            </div>

            <label htmlFor="" className="flex flex-col gap-2 my-6">
                Dimensions (L x W x H)
                <input type="text" name="dimensions" onChange={onChangeHandler} value={productInfo.dimensions} placeholder="e.g. 10 x 5 x 3 cm" className="w-full max-w-sm p-2 px-4 outline-none border border-slate-200 rounded" />
            </label>

            <label htmlFor="" className="flex flex-col gap-2 my-6">
                Model
                <input type="text" name="model" onChange={onChangeHandler} value={productInfo.model} placeholder="Enter product model (if any)" className="w-full max-w-sm p-2 px-4 outline-none border border-slate-200 rounded" />
            </label>

            <label htmlFor="" className="flex flex-col gap-2 my-6">
                Additional Information
                <textarea name="additionalInfo" onChange={onChangeHandler} value={productInfo.additionalInfo} placeholder="Additional product information" rows={3} className="w-full max-w-sm p-2 px-4 outline-none border border-slate-200 rounded resize-none" />
            </label>

            <h2 className="text-xl mt-8 mb-4">Shipping Information</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5">
                <label htmlFor="" className="flex flex-col gap-2">
                    Weight (kg)
                    <input type="text" name="shippingWeight" onChange={onChangeHandler} value={productInfo.shippingWeight} placeholder="e.g. 2.0 kg" className="w-full p-2 px-4 outline-none border border-slate-200 rounded" />
                </label>
                <label htmlFor="" className="flex flex-col gap-2">
                    Length (cm)
                    <input type="text" name="shippingLength" onChange={onChangeHandler} value={productInfo.shippingLength} placeholder="e.g. 30 cm" className="w-full p-2 px-4 outline-none border border-slate-200 rounded" />
                </label>
                <label htmlFor="" className="flex flex-col gap-2">
                    Width (cm)
                    <input type="text" name="shippingWidth" onChange={onChangeHandler} value={productInfo.shippingWidth} placeholder="e.g. 20 cm" className="w-full p-2 px-4 outline-none border border-slate-200 rounded" />
                </label>
                <label htmlFor="" className="flex flex-col gap-2">
                    Height (cm)
                    <input type="text" name="shippingHeight" onChange={onChangeHandler} value={productInfo.shippingHeight} placeholder="e.g. 15 cm" className="w-full p-2 px-4 outline-none border border-slate-200 rounded" />
                </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-6">
                <div>
                    <label htmlFor="" className="flex flex-col gap-2">
                        Warranty
                        <input type="text" name="warranty" onChange={onChangeHandler} value={productInfo.warranty} placeholder="e.g. 1 Year" className="w-full p-2 px-4 outline-none border border-slate-200 rounded" />
                    </label>
                </div>
                <div>
                    <label htmlFor="" className="flex flex-col gap-2">
                        Return Policy
                        <input type="text" name="returnPolicy" onChange={onChangeHandler} value={productInfo.returnPolicy} placeholder="e.g. 30 Days" className="w-full p-2 px-4 outline-none border border-slate-200 rounded" />
                    </label>
                </div>
            </div>

            <label htmlFor="" className="flex flex-col gap-2 my-6">
                Tags
                <input type="text" name="tags" onChange={onChangeHandler} value={productInfo.tags} placeholder="Enter tags separated by commas (e.g., electronics, gadget, new)" className="w-full max-w-sm p-2 px-4 outline-none border border-slate-200 rounded" />
            </label>

            <h2 className="text-xl mt-8 mb-4">SEO Information</h2>
            <label htmlFor="" className="flex flex-col gap-2 my-6">
                Meta Title
                <input type="text" name="metaTitle" onChange={onChangeHandler} value={productInfo.metaTitle} placeholder="Enter meta title for SEO" className="w-full max-w-sm p-2 px-4 outline-none border border-slate-200 rounded" />
            </label>

            <label htmlFor="" className="flex flex-col gap-2 my-6">
                Meta Description
                <textarea name="metaDescription" onChange={onChangeHandler} value={productInfo.metaDescription} placeholder="Enter meta description for SEO" rows={3} className="w-full max-w-sm p-2 px-4 outline-none border border-slate-200 rounded resize-none" />
            </label>

            <br />

            <button disabled={loading} className="bg-slate-800 text-white px-6 mt-7 py-2 hover:bg-slate-900 rounded transition">Add Product</button>
        </form>
    )
}