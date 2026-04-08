import React, { useState, useEffect } from "react";
import { vendorAPI } from "../utils/Api";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const VendorController = () => {
  const [vendors, setVendors] = useState([]);
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
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
    status: "Active",
  });
  const [documents, setDocuments] = useState([null, null, null]);
  const [loading, setLoading] = useState(false);

  // Fetch all vendors
  useEffect(() => {
    fetchVendors();
  }, []);

  const fetchVendors = async () => {
    try {
      setLoading(true);
      const response = await vendorAPI.getAllVendors();
      setVendors(response.data);
    } catch (error) {
      toast.error(error.message || "Failed to fetch vendors");
    } finally {
      setLoading(false);
    }
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // Handle document uploads
  const handleDocumentChange = (index, e) => {
    const newDocuments = [...documents];
    newDocuments[index] = e.target.files[0];
    setDocuments(newDocuments);
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
      status: "Active",
    });
    setDocuments([null, null, null]);
    setSelectedVendor(null);
  };

  // Create or update vendor
  const handleSubmit = async (e) => {
    e.preventDefault();
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

      if (selectedVendor) {
        // Update vendor
        await vendorAPI.updateVendor(selectedVendor.VENDOR_ID, formDataToSend);
        toast.success("Vendor updated successfully");
      } else {
        // Create vendor
        await vendorAPI.createVendor(formDataToSend);
        toast.success("Vendor created successfully");
      }

      resetForm();
      setIsModalOpen(false);
      fetchVendors();
    } catch (error) {
      toast.error(error.message || "Operation failed");
    } finally {
      setLoading(false);
    }
  };

  // Delete vendor
  const handleDelete = async (vendorId) => {
    if (window.confirm("Are you sure you want to delete this vendor?")) {
      try {
        setLoading(true);
        await vendorAPI.deleteVendor(vendorId);
        toast.success("Vendor deleted successfully");
        fetchVendors();
      } catch (error) {
        toast.error(error.message || "Failed to delete vendor");
      } finally {
        setLoading(false);
      }
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
        status: vendorData.STATUS || "Active",
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
    <div className="container mx-auto p-4">
      <ToastContainer />
      <h1 className="text-2xl font-bold mb-4">Vendor Management</h1>

      {/* Create Button */}
      <button
        onClick={() => {
          resetForm();
          setIsModalOpen(true);
        }}
        className="mb-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
      >
        Create New Vendor
      </button>

      {/* Vendors Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border">
          <thead>
            <tr>
              <th className="px-4 py-2 border">ID</th>
              <th className="px-4 py-2 border">Name</th>
              <th className="px-4 py-2 border">Code</th>
              <th className="px-4 py-2 border">Email</th>
              <th className="px-4 py-2 border">Documents</th>
              <th className="px-4 py-2 border">Status</th>
              <th className="px-4 py-2 border">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="7" className="text-center py-4">
                  Loading...
                </td>
              </tr>
            ) : (
              vendors.map((vendor) => (
                <tr key={vendor.VENDOR_ID}>
                  <td className="px-4 py-2 border">{vendor.VENDOR_ID}</td>
                  <td className="px-4 py-2 border">{vendor.VENDOR_NAME}</td>
                  <td className="px-4 py-2 border">{vendor.VENDOR_CODE}</td>
                  <td className="px-4 py-2 border">{vendor.EMAIL_ID1}</td>
                  <td className="px-4 py-2 border">
                    {["1", "2", "3"].map(
                      (doc) =>
                        vendor[`HAS_DOCUMENT${doc}`] === "true" && (
                          <button
                            key={doc}
                            onClick={() =>
                              handleViewDocument(vendor.VENDOR_ID, doc)
                            }
                            className="text-blue-500 hover:underline mr-2"
                          >
                            Doc {doc}
                          </button>
                        )
                    )}
                  </td>
                  <td className="px-4 py-2 border">{vendor.STATUS}</td>
                  <td className="px-4 py-2 border">
                    <button
                      onClick={() => handleEdit(vendor)}
                      className="text-blue-500 hover:underline mr-2"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(vendor.VENDOR_ID)}
                      className="text-red-500 hover:underline"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal for Create/Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg max-w-4xl w-full max-h-[80vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">
              {selectedVendor ? "Edit Vendor" : "Create Vendor"}
            </h2>
            <form onSubmit={handleSubmit}>
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block mb-1">Vendor Name *</label>
                  <input
                    type="text"
                    name="vendor_name"
                    value={formData.vendor_name}
                    onChange={handleInputChange}
                    className="w-full border rounded px-2 py-1"
                    required
                  />
                </div>
                <div>
                  <label className="block mb-1">Vendor Code</label>
                  <input
                    type="text"
                    name="vendor_code"
                    value={formData.vendor_code}
                    onChange={handleInputChange}
                    className="w-full border rounded px-2 py-1"
                  />
                </div>
                <div>
                  <label className="block mb-1">Terminal ID</label>
                  <input
                    type="number"
                    name="terminal_id"
                    value={formData.terminal_id}
                    onChange={handleInputChange}
                    className="w-full border rounded px-2 py-1"
                  />
                </div>
                <div>
                  <label className="block mb-1">Email 1</label>
                  <input
                    type="email"
                    name="email_id1"
                    value={formData.email_id1}
                    onChange={handleInputChange}
                    className="w-full border rounded px-2 py-1"
                  />
                </div>
                <div>
                  <label className="block mb-1">Email 2</label>
                  <input
                    type="email"
                    name="email_id2"
                    value={formData.email_id2}
                    onChange={handleInputChange}
                    className="w-full border rounded px-2 py-1"
                  />
                </div>
                <div>
                  <label className="block mb-1">Contact No</label>
                  <input
                    type="text"
                    name="contact_no"
                    value={formData.contact_no}
                    onChange={handleInputChange}
                    className="w-full border rounded px-2 py-1"
                  />
                </div>
                <div>
                  <label className="block mb-1">Mobile No</label>
                  <input
                    type="text"
                    name="mobile_no"
                    value={formData.mobile_no}
                    onChange={handleInputChange}
                    className="w-full border rounded px-2 py-1"
                  />
                </div>
                <div>
                  <label className="block mb-1">Fax</label>
                  <input
                    type="text"
                    name="fax"
                    value={formData.fax}
                    onChange={handleInputChange}
                    className="w-full border rounded px-2 py-1"
                  />
                </div>
              </div>

              {/* Address Info */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="col-span-2">
                  <label className="block mb-1">Address</label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    className="w-full border rounded px-2 py-1"
                  />
                </div>
                <div>
                  <label className="block mb-1">City</label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    className="w-full border rounded px-2 py-1"
                  />
                </div>
                <div>
                  <label className="block mb-1">Pin Code</label>
                  <input
                    type="text"
                    name="pin_code"
                    value={formData.pin_code}
                    onChange={handleInputChange}
                    className="w-full border rounded px-2 py-1"
                  />
                </div>
                <div>
                  <label className="block mb-1">State Code</label>
                  <input
                    type="text"
                    name="state_code"
                    value={formData.state_code}
                    onChange={handleInputChange}
                    className="w-full border rounded px-2 py-1"
                  />
                </div>
                <div>
                  <label className="block mb-1">Country</label>
                  <input
                    type="text"
                    name="country"
                    value={formData.country}
                    onChange={handleInputChange}
                    className="w-full border rounded px-2 py-1"
                  />
                </div>
              </div>

              {/* Tax and Bank Info */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block mb-1">PAN</label>
                  <input
                    type="text"
                    name="pan"
                    value={formData.pan}
                    onChange={handleInputChange}
                    className="w-full border rounded px-2 py-1"
                  />
                </div>
                <div>
                  <label className="block mb-1">TAN</label>
                  <input
                    type="text"
                    name="tan"
                    value={formData.tan}
                    onChange={handleInputChange}
                    className="w-full border rounded px-2 py-1"
                  />
                </div>
                <div>
                  <label className="block mb-1">Service Tax Reg</label>
                  <input
                    type="text"
                    name="service_tax_reg"
                    value={formData.service_tax_reg}
                    onChange={handleInputChange}
                    className="w-full border rounded px-2 py-1"
                  />
                </div>
                <div>
                  <label className="block mb-1">GSTIN</label>
                  <input
                    type="text"
                    name="gstin"
                    value={formData.gstin}
                    onChange={handleInputChange}
                    className="w-full border rounded px-2 py-1"
                  />
                </div>
                <div>
                  <label className="block mb-1">Bank Name</label>
                  <input
                    type="text"
                    name="bank_name"
                    value={formData.bank_name}
                    onChange={handleInputChange}
                    className="w-full border rounded px-2 py-1"
                  />
                </div>
                <div>
                  <label className="block mb-1">Account No</label>
                  <input
                    type="text"
                    name="account_no"
                    value={formData.account_no}
                    onChange={handleInputChange}
                    className="w-full border rounded px-2 py-1"
                  />
                </div>
                <div>
                  <label className="block mb-1">IFSC</label>
                  <input
                    type="text"
                    name="ifsc"
                    value={formData.ifsc}
                    onChange={handleInputChange}
                    className="w-full border rounded px-2 py-1"
                  />
                </div>
                <div>
                  <label className="block mb-1">Bank Branch</label>
                  <input
                    type="text"
                    name="bank_branch"
                    value={formData.bank_branch}
                    onChange={handleInputChange}
                    className="w-full border rounded px-2 py-1"
                  />
                </div>
                <div>
                  <label className="block mb-1">AC Map Code</label>
                  <input
                    type="text"
                    name="ac_map_code"
                    value={formData.ac_map_code}
                    onChange={handleInputChange}
                    className="w-full border rounded px-2 py-1"
                  />
                </div>
                <div>
                  <label className="block mb-1">Payment Terms</label>
                  <input
                    type="text"
                    name="payment_terms"
                    value={formData.payment_terms}
                    onChange={handleInputChange}
                    className="w-full border rounded px-2 py-1"
                  />
                </div>
              </div>

              {/* Documents */}
              <div className="mb-4">
                <label className="block mb-1">
                  PDF Documents (Max 3, 5MB each)
                </label>
                {[1, 2, 3].map((index) => (
                  <div key={index} className="mb-2">
                    <label className="block mb-1">
                      Document {index} (PDF only)
                    </label>
                    <input
                      type="file"
                      accept="application/pdf"
                      onChange={(e) => handleDocumentChange(index - 1, e)}
                      className="w-full"
                    />
                  </div>
                ))}
              </div>

              {/* Status */}
              <div className="mb-4">
                <label className="block mb-1">Status</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="w-full border rounded px-2 py-1"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>

              {/* Form Actions */}
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-blue-300"
                >
                  {loading
                    ? "Processing..."
                    : selectedVendor
                    ? "Update"
                    : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default VendorController;
