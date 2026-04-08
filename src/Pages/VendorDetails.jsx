import React, { useState, useEffect } from "react";
import { vendorAPI } from "../utils/Api";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  Search,
  Edit2,
  FileText,
  X,
  Check,
  AlertCircle,
  Building2,
  Phone,
  Mail,
  MapPin,
  CreditCard,
} from "lucide-react";

const VendorManagement = () => {
  const [vendors, setVendors] = useState([]);
  const [filteredVendors, setFilteredVendors] = useState([]);
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [formData, setFormData] = useState({
    vendor_name: "",
    terminal_id: "",
    vendor_code: "",
    address: "",
    city: "",
    pin_code: "",
    state_code: "",
    country: "India",
    email_id1: "",
    email_id2: "",
    contact_no: "",
    mobile_no: "",
    fax: "",
    payment_terms: "",
    pan: "",
    tan: "",
    service_tax_reg: "",
    bank_name: "",
    ac_map_code: "",
    account_no: "",
    ifsc: "",
    bank_branch: "",
    gstin: "",
  });
  const [documents, setDocuments] = useState([null, null, null]);
  const [loading, setLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});

  // Fetch all vendors
  useEffect(() => {
    fetchVendors();
  }, []);

  const fetchVendors = async () => {
    try {
      setLoading(true);
      const response = await vendorAPI.getAllVendors();
      const activeVendors = response.data.filter(
        (vendor) => vendor.STATUS === "Active"
      );
      setVendors(activeVendors);
      setFilteredVendors(activeVendors);
    } catch (error) {
      toast.error(error.message || "Failed to fetch vendors");
    } finally {
      setLoading(false);
    }
  };

  // Search logic for active vendors
  useEffect(() => {
    let filtered = vendors.filter((vendor) => {
      return (
        vendor.VENDOR_NAME.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vendor.VENDOR_CODE.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vendor.EMAIL_ID1.toLowerCase().includes(searchTerm.toLowerCase())
      );
    });
    setFilteredVendors(filtered);
    setCurrentPage(1);
  }, [searchTerm, vendors]);

  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentVendors = filteredVendors.slice(
    indexOfFirstItem,
    indexOfLastItem
  );
  const totalPages = Math.ceil(filteredVendors.length / itemsPerPage);

  // Form validation
  const validateForm = () => {
    const errors = {};
    if (!formData.vendor_name.trim())
      errors.vendor_name = "Vendor name is required";
    if (formData.email_id1 && !/\S+@\S+\.\S+/.test(formData.email_id1)) {
      errors.email_id1 = "Invalid email format";
    }
    if (formData.email_id2 && !/\S+@\S+\.\S+/.test(formData.email_id2)) {
      errors.email_id2 = "Invalid email format";
    }
    if (formData.pin_code && !/^\d{6}$/.test(formData.pin_code)) {
      errors.pin_code = "Pin code must be 6 digits";
    }
    if (formData.pan && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(formData.pan)) {
      errors.pan = "Invalid PAN format";
    }
    if (
      formData.gstin &&
      !/^\d{2}[A-Z]{5}\d{4}[A-Z]{1}[A-Z\d]{1}[Z]{1}[A-Z\d]{1}$/.test(
        formData.gstin
      )
    ) {
      errors.gstin = "Invalid GSTIN format";
    }
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (validationErrors[name]) {
      setValidationErrors({ ...validationErrors, [name]: "" });
    }
  };

  // Handle document uploads
  const handleDocumentChange = (index, e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.type !== "application/pdf") {
        toast.error("Only PDF files are allowed");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error("File size must be less than 5MB");
        return;
      }
      const newDocuments = [...documents];
      newDocuments[index] = file;
      setDocuments(newDocuments);
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      vendor_name: "",
      terminal_id: "",
      vendor_code: "",
      address: "",
      city: "",
      pin_code: "",
      state_code: "",
      country: "India",
      email_id1: "",
      email_id2: "",
      contact_no: "",
      mobile_no: "",
      fax: "",
      payment_terms: "",
      pan: "",
      tan: "",
      service_tax_reg: "",
      bank_name: "",
      ac_map_code: "",
      account_no: "",
      ifsc: "",
      bank_branch: "",
      gstin: "",
    });
    setDocuments([null, null, null]);
    setSelectedVendor(null);
    setValidationErrors({});
  };

  // Update vendor
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setLoading(true);
      const formDataToSend = new FormData();

      // Append form data, excluding null/undefined/empty strings
      Object.keys(formData).forEach((key) => {
        if (
          formData[key] !== null &&
          formData[key] !== undefined &&
          formData[key] !== ""
        ) {
          formDataToSend.append(key, formData[key]);
        }
      });

      // Append documents
      documents.forEach((doc) => {
        if (doc) {
          formDataToSend.append("documents", doc);
        }
      });

      // Update vendor
      await vendorAPI.updateVendor(selectedVendor.VENDOR_ID, formDataToSend);
      toast.success("Vendor updated successfully");

      resetForm();
      setIsModalOpen(false);
      fetchVendors();
    } catch (error) {
      toast.error(error.message || "Operation failed");
    } finally {
      setLoading(false);
    }
  };

  // Open edit modal
  const handleEdit = async (vendor) => {
    try {
      setLoading(true);
      const response = await vendorAPI.getVendorById(vendor.VENDOR_ID);
      const vendorData = response.data;
      setSelectedVendor(vendorData);
      setFormData({
        vendor_name: vendorData.VENDOR_NAME || "",
        terminal_id: vendorData.TERMINAL_ID || "",
        vendor_code: vendorData.VENDOR_CODE || "",
        address: vendorData.ADDRESS || "",
        city: vendorData.CITY || "",
        pin_code: vendorData.PIN_CODE || "",
        state_code: vendorData.STATE_CODE || "",
        country: vendorData.COUNTRY || "India",
        email_id1: vendorData.EMAIL_ID1 || "",
        email_id2: vendorData.EMAIL_ID2 || "",
        contact_no: vendorData.CONTACT_NO || "",
        mobile_no: vendorData.MOBILE_NO || "",
        fax: vendorData.FAX || "",
        payment_terms: vendorData.PAYMENT_TERMS || "",
        pan: vendorData.PAN || "",
        tan: vendorData.TAN || "",
        service_tax_reg: vendorData.SERVICE_TAX_REG || "",
        bank_name: vendorData.BANK_NAME || "",
        ac_map_code: vendorData.AC_MAP_CODE || "",
        account_no: vendorData.ACCOUNT_NO || "",
        ifsc: vendorData.IFSC || "",
        bank_branch: vendorData.BANK_BRANCH || "",
        gstin: vendorData.GSTIN || "",
      });
      setDocuments([null, null, null]);
      setIsModalOpen(true);
    } catch (error) {
      toast.error(error.message || "Failed to fetch vendor details");
    } finally {
      setLoading(false);
    }
  };

  // View document
  const handleViewDocument = async (vendorId, docNumber) => {
    try {
      const response = await vendorAPI.getVendorDocument(vendorId, docNumber);
      const url = window.URL.createObjectURL(new Blob([response]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `vendor_document_${vendorId}_${docNumber}.pdf`
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      toast.error(error.message || "Failed to download document");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <ToastContainer />
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center">
            <Building2 className="h-8 w-8 text-blue-600 mr-3" />
            <h1 className="text-3xl font-bold text-gray-900">Active Vendors</h1>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search active vendors..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Vendors Grid */}
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Vendor Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Documents
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan="4" className="px-6 py-12 text-center">
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        <span className="ml-3 text-gray-600">
                          Loading vendors...
                        </span>
                      </div>
                    </td>
                  </tr>
                ) : currentVendors.length === 0 ? (
                  <tr>
                    <td
                      colSpan="4"
                      className="px-6 py-12 text-center text-gray-500"
                    >
                      No active vendors found
                    </td>
                  </tr>
                ) : (
                  currentVendors.map((vendor) => (
                    <tr key={vendor.VENDOR_ID} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="font-medium text-gray-900">
                            {vendor.VENDOR_NAME}
                          </div>
                          <div className="text-sm text-gray-500">
                            ID: {vendor.VENDOR_ID} | Code: {vendor.VENDOR_CODE}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="space-y-1">
                          <div className="flex items-center text-sm text-gray-600">
                            <Mail className="h-4 w-4 mr-2" />
                            {vendor.EMAIL_ID1}
                          </div>
                          <div className="flex items-center text-sm text-gray-600">
                            <Phone className="h-4 w-4 mr-2" />
                            {vendor.CONTACT_NO}
                          </div>
                          <div className="flex items-center text-sm text-gray-600">
                            <MapPin className="h-4 w-4 mr-2" />
                            {vendor.CITY}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex space-x-2">
                          {["1", "2", "3"].map((doc) =>
                            vendor[`HAS_DOCUMENT${doc}`] === "true" ? (
                              <button
                                key={doc}
                                onClick={() =>
                                  handleViewDocument(vendor.VENDOR_ID, doc)
                                }
                                className="inline-flex items-center px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full hover:bg-green-200 transition-colors"
                              >
                                <FileText className="h-3 w-3 mr-1" />
                                Doc {doc}
                              </button>
                            ) : (
                              <span
                                key={doc}
                                className="inline-flex items-center px-2 py-1 bg-gray-100 text-gray-500 text-xs font-medium rounded-full"
                              >
                                <X className="h-3 w-3 mr-1" />
                                Doc {doc}
                              </span>
                            )
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => handleEdit(vendor)}
                          className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(prev - 1, 1))
                  }
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                  }
                  disabled={currentPage === totalPages}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Showing{" "}
                    <span className="font-medium">{indexOfFirstItem + 1}</span>{" "}
                    to{" "}
                    <span className="font-medium">
                      {Math.min(indexOfLastItem, filteredVendors.length)}
                    </span>{" "}
                    of{" "}
                    <span className="font-medium">
                      {filteredVendors.length}
                    </span>{" "}
                    results
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                      (page) => (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                            currentPage === page
                              ? "z-10 bg-blue-50 border-blue-500 text-blue-600"
                              : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50"
                          }`}
                        >
                          {page}
                        </button>
                      )
                    )}
                  </nav>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal for Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div
              className="fixed inset-0 transition-opacity"
              onClick={() => setIsModalOpen(false)}
            >
              <div className="absolute inset-0 bg-gray-900 opacity-75"></div>
            </div>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
              <form onSubmit={handleSubmit}>
                <div className="bg-white px-6 py-4 border-b">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium text-gray-900">
                      Edit Vendor
                    </h3>
                    <button
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      className="text-gray-400 hover:text-gray-500 p-1"
                    >
                      <X className="h-6 w-6" />
                    </button>
                  </div>
                </div>

                <div className="max-h-[calc(100vh-200px)] overflow-y-auto">
                  <div className="px-6 py-6 space-y-6">
                    {/* Basic Information */}
                    <div>
                      <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                        <Building2 className="h-5 w-5 mr-2" />
                        Basic Information
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Vendor Name *
                          </label>
                          <input
                            type="text"
                            name="vendor_name"
                            value={formData.vendor_name}
                            onChange={handleInputChange}
                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                              validationErrors.vendor_name
                                ? "border-red-300"
                                : "border-gray-300"
                            }`}
                            required
                          />
                          {validationErrors.vendor_name && (
                            <p className="mt-1 text-sm text-red-600 flex items-center">
                              <AlertCircle className="h-4 w-4 mr-1" />
                              {validationErrors.vendor_name}
                            </p>
                          )}
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Vendor Code
                          </label>
                          <input
                            type="text"
                            name="vendor_code"
                            value={formData.vendor_code}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Terminal ID
                          </label>
                          <input
                            type="number"
                            name="terminal_id"
                            value={formData.terminal_id}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Contact Information */}
                    <div>
                      <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                        <Phone className="h-5 w-5 mr-2" />
                        Contact Information
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Primary Email
                          </label>
                          <input
                            type="email"
                            name="email_id1"
                            value={formData.email_id1}
                            onChange={handleInputChange}
                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                              validationErrors.email_id1
                                ? "border-red-300"
                                : "border-gray-300"
                            }`}
                          />
                          {validationErrors.email_id1 && (
                            <p className="mt-1 text-sm text-red-600">
                              {validationErrors.email_id1}
                            </p>
                          )}
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Secondary Email
                          </label>
                          <input
                            type="email"
                            name="email_id2"
                            value={formData.email_id2}
                            onChange={handleInputChange}
                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                              validationErrors.email_id2
                                ? "border-red-300"
                                : "border-gray-300"
                            }`}
                          />
                          {validationErrors.email_id2 && (
                            <p className="mt-1 text-sm text-red-600">
                              {validationErrors.email_id2}
                            </p>
                          )}
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Contact Number
                          </label>
                          <input
                            type="text"
                            name="contact_no"
                            value={formData.contact_no}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Mobile Number
                          </label>
                          <input
                            type="text"
                            name="mobile_no"
                            value={formData.mobile_no}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Fax
                          </label>
                          <input
                            type="text"
                            name="fax"
                            value={formData.fax}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Address Information */}
                    <div>
                      <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                        <MapPin className="h-5 w-5 mr-2" />
                        Address Information
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Address
                          </label>
                          <textarea
                            name="address"
                            value={formData.address}
                            onChange={handleInputChange}
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            City
                          </label>
                          <input
                            type="text"
                            name="city"
                            value={formData.city}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            PIN Code
                          </label>
                          <input
                            type="text"
                            name="pin_code"
                            value={formData.pin_code}
                            onChange={handleInputChange}
                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                              validationErrors.pin_code
                                ? "border-red-300"
                                : "border-gray-300"
                            }`}
                          />
                          {validationErrors.pin_code && (
                            <p className="mt-1 text-sm text-red-600">
                              {validationErrors.pin_code}
                            </p>
                          )}
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            State Code
                          </label>
                          <input
                            type="text"
                            name="state_code"
                            value={formData.state_code}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Country
                          </label>
                          <input
                            type="text"
                            name="country"
                            value={formData.country}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Tax and Banking Information */}
                    <div>
                      <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                        <CreditCard className="h-5 w-5 mr-2" />
                        Tax & Banking Information
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            PAN Number
                          </label>
                          <input
                            type="text"
                            name="pan"
                            value={formData.pan}
                            onChange={handleInputChange}
                            placeholder="ABCDE1234F"
                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                              validationErrors.pan
                                ? "border-red-300"
                                : "border-gray-300"
                            }`}
                          />
                          {validationErrors.pan && (
                            <p className="mt-1 text-sm text-red-600">
                              {validationErrors.pan}
                            </p>
                          )}
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            TAN Number
                          </label>
                          <input
                            type="text"
                            name="tan"
                            value={formData.tan}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            GSTIN
                          </label>
                          <input
                            type="text"
                            name="gstin"
                            value={formData.gstin}
                            onChange={handleInputChange}
                            placeholder="22AAAAA0000A1Z5"
                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                              validationErrors.gstin
                                ? "border-red-300"
                                : "border-gray-300"
                            }`}
                          />
                          {validationErrors.gstin && (
                            <p className="mt-1 text-sm text-red-600">
                              {validationErrors.gstin}
                            </p>
                          )}
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Service Tax Registration
                          </label>
                          <input
                            type="text"
                            name="service_tax_reg"
                            value={formData.service_tax_reg}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Bank Name
                          </label>
                          <input
                            type="text"
                            name="bank_name"
                            value={formData.bank_name}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Account Number
                          </label>
                          <input
                            type="text"
                            name="account_no"
                            value={formData.account_no}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            IFSC Code
                          </label>
                          <input
                            type="text"
                            name="ifsc"
                            value={formData.ifsc}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Bank Branch
                          </label>
                          <input
                            type="text"
                            name="bank_branch"
                            value={formData.bank_branch}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Payment Terms
                          </label>
                          <input
                            type="text"
                            name="payment_terms"
                            value={formData.payment_terms}
                            onChange={handleInputChange}
                            placeholder="e.g., Net 30"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            AC Map Code
                          </label>
                          <input
                            type="text"
                            name="ac_map_code"
                            value={formData.ac_map_code}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Document Upload */}
                    <div>
                      <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                        <FileText className="h-5 w-5 mr-2" />
                        Document Upload
                      </h4>
                      <div className="space-y-4">
                        <p className="text-sm text-gray-600">
                          Upload up to 3 PDF documents (max 5MB each)
                        </p>
                        {[1, 2, 3].map((index) => (
                          <div
                            key={index}
                            className="border border-dashed border-gray-300 rounded-lg p-4"
                          >
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Document {index}
                            </label>
                            <input
                              type="file"
                              accept="application/pdf"
                              onChange={(e) =>
                                handleDocumentChange(index - 1, e)
                              }
                              className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                            />
                            {documents[index - 1] && (
                              <p className="mt-2 text-sm text-green-600 flex items-center">
                                <Check className="h-4 w-4 mr-1" />
                                {documents[index - 1].name} selected
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 px-6 py-4 flex justify-end space-x-3 border-t">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VendorManagement;
