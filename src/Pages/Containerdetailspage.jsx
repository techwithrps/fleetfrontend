import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { transporterAPI } from "../utils/Api";
import { useNavigate } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import ResponseModal from "../Components/Responsemodal";

const ContainerDetailsPage = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [containers, setContainers] = useState([]);
  const [transportRequestId, setTransportRequestId] = useState("");
  const [vehicleDataList, setVehicleDataList] = useState([]);
  const [existingTransporterData, setExistingTransporterData] = useState([]);
  const [groupedContainers, setGroupedContainers] = useState({});
  const [expandedVehicle, setExpandedVehicle] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalData, setModalData] = useState(null);

  // Create empty container with a unique client-side ID
  const createEmptyContainer = () => ({
    clientId: `temp-${Date.now()}-${Math.random()}`,
    id: null,
    containerNo: "",
    numberOfContainers: "",
    containerType: "",
    containerSize: "",
    line: "",
    seal1: "",
    seal2: "",
    containerTotalWeight: "",
    cargoTotalWeight: "",
    remarks: "",
    vehicleNumber: "",
    isDirty: true, // New containers are always dirty
  });

  // Initialize with data from sessionStorage
  useEffect(() => {
    const storedContainerData = sessionStorage.getItem("containerData");
    const storedRequestId = sessionStorage.getItem("transportRequestId");
    const storedVehicleData = sessionStorage.getItem("vehicleData");

    if (storedRequestId) {
      setTransportRequestId(storedRequestId);
    }

    if (storedVehicleData) {
      try {
        const parsedVehicleData = JSON.parse(storedVehicleData);
        setVehicleDataList(parsedVehicleData);
      } catch (error) {
        console.error("Error parsing vehicle data:", error);
        toast.error("Failed to load vehicle data");
      }
    }

    if (storedContainerData) {
      try {
        const parsedData = JSON.parse(storedContainerData);
        const containerData = parsedData.map((container) => ({
          ...container,
          id: container.id || null,
          clientId: container.clientId || `temp-${Date.now()}-${Math.random()}`,
          isDirty: false, // Initialize as clean
        }));

        setContainers(
          containerData.length > 0 ? containerData : [createEmptyContainer()]
        );
      } catch (error) {
        console.error("Error parsing container data:", error);
        setContainers([createEmptyContainer()]);
      }
    } else {
      setContainers([createEmptyContainer()]);
    }
  }, []);

  // Group containers by vehicle number
  useEffect(() => {
    const grouped = {};
    containers.forEach((container) => {
      const vehicleNumber = container.vehicleNumber || "unassigned";
      if (!grouped[vehicleNumber]) {
        grouped[vehicleNumber] = [];
      }
      grouped[vehicleNumber].push(container);
    });

    setGroupedContainers(grouped);
    if (expandedVehicle === null && Object.keys(grouped).length > 0) {
      setExpandedVehicle(Object.keys(grouped)[0]);
    }
  }, [containers, expandedVehicle]);

  // Fetch existing transporter data
  const fetchExistingTransporterData = async () => {
    if (!transportRequestId) return;

    try {
      const response = await transporterAPI.getTransporterByRequestId(
        transportRequestId
      );
      if (response.success) {
        const transporterData = Array.isArray(response.data)
          ? response.data
          : [response.data];
        setExistingTransporterData(transporterData);

        // Update vehicleDataList if not already set
        if (vehicleDataList.length === 0) {
          const uniqueVehicles = transporterData.map((item) => ({
            vehicleNumber: item.vehicle_number,
            transporterName: item.transporter_name || "",
            vehicleSequence: item.vehicle_sequence || 0,
          }));
          setVehicleDataList(uniqueVehicles);
          sessionStorage.setItem("vehicleData", JSON.stringify(uniqueVehicles));
        }
      }
    } catch (error) {
      console.error("Error fetching existing transporter data:", error);
      toast.error("Failed to load transporter data");
    }
  };

  // Force reload all data after container updates
  const reloadDataAfterUpdate = async () => {
    if (!transportRequestId) return;
    
    setIsLoading(true);
    try {
      // Clear existing data first
      setContainers([]);
      setExistingTransporterData([]);
      
      // Reload transporter data
      await fetchExistingTransporterData();
      
      // Reload containers for all vehicles
      if (vehicleDataList.length > 0) {
        const loadPromises = vehicleDataList.map((vehicle) =>
          loadVehicleContainers(vehicle.vehicleNumber)
        );
        await Promise.all(loadPromises);
        
        toast.success("Container data refreshed successfully");
      }
    } catch (error) {
      console.error("Error reloading data after update:", error);
      toast.error("Failed to refresh container data");
    } finally {
      setIsLoading(false);
    }
  };

  // Load transporter data on mount
  useEffect(() => {
    if (transportRequestId) {
      fetchExistingTransporterData();
    }
  }, [transportRequestId]);

  // Load containers for all vehicles
  const loadVehicleContainers = async (vehicleNumber) => {
    if (!transportRequestId || !vehicleNumber) return;

    try {
      const response = await transporterAPI.getContainersByVehicleNumber(
        transportRequestId,
        vehicleNumber
      );

      if (response.success && response.data && response.data.length > 0) {
        const vehicleContainers = response.data.map((container) => ({
          id: container.id,
          clientId: `temp-${container.id}`,
          containerNo: container.container_no || "",
          numberOfContainers: container.number_of_containers?.toString() || "",
          containerType: container.container_type || "",
          containerSize: container.container_size || "",
          line: container.line || "",
          seal1: container.seal1 || container.seal_no || "",
          seal2: container.seal2 || "",
          containerTotalWeight:
            container.container_total_weight?.toString() || "",
          cargoTotalWeight: container.cargo_total_weight?.toString() || "",
          remarks: container.remarks || "",
          vehicleNumber: container.vehicle_number || "",
          isDirty: false, // Initialize as clean
        }));

        setContainers((prev) => {
          const filteredPrev = prev.filter(
            (c) => c.vehicleNumber !== vehicleNumber
          );
          const newContainerList = [...filteredPrev, ...vehicleContainers];
          sessionStorage.setItem(
            "containerData",
            JSON.stringify(newContainerList)
          );
          return newContainerList;
        });
      }
    } catch (error) {
      console.error(
        `Error loading containers for vehicle ${vehicleNumber}:`,
        error
      );
      toast.error(`Failed to load containers for vehicle ${vehicleNumber}`);
    }
  };

  useEffect(() => {
    const loadAllVehicleContainers = async () => {
      if (!transportRequestId || vehicleDataList.length === 0) return;

      setIsLoading(true);
      try {
        const loadPromises = vehicleDataList.map((vehicle) =>
          loadVehicleContainers(vehicle.vehicleNumber)
        );
        await Promise.all(loadPromises);
        toast.success("All vehicle containers loaded successfully");
      } catch (error) {
        console.error("Error loading vehicle containers:", error);
        toast.error("Failed to load some vehicle containers");
      } finally {
        setIsLoading(false);
      }
    };

    loadAllVehicleContainers();
  }, [vehicleDataList, transportRequestId]);

  // Navigation and session storage update
  const onBack = () => {
    sessionStorage.setItem("containerData", JSON.stringify(containers));
    navigate(-1);
  };

  // Add container
  const addContainer = (vehicleNumber = "") => {
    const newContainer = createEmptyContainer();
    newContainer.vehicleNumber = vehicleNumber;
    const updatedContainers = [...containers, newContainer];
    setContainers(updatedContainers);
  };

  // Remove container using its unique ID (clientId or id)
  const removeContainer = async (identifier) => {
    if (containers.length <= 1) {
      toast.warning("At least one container entry is required");
      return;
    }

    const containerToRemove = containers.find(
      (c) => (c.id || c.clientId) === identifier
    );

    if (containerToRemove && containerToRemove.id) {
      try {
        setIsLoading(true);
        const response = await transporterAPI.deleteContainer(
          containerToRemove.id
        );
        if (!response.success) {
          throw new Error(response.message || "Failed to delete container");
        }
      } catch (error) {
        console.error("Error deleting container:", error);
        toast.error(error.message || "Failed to delete container");
        setIsLoading(false);
        return;
      }
    }

    const updatedContainers = containers.filter(
      (c) => (c.id || c.clientId) !== identifier
    );
    setContainers(updatedContainers);
    toast.success("Container deleted successfully");
    
    // Reload data to reflect backend changes
    await reloadDataAfterUpdate();
    setIsLoading(false);
  };

  // Update container data using its unique ID (clientId or id)
  const updateContainerData = (identifier, field, value) => {
    if (field === "containerNo") {
      value = value.toUpperCase();
      if (value.length > 11) {
        value = value.substring(0, 11);
      }
      if (value.length <= 4) {
        value = value.replace(/[^A-Z]/g, "");
      } else {
        const letters = value.substring(0, 4).replace(/[^A-Z]/g, "");
        const digits = value.substring(4).replace(/[^0-9]/g, "");
        value = letters + digits;
      }
    }

    setContainers(
      containers.map((container) => {
        const currentIdentifier = container.id || container.clientId;
        if (currentIdentifier === identifier) {
          return { ...container, [field]: value, isDirty: true };
        }
        return container;
      })
    );
  };

  // Toggle vehicle expansion
  const toggleVehicleExpansion = (vehicleNumber) => {
    setExpandedVehicle(
      expandedVehicle === vehicleNumber ? null : vehicleNumber
    );
  };

  // Validate container data with ISO 6346 check digit
  const calculateCheckDigit = (containerNo) => {
    const chars = containerNo.slice(0, 10).split("");
    const letters = "0123456789A?BCDEFGHIJK?LMNOPQRSTU?VWXYZ";
    let sum = 0;
    chars.forEach((char, i) => {
      let value = /[A-Z]/.test(char)
        ? letters.indexOf(char)
        : parseInt(char, 10);
      sum += value * Math.pow(2, i);
    });
    return (sum % 11) % 10;
  };

  const validateContainers = () => {
    const errors = [];
    containers.forEach((container, index) => {
      if (!container.containerNo.trim()) {
        errors.push(`Container ${index + 1}: Container number is required`);
      } else {
        const containerNoRegex = /^[A-Z]{4}[0-9]{7}$/;
        if (!containerNoRegex.test(container.containerNo)) {
          errors.push(
            `Container ${
              index + 1
            }: Container number must be 4 letters followed by 7 digits (e.g., ABCD1234567)`
          );
        } else {
          const expectedCheckDigit = calculateCheckDigit(container.containerNo);
          const actualCheckDigit = parseInt(
            container.containerNo.slice(-1),
            10
          );
          if (expectedCheckDigit !== actualCheckDigit) {
            errors.push(
              `Container ${
                index + 1
              }: Invalid check digit. Expected ${expectedCheckDigit}, got ${actualCheckDigit}`
            );
          }
        }
      }
      if (!container.vehicleNumber) {
        errors.push(`Container ${index + 1}: Vehicle number is required`);
      }
    });
    return errors;
  };

  // Check container history
  const checkContainerHistory = async (containerNo, requestId) => {
    try {
      const response = await transporterAPI.checkContainerHistory(
        containerNo,
        requestId
      );
      return response.data;
    } catch (error) {
      console.error("Error checking container history:", error);
      return { history: [], lastUsed: null, totalUses: 0 };
    }
  };

  // Submit handler
  const handleSubmit = async (e) => {
    e.preventDefault();

    const errors = validateContainers();
    if (errors.length > 0) {
      toast.error(
        <div className="flex flex-col">
          <span className="font-bold text-lg mb-1">Validation Failed</span>
          <ul className="list-disc pl-4">
            {errors.map((error, index) => (
              <li key={index} className="text-sm">
                {error}
              </li>
            ))}
          </ul>
        </div>,
        { position: "top-center", autoClose: 5000 }
      );
      return;
    }

    setIsSubmitting(true);
    const loadingId = toast.loading("Assigning containers to vehicles...", {
      position: "top-center",
    });

    try {
      // Check container history
      const containerHistoryPromises = containers
        .filter((c) => c.containerNo.trim())
        .map(async (container) => {
          const history = await checkContainerHistory(
            container.containerNo,
            transportRequestId
          );
          return { containerNo: container.containerNo, history };
        });
      const containerHistories = await Promise.all(containerHistoryPromises);
      const historyWarnings = containerHistories.filter(
        (h) => h.history.totalUses > 0
      );

      if (historyWarnings.length > 0) {
        toast.warning(
          <div className="flex flex-col">
            <span className="font-bold text-lg mb-1">
              Container History Warnings
            </span>
            <ul className="list-disc pl-4">
              {historyWarnings.map((warning, index) => (
                <li key={index} className="text-sm">
                  Container {warning.containerNo} was used in Request #
                  {warning.history.lastUsed?.request_id || "unknown"} (
                  {warning.history.totalUses} previous use(s))
                </li>
              ))}
            </ul>
          </div>,
          { position: "top-center", autoClose: 8000 }
        );
      }

      // Prepare payload for batch container assignment
      const vehicleContainers = vehicleDataList
        .map((vehicle) => {
          const containersForVehicle = containers.filter(
            (c) =>
              c.vehicleNumber === vehicle.vehicleNumber && (c.isDirty || !c.id)
          );

          if (containersForVehicle.length === 0) {
            return null;
          }

          return {
            vehicle_number: vehicle.vehicleNumber,
            vehicle_sequence: vehicle.vehicleSequence || 0,
            containers: containersForVehicle.map((container) => ({
              id: container.id,
              clientId: container.clientId,
              container_no: container.containerNo.trim(),
              line: container.line?.trim() || null,
              seal_no: container.seal1?.trim() || null,
              number_of_containers: parseInt(container.numberOfContainers) || 1,
              seal1: container.seal1?.trim() || null,
              seal2: container.seal2?.trim() || null,
              container_total_weight:
                parseFloat(container.containerTotalWeight) || null,
              cargo_total_weight:
                parseFloat(container.cargoTotalWeight) || null,
              container_type: container.containerType?.trim() || null,
              container_size: container.containerSize?.trim() || null,
              remarks: container.remarks?.trim() || null,
            })),
          };
        })
        .filter(Boolean);

      if (vehicleContainers.length === 0) {
        toast.dismiss(loadingId);
        toast.info("No changes to submit.");
        setIsSubmitting(false);
        return;
      }

      const response = await transporterAPI.updateMultipleVehicleContainers(
        transportRequestId,
        vehicleContainers
      );

      if (response.success) {
        // Create a map of the containers that were successfully saved to the server
        const savedContainersMap = new Map();
        response.data.forEach((vc) => {
          vc.containers.forEach((container) => {
            // The backend should return the clientId for new containers
            const key = container.id || container.clientId;
            savedContainersMap.set(key, {
              id: container.id,
              clientId: container.clientId || `temp-${container.id}`,
              containerNo: container.container_no || "",
              numberOfContainers:
                container.number_of_containers?.toString() || "",
              containerType: container.container_type || "",
              containerSize: container.container_size || "",
              line: container.line || "",
              seal1: container.seal1 || "",
              seal2: container.seal2 || "",
              containerTotalWeight:
                container.container_total_weight?.toString() || "",
              cargoTotalWeight: container.cargo_total_weight?.toString() || "",
              remarks: container.remarks || "",
              vehicleNumber: vc.vehicle_number || "",
              isDirty: false, // Mark as clean
            });
          });
        });

        // Merge the updated data back into the main containers state
        setContainers((prevContainers) => {
          const newContainers = prevContainers.map((pc) => {
            const identifier = pc.id || pc.clientId;
            if (savedContainersMap.has(identifier)) {
              return { ...pc, ...savedContainersMap.get(identifier) };
            }
            return pc;
          });

          sessionStorage.setItem(
            "containerData",
            JSON.stringify(newContainers)
          );
          return newContainers;
        });

        toast.dismiss(loadingId);
        if (response.data.some((vc) => vc.hasWarnings)) {
          response.data.forEach((vc) => {
            if (vc.hasWarnings) {
              vc.containers.forEach((container) => {
                if (container.message) {
                  toast.warning(container.message, { position: "top-center" });
                }
              });
            }
          });
        }

        toast.success(
          <div className="flex flex-col">
            <span className="font-bold text-lg mb-1">Success</span>
            <p className="text-sm">
              Successfully updated{" "}
              {response.data.reduce((sum, vc) => sum + vc.containers.length, 0)}{" "}
              container(s)
            </p>
          </div>,
          { position: "top-center", autoClose: 5000 }
        );

        setShowModal(true);
        setModalData({
          containers: response.data.flatMap((vc) =>
            vc.containers.map((c) => ({
              ...c,
              vehicle_number: vc.vehicle_number,
            }))
          ),
        });

        // Reload all data to reflect backend changes
        await reloadDataAfterUpdate();
      } else {
        throw new Error(response.message || "Failed to update containers");
      }
    } catch (error) {
      toast.dismiss(loadingId);
      console.error("Error updating containers:", error);
      toast.error(error.message || "Error updating containers", {
        position: "top-center",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading container details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <ToastContainer
        position="top-center"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={true}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
        style={{
          width: "400px",
        }}
        toastStyle={{
          borderRadius: "8px",
          padding: "16px",
          marginBottom: "16px",
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
          fontSize: "14px",
        }}
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Container Details Management
                </h1>
                <p className="text-sm text-gray-600 mt-1">
                  Request ID:{" "}
                  <span className="font-medium">{transportRequestId}</span>
                </p>
                {existingTransporterData.length > 0 && (
                  <p className="text-sm text-green-600 mt-1">
                    ✓ {existingTransporterData.length} transporter record(s)
                    found
                  </p>
                )}
              </div>
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={reloadDataAfterUpdate}
                  disabled={isLoading}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  <svg
                    className="w-4 h-4 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                  Refresh Data
                </button>
                <button
                  onClick={onBack}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <svg
                    className="w-4 h-4 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 19l-7-7m0 0l7-7m-7 7h18"
                    />
                  </svg>
                  Back
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Warning if no transporter data */}
        {existingTransporterData.length === 0 && (
          <div className="bg-yellow-50 border border-yellow-200 border rounded-lg p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-yellow-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">
                  No transporter data found
                </h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <p>
                    Please add transporter details first before updating
                    container information. The container update requires
                    existing transporter data to preserve vehicle and driver
                    information.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Main Content - Card-based UI */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                Container Information ({containers.length} Container
                {containers.length > 1 ? "s" : ""})
              </h2>
            </div>
          </div>

          <div className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Vehicle Groups */}
              <div className="space-y-6">
                {Object.entries(groupedContainers).map(
                  ([vehicleNumber, vehicleContainers]) => (
                    <div
                      key={vehicleNumber}
                      className="border border-gray-200 rounded-lg overflow-hidden"
                    >
                      {/* Vehicle Header */}
                      <div
                        className={`px-4 py-3 flex justify-between items-center cursor-pointer ${
                          expandedVehicle === vehicleNumber
                            ? "bg-blue-50"
                            : "bg-gray-50"
                        }`}
                        onClick={() => toggleVehicleExpansion(vehicleNumber)}
                      >
                        <div className="flex items-center">
                          <span className="font-medium text-gray-900">
                            {vehicleNumber === "unassigned"
                              ? "Unassigned Containers"
                              : `Vehicle: ${vehicleNumber}`}
                          </span>
                          <span className="ml-2 bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                            {vehicleContainers.length} container
                            {vehicleContainers.length !== 1 ? "s" : ""}
                          </span>
                        </div>
                        <div className="flex items-center">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              addContainer(vehicleNumber);
                            }}
                            className="mr-2 inline-flex items-center p-1 border border-transparent rounded-full shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            title="Add container to this vehicle"
                          >
                            <svg
                              className="h-4 w-4"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                              />
                            </svg>
                          </button>
                          <svg
                            className={`h-5 w-5 text-gray-500 transform transition-transform ${
                              expandedVehicle === vehicleNumber
                                ? "rotate-180"
                                : ""
                            }`}
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 9l-7 7-7-7"
                            />
                          </svg>
                        </div>
                      </div>

                      {/* Container Cards */}
                      {expandedVehicle === vehicleNumber && (
                        <div className="p-4 bg-white">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {vehicleContainers.map(
                              (container, containerIndex) => {
                                const identifier =
                                  container.id || container.clientId;
                                return (
                                  <div
                                    key={identifier}
                                    className="border border-gray-200 rounded-lg p-4 bg-gray-50"
                                    data-vehicle={vehicleNumber}
                                    data-container={JSON.stringify(container)}
                                  >
                                    <div className="flex justify-between items-center mb-4">
                                      <h3 className="text-md font-medium text-gray-900">
                                        Container #{containerIndex + 1}
                                      </h3>
                                      {containers.length > 1 && (
                                        <button
                                          type="button"
                                          onClick={() =>
                                            removeContainer(identifier)
                                          }
                                          className="inline-flex items-center p-1 border border-transparent rounded-full shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                                          title="Remove Container"
                                        >
                                          <svg
                                            className="h-4 w-4"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                          >
                                            <path
                                              strokeLinecap="round"
                                              strokeLinejoin="round"
                                              strokeWidth={2}
                                              d="M6 18L18 6M6 6l12 12"
                                            />
                                          </svg>
                                        </button>
                                      )}
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                      <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-0">
                                          Container Number *
                                        </label>
                                        <input
                                          type="text"
                                          required
                                          className="w-full h-10 text-sm border border-gray-300 rounded-md px-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                          value={container.containerNo}
                                          onChange={(e) =>
                                            updateContainerData(
                                              identifier,
                                              "containerNo",
                                              e.target.value
                                            )
                                          }
                                          placeholder="Container Number"
                                        />
                                      </div>
                                      <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                          Container Type
                                        </label>
                                        <select
                                          className="w-full h-10 text-sm border border-gray-300 rounded-md px-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                          value={container.containerType}
                                          onChange={(e) =>
                                            updateContainerData(
                                              identifier,
                                              "containerType",
                                              e.target.value
                                            )
                                          }
                                        >
                                          <option value="">
                                            Select Container Type
                                          </option>
                                          <option value="HQ">HQ</option>
                                          <option value="DV">DV</option>
                                          <option value="REFER">REFER</option>
                                        </select>
                                      </div>
                                      <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                          Container Size
                                        </label>
                                        <input
                                          type="text"
                                          className="w-full h-10 text-sm border border-gray-300 rounded-md px-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                          value={container.containerSize}
                                          onChange={(e) =>
                                            updateContainerData(
                                              identifier,
                                              "containerSize",
                                              e.target.value
                                            )
                                          }
                                          placeholder="Container Size"
                                        />
                                      </div>
                                      <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                          Shipping Line
                                        </label>
                                        <input
                                          type="text"
                                          className="w-full h-10 text-sm border border-gray-300 rounded-md px-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                          value={container.line}
                                          onChange={(e) =>
                                            updateContainerData(
                                              identifier,
                                              "line",
                                              e.target.value
                                            )
                                          }
                                          placeholder="Shipping Line"
                                        />
                                      </div>
                                      <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                          Seal 1
                                        </label>
                                        <input
                                          type="text"
                                          className="w-full h-10 text-sm border border-gray-300 rounded-md px-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                          value={container.seal1}
                                          onChange={(e) =>
                                            updateContainerData(
                                              identifier,
                                              "seal1",
                                              e.target.value
                                            )
                                          }
                                          placeholder="Seal 1"
                                        />
                                      </div>
                                      <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                          Seal 2
                                        </label>
                                        <input
                                          type="text"
                                          className="w-full h-10 text-sm border border-gray-300 rounded-md px-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                          value={container.seal2}
                                          onChange={(e) =>
                                            updateContainerData(
                                              identifier,
                                              "seal2",
                                              e.target.value
                                            )
                                          }
                                          placeholder="Seal 2"
                                        />
                                      </div>
                                      <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                          Tare Weight (kg)
                                        </label>
                                        <input
                                          type="number"
                                          min="0"
                                          step="0.01"
                                          className="w-full h-10 text-sm border border-gray-300 rounded-md px-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                          value={container.containerTotalWeight}
                                          onChange={(e) =>
                                            updateContainerData(
                                              identifier,
                                              "containerTotalWeight",
                                              e.target.value
                                            )
                                          }
                                          placeholder="Container Weight"
                                        />
                                      </div>
                                      <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                          Cargo Weight (kg)
                                        </label>
                                        <input
                                          type="number"
                                          min="0"
                                          step="0.01"
                                          className="w-full h-10 text-sm border border-gray-300 rounded-md px-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                          value={container.cargoTotalWeight}
                                          onChange={(e) =>
                                            updateContainerData(
                                              identifier,
                                              "cargoTotalWeight",
                                              e.target.value
                                            )
                                          }
                                          placeholder="Cargo Weight"
                                        />
                                      </div>
                                      <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                          Gross Weight (kg)
                                        </label>
                                        <input
                                          type="number"
                                          min="0"
                                          step="0.01"
                                          className="w-full h-10 text-sm border border-gray-300 rounded-md px-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                          value={
                                            (parseFloat(
                                              container.cargoTotalWeight
                                            ) || 0) +
                                            (parseFloat(
                                              container.containerTotalWeight
                                            ) || 0)
                                          }
                                          disabled
                                          placeholder="Gross Weight"
                                        />
                                      </div>
                                    </div>
                                  </div>
                                );
                              }
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )
                )}
              </div>

              {/* Submit Buttons */}
              <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={onBack}
                  className="px-6 py-3 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={
                    isSubmitting || existingTransporterData.length === 0
                  }
                  className={`
                    px-8 py-3 rounded-md text-white font-medium transition-all duration-200
                    ${
                      isSubmitting || existingTransporterData.length === 0
                        ? "bg-gray-400 cursor-not-allowed"
                        : "bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    }
                    flex items-center
                  `}
                  title={
                    existingTransporterData.length === 0
                      ? "Add transporter details first"
                      : "Update container details"
                  }
                >
                  {isSubmitting ? (
                    <>
                      <svg
                        className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Updating Containers...
                    </>
                  ) : (
                    <>
                      <svg
                        className="w-5 h-5 mr-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      Update Container Details
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
        <ResponseModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          data={modalData}
        />
      </div>
    </div>
  );
};

export default ContainerDetailsPage;
