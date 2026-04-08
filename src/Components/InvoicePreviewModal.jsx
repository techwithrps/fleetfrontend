import React, { useState, useEffect } from "react";
import { generateInvoice } from "../utils/pdfGenerator";

const InvoicePreviewModal = ({
  isOpen,
  onClose,
  report,
  transporterDetails,
}) => {
  const [invoiceData, setInvoiceData] = useState({
    billingAddress: "",
    gstin: "",
    bl_no: "",
    line: "",
  });
  const [selectedContainers, setSelectedContainers] = useState(new Set());
  const [pdfUrl, setPdfUrl] = useState("");

  useEffect(() => {
    if (report && transporterDetails) {
      setInvoiceData({
        billingAddress: `${report.consigner || ""}\n${
          report.pickup_location || ""
        }`,
        gstin: report.gstin || "",
        bl_no: transporterDetails[0]?.bl_no || "",
        line: transporterDetails[0]?.line || "",
      });

      // Initialize all containers as selected by default
      const allContainerIds = new Set();
      transporterDetails.forEach((vehicle) => {
        if (vehicle.container_no) {
          allContainerIds.add(vehicle.id);
        }
      });
      setSelectedContainers(allContainerIds);
    }
  }, [report, transporterDetails]);

  useEffect(() => {
    if (isOpen && report && transporterDetails) {
      const filteredTransporterDetails = getFilteredTransporterDetails();
      const doc = generateInvoice(
        report,
        filteredTransporterDetails,
        invoiceData
      );
      setPdfUrl(doc.output("datauristring"));
    }
  }, [isOpen, report, transporterDetails, invoiceData, selectedContainers]);

  if (!isOpen) return null;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setInvoiceData((prev) => ({ ...prev, [name]: value }));
  };

  const handleContainerSelection = (containerId, isSelected) => {
    const newSelectedContainers = new Set(selectedContainers);
    if (isSelected) {
      newSelectedContainers.add(containerId);
    } else {
      newSelectedContainers.delete(containerId);
    }
    setSelectedContainers(newSelectedContainers);
  };

  const getFilteredTransporterDetails = () => {
    if (!transporterDetails) return [];
    return transporterDetails.filter((vehicle) =>
      selectedContainers.has(vehicle.id)
    );
  };

  const handleDownload = () => {
    const filteredTransporterDetails = getFilteredTransporterDetails();
    const doc = generateInvoice(
      report,
      filteredTransporterDetails,
      invoiceData
    );
    const timestamp = new Date().toISOString().split("T")[0];
    doc.save(`invoice-${report.id}-${timestamp}.pdf`);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-6xl max-h-[90vh] flex flex-col">
        <div className="p-6 border-b">
          <h3 className="text-xl font-bold">Invoice Preview & Edit</h3>
        </div>
        <div className="flex-grow flex overflow-hidden">
          {/* Form */}
          <div className="w-1/3 p-6 overflow-y-auto">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Billing Address
                </label>
                <textarea
                  name="billingAddress"
                  value={invoiceData.billingAddress}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border border-gray-300 rounded-lg p-2 focus:ring-blue-500 focus:border-blue-500"
                  rows="5"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  GSTIN
                </label>
                <input
                  type="text"
                  name="gstin"
                  value={invoiceData.gstin}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border border-gray-300 rounded-lg p-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  BL No
                </label>
                <input
                  type="text"
                  name="bl_no"
                  value={invoiceData.bl_no}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border border-gray-300 rounded-lg p-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Line
                </label>
                <input
                  type="text"
                  name="line"
                  value={invoiceData.line}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border border-gray-300 rounded-lg p-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Container Selection */}
              <div className="border-t pt-4">
                <h4 className="text-lg font-medium text-gray-900 mb-4">
                  Select Containers to Bill
                </h4>

                {transporterDetails && transporterDetails.length > 0 ? (
                  <div className="space-y-4">
                    {/* Group containers by vehicle */}
                    {(() => {
                      const vehicleGroups = {};
                      transporterDetails.forEach((vehicle) => {
                        const vehicleKey = vehicle.vehicle_number;
                        if (!vehicleGroups[vehicleKey]) {
                          vehicleGroups[vehicleKey] = {
                            transporter_name: vehicle.transporter_name,
                            total_charge: vehicle.total_charge,
                            containers: [],
                          };
                        }
                        if (vehicle.container_no) {
                          vehicleGroups[vehicleKey].containers.push(vehicle);
                        }
                      });

                      return Object.entries(vehicleGroups).map(
                        ([vehicleNumber, vehicleData]) => (
                          <div
                            key={vehicleNumber}
                            className="bg-gray-50 p-4 rounded-lg border"
                          >
                            <div className="flex items-center justify-between mb-3">
                              <h5 className="font-medium text-gray-900">
                                Vehicle: {vehicleNumber} -{" "}
                                {vehicleData.transporter_name}
                              </h5>
                              <span className="text-sm text-gray-600">
                                Charge: ₹{vehicleData.total_charge || 0}
                              </span>
                            </div>

                            {vehicleData.containers.length > 0 ? (
                              <div className="space-y-3">
                                {vehicleData.containers.map((container) => (
                                  <div
                                    key={container.id}
                                    className="flex items-center justify-between p-3 bg-white rounded-lg border"
                                  >
                                    <div className="flex items-center space-x-3">
                                      <input
                                        type="checkbox"
                                        id={`container-${container.id}`}
                                        className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
                                        checked={selectedContainers.has(
                                          container.id
                                        )}
                                        onChange={(e) =>
                                          handleContainerSelection(
                                            container.id,
                                            e.target.checked
                                          )
                                        }
                                      />
                                      <label
                                        htmlFor={`container-${container.id}`}
                                        className="text-sm font-medium text-gray-900 cursor-pointer"
                                      >
                                        Container {container.container_no}
                                      </label>
                                    </div>
                                    <div className="text-sm text-gray-600">
                                      Line: {container.line || "N/A"} | Seal:{" "}
                                      {container.seal_no || "N/A"}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-sm text-gray-500 italic">
                                No containers assigned to this vehicle
                              </p>
                            )}
                          </div>
                        )
                      );
                    })()}

                    <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                      <p className="text-sm text-blue-800">
                        <strong>
                          {selectedContainers.size} container(s) selected
                        </strong>{" "}
                        - Invoice will include only selected containers
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-sm text-gray-500">
                      No container details available for this request.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
          {/* PDF Preview */}
          <div className="w-2/3 bg-gray-100">
            <iframe
              src={pdfUrl}
              className="w-full h-full"
              title="Invoice Preview"
            />
          </div>
        </div>
        <div className="border-t bg-gray-50 px-6 py-4 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleDownload}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Download Invoice
          </button>
        </div>
      </div>
    </div>
  );
};

export default InvoicePreviewModal;
