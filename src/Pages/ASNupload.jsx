import React, { useState, useRef, useEffect } from "react";
import { Check, X, Upload, FileText, Download } from "lucide-react";
import { asnAPI  } from "../utils/Api"; // Adjust the import path as necessary

// Real API functions

const ASNManagement = () => {
  const [activeTab, setActiveTab] = useState("manual");
  const [formData, setFormData] = useState({
    vin: "",
    modelCode: "",
    modelName: "",
    dealerCode: "",
    originCode: "",
    destinationCode: "",
    originTerminal: "",
    destinationTerminal: "",
    invoiceNo: "",
    invoiceAmount: "",
    invoiceDate: "",
    shipmentNo: "",
  });
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState({ type: "", text: "" });
  const [loading, setLoading] = useState(false);
  const [csvFile, setCsvFile] = useState(null);
  const [csvData, setCsvData] = useState([]);
  const [csvErrors, setCsvErrors] = useState([]);
  const [csvPreview, setCsvPreview] = useState("");
  const fileInputRef = useRef(null);

  // Clear success message after 5 seconds
  useEffect(() => {
    if (message.type === "success" && message.text) {
      const timer = setTimeout(() => {
        setMessage({ type: "", text: "" });
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.originTerminal.trim()) {
      newErrors.originTerminal = "Origin Terminal is required";
    }
    if (!formData.destinationTerminal.trim()) {
      newErrors.destinationTerminal = "Destination Terminal is required";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);
      setMessage({ type: "", text: "" });

      const submitData = {
        ...formData,
        invoiceAmount: formData.invoiceAmount
          ? parseFloat(formData.invoiceAmount)
          : 0,
      };

      const result = await asnAPI.createASN(submitData);
      console.log("API Response:", result);
      setMessage({
        type: "success",
        text: result.message || "ASN record created successfully!",
      });

      // Reset form after successful submission
      setFormData({
        vin: "",
        modelCode: "",
        modelName: "",
        dealerCode: "",
        originCode: "",
        destinationCode: "",
        originTerminal: "",
        destinationTerminal: "",
        invoiceNo: "",
        invoiceAmount: "",
        invoiceDate: "",
        shipmentNo: "",
      });
    } catch (error) {
      console.error("Error creating ASN:", error);
      setMessage({
        type: "error",
        text: error.message || "Failed to create ASN record",
      });
    } finally {
      setLoading(false);
    }
  };

  const parseCSV = (text) => {
    const lines = text.split("\n").filter((line) => line.trim());
    if (lines.length < 2) {
      throw new Error("CSV must have at least a header row and one data row");
    }

    const headers = lines[0].split(",").map((h) => h.trim().replace(/"/g, ""));
    const data = [];
    const errors = [];

    // Create header mapping (case insensitive)
    const headerMap = {};
    headers.forEach((header, index) => {
      const cleanHeader = header.toLowerCase().trim();
      const mappings = {
        vin: "vin",
        "model code": "modelCode",
        modelcode: "modelCode",
        "model name": "modelName",
        modelname: "modelName",
        "dealer code": "dealerCode",
        dealercode: "dealerCode",
        "origin code": "originCode",
        origincode: "originCode",
        "destination code": "destinationCode",
        destinationcode: "destinationCode",
        "origin terminal": "originTerminal",
        originterminal: "originTerminal",
        "destination terminal": "destinationTerminal",
        destinationterminal: "destinationTerminal",
        "invoice no": "invoiceNo",
        "invoice number": "invoiceNo",
        invoiceno: "invoiceNo",
        invoicenumber: "invoiceNo",
        "invoice amount": "invoiceAmount",
        invoiceamount: "invoiceAmount",
        "invoice date": "invoiceDate",
        invoicedate: "invoiceDate",
        "shipment no": "shipmentNo",
        "shipment number": "shipmentNo",
        shipmentno: "shipmentNo",
        shipmentnumber: "shipmentNo",
      };

      if (mappings[cleanHeader]) {
        headerMap[index] = mappings[cleanHeader];
      }
    });

    // Parse data rows
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const values = line.split(",").map((v) => v.trim().replace(/"/g, ""));
      const rowData = {
        vin: "",
        modelCode: "",
        modelName: "",
        dealerCode: "",
        originCode: "",
        destinationCode: "",
        originTerminal: "",
        destinationTerminal: "",
        invoiceNo: "",
        invoiceAmount: "",
        invoiceDate: "",
        shipmentNo: "",
      };

      // Map values to fields
      values.forEach((value, index) => {
        if (headerMap[index]) {
          rowData[headerMap[index]] = value;
        }
      });

      // Validate required fields
      const rowErrors = [];
      if (!rowData.originTerminal) {
        rowErrors.push(`Row ${i}: Origin Terminal is required`);
      }
      if (!rowData.destinationTerminal) {
        rowErrors.push(`Row ${i}: Destination Terminal is required`);
      }
      if (rowData.invoiceAmount && isNaN(parseFloat(rowData.invoiceAmount))) {
        rowErrors.push(`Row ${i}: Invoice Amount must be a valid number`);
      }

      if (rowErrors.length > 0) {
        errors.push(...rowErrors);
      } else {
        // Convert invoice amount to number
        if (rowData.invoiceAmount) {
          rowData.invoiceAmount = parseFloat(rowData.invoiceAmount);
        } else {
          rowData.invoiceAmount = 0;
        }
        data.push(rowData);
      }
    }

    return { data, errors };
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith(".csv")) {
      setMessage({ type: "error", text: "Please select a valid CSV file" });
      return;
    }

    setCsvFile(file);
    setMessage({ type: "", text: "" });

    try {
      const text = await file.text();
      const { data, errors } = parseCSV(text);

      if (errors.length > 0) {
        setCsvErrors(errors);
        setMessage({
          type: "error",
          text: `Validation errors found in ${errors.length} rows`,
        });
      } else {
        setCsvErrors([]);
        setMessage({
          type: "success",
          text: `Successfully parsed ${data.length} records`,
        });
      }

      setCsvData(data);

      // Create preview
      const preview = data
        .slice(0, 5)
        .map((row, index) => {
          return `Record ${index + 1}:\n${Object.entries(row)
            .map(([key, value]) => `  ${key}: ${value || "N/A"}`)
            .join("\n")}`;
        })
        .join("\n\n");

      setCsvPreview(
        preview +
          (data.length > 5 ? `\n\n... and ${data.length - 5} more records` : "")
      );
    } catch (error) {
      console.error("CSV parsing error:", error);
      setMessage({
        type: "error",
        text: `CSV parsing failed: ${error.message}`,
      });
    }
  };

  const handleBulkSubmit = async () => {
    if (csvData.length === 0) {
      setMessage({ type: "error", text: "No data to submit" });
      return;
    }

    if (csvErrors.length > 0) {
      setMessage({
        type: "error",
        text: "Please fix validation errors before submitting",
      });
      return;
    }

    try {
      setLoading(true);
      setMessage({ type: "", text: "" });

      const response = await asnAPI.createBulkASN(csvData);
      console.log("Bulk API Response:", response);
      setMessage({
        type: "success",
        text:
          response.message ||
          `Successfully created ${
            response.count || csvData.length
          } ASN records!`,
      });

      // Reset CSV data
      setCsvFile(null);
      setCsvData([]);
      setCsvPreview("");
      setCsvErrors([]);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (error) {
      console.error("Bulk submit error:", error);
      setMessage({
        type: "error",
        text: error.message || "Failed to create bulk ASN records",
      });
    } finally {
      setLoading(false);
    }
  };

  const downloadTemplate = () => {
    const headers = [
      "VIN",
      "Model Code",
      "Model Name",
      "Dealer Code",
      "Origin Code",
      "Destination Code",
      "Origin Terminal",
      "Destination Terminal",
      "Invoice No",
      "Invoice Amount",
      "Invoice Date",
      "Shipment No",
    ];

    const csvContent =
      headers.join(",") +
      "\n" +
      "SAMPLE123,MC001,Model X,DLR001,ORG001,DEST001,Terminal A,Terminal B,INV001,25000.00,2024-01-15,SHIP001";

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "asn_template.csv";
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          ASN Management
        </h1>
        <p className="text-gray-600">
          Create Advanced Shipping Notices manually or via CSV upload
        </p>
      </div>

      {message.text && (
        <div
          className={`mb-6 p-4 rounded-lg flex items-center justify-between ${
            message.type === "success"
              ? "bg-green-50 text-green-700 border border-green-200"
              : "bg-red-50 text-red-700 border border-red-200"
          }`}
        >
          <div className="flex items-center">
            {message.type === "success" ? (
              <Check className="w-5 h-5 mr-2" />
            ) : (
              <X className="w-5 h-5 mr-2" />
            )}
            {message.text}
          </div>
          <button
            onClick={() => setMessage({ type: "", text: "" })}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab("manual")}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === "manual"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Manual Entry
            </button>
            <button
              onClick={() => setActiveTab("csv")}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === "csv"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              CSV Upload
            </button>
          </nav>
        </div>
      </div>

      {activeTab === "manual" ? (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                VIN
              </label>
              <input
                type="text"
                name="vin"
                value={formData.vin}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Vehicle Identification Number"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Model Code
              </label>
              <input
                type="text"
                name="modelCode"
                value={formData.modelCode}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Model Code"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Model Name
              </label>
              <input
                type="text"
                name="modelName"
                value={formData.modelName}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Model Name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Dealer Code
              </label>
              <input
                type="text"
                name="dealerCode"
                value={formData.dealerCode}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Dealer Code"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Origin Code
              </label>
              <input
                type="text"
                name="originCode"
                value={formData.originCode}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Origin Code"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Destination Code
              </label>
              <input
                type="text"
                name="destinationCode"
                value={formData.destinationCode}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Destination Code"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Origin Terminal <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="originTerminal"
                value={formData.originTerminal}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.originTerminal ? "border-red-300" : "border-gray-300"
                }`}
                placeholder="Origin Terminal"
              />
              {errors.originTerminal && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.originTerminal}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Destination Terminal <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="destinationTerminal"
                value={formData.destinationTerminal}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.destinationTerminal
                    ? "border-red-300"
                    : "border-gray-300"
                }`}
                placeholder="Destination Terminal"
              />
              {errors.destinationTerminal && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.destinationTerminal}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Invoice Number
              </label>
              <input
                type="text"
                name="invoiceNo"
                value={formData.invoiceNo}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Invoice Number"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Invoice Amount
              </label>
              <input
                type="number"
                name="invoiceAmount"
                value={formData.invoiceAmount}
                onChange={handleInputChange}
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Invoice Amount"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Invoice Date
              </label>
              <input
                type="date"
                name="invoiceDate"
                value={formData.invoiceDate}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Shipment Number
              </label>
              <input
                type="text"
                name="shipmentNo"
                value={formData.shipmentNo}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Shipment Number"
              />
            </div>

            <div className="md:col-span-2 flex justify-end pt-4">
              <button
                onClick={handleSubmit}
                disabled={loading}
                className={`px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                  loading ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                {loading ? "Creating..." : "Create ASN Record"}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                CSV Upload
              </h2>
              <button
                onClick={downloadTemplate}
                className="flex items-center px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              >
                <Download className="w-4 h-4 mr-2" />
                Download Template
              </button>
            </div>

            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <div className="flex flex-col items-center">
                <label htmlFor="csv-upload" className="cursor-pointer">
                  <span className="text-lg font-medium text-gray-900">
                    Upload CSV File
                  </span>
                  <p className="mt-2 text-sm text-gray-500">
                    Select a CSV file with ASN data to upload multiple records
                  </p>
                </label>
                <input
                  id="csv-upload"
                  type="file"
                  accept=".csv"
                  onChange={handleFileUpload}
                  className="hidden"
                  ref={fileInputRef}
                  disabled={loading}
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={loading}
                  className={`mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 ${
                    loading ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                >
                  Choose File
                </button>
              </div>
            </div>

            {csvFile && (
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center">
                  <FileText className="w-5 h-5 text-blue-600 mr-2" />
                  <span className="text-sm text-blue-800">
                    Selected: {csvFile.name} ({(csvFile.size / 1024).toFixed(1)}{" "}
                    KB)
                  </span>
                </div>
              </div>
            )}
          </div>

          {csvErrors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h3 className="text-sm font-medium text-red-800 mb-2">
                Validation Errors ({csvErrors.length})
              </h3>
              <div className="text-sm text-red-700 max-h-40 overflow-y-auto">
                {csvErrors.slice(0, 10).map((error, index) => (
                  <div key={index} className="mb-1">
                    • {typeof error === "string" ? error : error.message}
                  </div>
                ))}
                {csvErrors.length > 10 && (
                  <div className="text-red-600 font-medium mt-2">
                    ... and {csvErrors.length - 10} more errors
                  </div>
                )}
              </div>
            </div>
          )}

          {csvPreview && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">
                  Data Preview ({csvData.length} records)
                </h2>
                {csvData.length > 0 && csvErrors.length === 0 && (
                  <button
                    onClick={handleBulkSubmit}
                    disabled={loading}
                    className={`px-6 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 ${
                      loading ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                  >
                    {loading
                      ? "Submitting..."
                      : `Submit ${csvData.length} Records`}
                  </button>
                )}
              </div>

              <textarea
                value={csvPreview}
                readOnly
                className="w-full h-64 p-4 border border-gray-300 rounded-lg bg-gray-50 font-mono text-sm resize-none"
                placeholder="CSV preview will appear here..."
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ASNManagement;
