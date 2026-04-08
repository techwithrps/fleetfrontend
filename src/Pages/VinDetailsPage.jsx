import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { transporterAPI } from "../utils/Api";
import { useNavigate, useLocation } from "react-router-dom";
import { ToastContainer } from "react-toastify";

const VinDetailsPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [containers, setContainers] = useState([]);
  const [transportRequestId, setTransportRequestId] = useState("");
  const [vehicleDataList, setVehicleDataList] = useState([]);
  const [existingTransporterData, setExistingTransporterData] = useState([]);
  const [vehicleType, setVehicleType] = useState("");
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  // Helper function to get VIN count from vehicle type
  const getVinCountFromVehicleType = (vType) => {
    if (!vType) return 0;

    if (vType.startsWith("Tr-")) {
      const match = vType.match(/Tr-(\d+)/);
      if (match && match[1]) {
        return parseInt(match[1], 10);
      }
    } else if (vType === "Ven") {
      return 4;
    }
    return 0;
  };

  // Create empty container object - simplified without vehicleNumber dropdown
  const createEmptyContainer = (index) => ({
    id: null,
    containerNo: "",
    vehicleNumber:
      vehicleDataList.length > 0 ? vehicleDataList[0].vehicleNumber : "",
    vehicleIndex: index,
  });

  // Function to initialize containers with empty values
  const initializeContainers = (count, vehicles = []) => {
    const newContainers = [];
    const defaultVehicleNumber =
      vehicles.length > 0 ? vehicles[0].vehicleNumber : "";

    for (let i = 0; i < count; i++) {
      const newContainer = {
        id: null,
        containerNo: "",
        vehicleNumber: defaultVehicleNumber,
        vehicleIndex: i + 1,
      };
      newContainers.push(newContainer);
    }

    console.log("Initializing containers:", newContainers);
    setContainers(newContainers);
  };

  // Function to fetch transporter data
  const fetchTransporterData = async (requestId) => {
    try {
      const response = await transporterAPI.getTransporterByRequestId(
        requestId
      );
      if (response.success && response.data) {
        setExistingTransporterData(response.data);

        // Extract vehicle numbers for internal use
        const vehicles = response.data.map((item) => ({
          vehicleNumber: item.vehicle_number,
          transporterName: item.transporter_name,
        }));
        setVehicleDataList(vehicles);
        return vehicles;
      }
      return [];
    } catch (error) {
      console.error("Error fetching transporter data:", error);
      toast.error("Failed to load transporter data");
      return [];
    }
  };

  // Function to load container data from API
  const loadContainerData = async (requestId, vType, vehicles = []) => {
    if (!requestId) {
      toast.error("Transport request ID is missing");
      return;
    }

    const vinCount = getVinCountFromVehicleType(vType);
    console.log("VIN Count calculated:", vinCount, "for vehicle type:", vType);

    if (vinCount === 0) {
      console.log("No VIN count available, skipping container initialization");
      return;
    }

    if (vehicles.length === 0) {
      console.log("No vehicles available, initializing empty containers");
      initializeContainers(vinCount, vehicles);
      return;
    }

    try {
      const allLoadedContainers = [];

      for (const vehicle of vehicles) {
        try {
          console.log(
            `Fetching containers for vehicle: ${vehicle.vehicleNumber}`
          );
          const vehicleContainersResponse =
            await transporterAPI.getContainersByVehicleNumber(
              requestId,
              vehicle.vehicleNumber
            );

          console.log(
            `API Response for vehicle ${vehicle.vehicleNumber}:`,
            vehicleContainersResponse
          );

          if (
            vehicleContainersResponse.success &&
            vehicleContainersResponse.data &&
            Array.isArray(vehicleContainersResponse.data) &&
            vehicleContainersResponse.data.length > 0
          ) {
            const vehicleContainers = vehicleContainersResponse.data.map(
              (container, index) => ({
                id: container.id || container.container_id,
                containerNo:
                  container.container_no || container.containerNo || "",
                vehicleNumber: vehicle.vehicleNumber,
                vehicleIndex: allLoadedContainers.length + index + 1,
              })
            );

            allLoadedContainers.push(...vehicleContainers);
            console.log(
              `Loaded containers for vehicle ${vehicle.vehicleNumber}`
            );
          } else {
            console.log(
              `No containers found for vehicle ${vehicle.vehicleNumber}`
            );
          }
        } catch (vehicleError) {
          console.error(
            `Error fetching containers for vehicle ${vehicle.vehicleNumber}:`,
            vehicleError
          );
        }
      }

      console.log("All loaded containers:", allLoadedContainers);

      const finalContainers = [...allLoadedContainers];

      // Auto-assign vehicle numbers and fill missing containers
      const defaultVehicleNumber =
        vehicles.length > 0 ? vehicles[0].vehicleNumber : "";
      while (finalContainers.length < vinCount) {
        const newContainer = {
          id: null,
          containerNo: "",
          vehicleNumber: defaultVehicleNumber,
          vehicleIndex: finalContainers.length + 1,
        };
        finalContainers.push(newContainer);
      }

      if (finalContainers.length > vinCount) {
        finalContainers.splice(vinCount);
      }

      finalContainers.forEach((container, index) => {
        container.vehicleIndex = index + 1;
      });

      console.log("Final containers after processing:", finalContainers);
      setContainers(finalContainers);

      if (allLoadedContainers.length > 0) {
        toast.success(`Loaded existing containers`);
        console.log("Container data loaded and state updated successfully");
      } else {
        toast.info("No existing VIN entries found. Created new entries.");
        console.log(
          "No existing containers found, initialized empty containers"
        );
      }
    } catch (error) {
      console.error("Error loading container data:", error);
      console.error("Error details:", error.response || error.message);
      toast.error("Failed to load existing container data");

      console.log("Falling back to empty container initialization");
      initializeContainers(vinCount, vehicles);
    }
  };

  // Function to initialize data - called when component mounts
  const initializeData = async () => {
    setIsLoading(true);
    try {
      const storedRequestId = sessionStorage.getItem("transportRequestId");
      const storedVehicleType = sessionStorage.getItem("vehicleType");

      console.log("Stored data:", { storedRequestId, storedVehicleType });

      if (!storedRequestId) {
        toast.error("No transport request ID found");
        navigate(-1);
        return;
      }

      setTransportRequestId(storedRequestId);
      setVehicleType(storedVehicleType || "");

      const vehicles = await fetchTransporterData(storedRequestId);
      await loadContainerData(storedRequestId, storedVehicleType, vehicles);

      setIsDataLoaded(true);
    } catch (error) {
      console.error("Error initializing data:", error);
      toast.error("Failed to initialize data");
      setIsDataLoaded(true);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!isDataLoaded) {
      initializeData();
    }
  }, [isDataLoaded]);

  useEffect(() => {
    console.log("Containers state updated:", containers);
  }, [containers]);

  useEffect(() => {
    console.log("Vehicle type updated:", vehicleType);
  }, [vehicleType]);

  const onBack = () => {
    navigate(-1);
  };

  const handleRefresh = async () => {
    console.log("Manual refresh triggered");
    setIsLoading(true);
    try {
      const vehicles = await fetchTransporterData(transportRequestId);
      await loadContainerData(transportRequestId, vehicleType, vehicles);
      toast.success("Data refreshed successfully");
    } catch (error) {
      console.error("Error during manual refresh:", error);
      toast.error("Failed to refresh data");
    } finally {
      setIsLoading(false);
    }
  };

  // Update container data with VIN validation
  const updateContainerData = (index, field, value) => {
    if (field === "containerNo") {
      value = value.toUpperCase();
      if (value.length > 17) {
        value = value.substring(0, 17);
      }
      // Allow only alphanumeric characters for VIN
      value = value.replace(/[^A-Z0-9]/g, "");
    }

    const updatedContainers = containers.map((container, i) =>
      i === index ? { ...container, [field]: value } : container
    );
    setContainers(updatedContainers);
  };

  // Get existing transporter data for a specific container/vehicle
  const getExistingTransporterData = (vehicleNumber) => {
    if (existingTransporterData.length === 0) {
      return null;
    }

    let matchingData = existingTransporterData.find(
      (data) => data.vehicle_number === vehicleNumber
    );

    if (!matchingData && existingTransporterData.length > 0) {
      matchingData = existingTransporterData[0];
    }

    return matchingData;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    setIsSubmitting(true);
    try {
      const containersByVehicle = {};
      containers.forEach((container) => {
        if (!containersByVehicle[container.vehicleNumber]) {
          containersByVehicle[container.vehicleNumber] = [];
        }
        containersByVehicle[container.vehicleNumber].push(container);
      });

      const updatePromises = [];

      for (const [vehicleNumber, vehicleContainers] of Object.entries(
        containersByVehicle
      )) {
        const existingData = getExistingTransporterData(vehicleNumber);

        if (!existingData) {
          throw new Error(
            `No transporter data found for vehicle ${vehicleNumber}. Please add transporter details first.`
          );
        }

        const existingContainers = vehicleContainers.filter(
          (container) => container.id
        );
        const newContainers = vehicleContainers.filter(
          (container) => !container.id
        );

        const formatContainer = (container) => ({
          container_no: container.containerNo,
          vehicle_number: container.vehicleNumber,
          seal_no: "",
          seal1: "",
          seal2: "",
          container_total_weight: 0,
          cargo_total_weight: 0,
          container_type: "",
          container_size: "",
          remarks: "",
        });

        for (const container of existingContainers) {
          updatePromises.push(
            transporterAPI
              .updateContainerDetails(container.id, formatContainer(container))
              .then((response) => ({
                success: response.success,
                message: `Updated VIN ${container.containerNo}`,
                data: response.data,
              }))
              .catch((error) => {
                console.error("Error updating container:", error);
                return {
                  success: false,
                  message: `Failed to update VIN ${container.containerNo}: ${
                    error.message || "Unknown error"
                  }`,
                  error,
                };
              })
          );
        }

        if (newContainers.length > 0) {
          const formattedNewContainers = newContainers.map(formatContainer);
          updatePromises.push(
            transporterAPI
              .addContainersToVehicle(
                transportRequestId,
                vehicleNumber,
                formattedNewContainers
              )
              .then((response) => ({
                success: response.success,
                message: `Added ${formattedNewContainers.length} new VINs`,
                data: response.data,
              }))
              .catch((error) => {
                console.error("Error adding containers:", error);
                return {
                  success: false,
                  message: `Failed to add VINs: ${
                    error.message || "Unknown error"
                  }`,
                  error,
                };
              })
          );
        }
      }

      const results = await Promise.all(updatePromises);

      const successResults = results.filter((r) => r.success);
      const failedResults = results.filter((r) => !r.success);

      if (failedResults.length > 0) {
        failedResults.forEach((result) => {
          toast.error(result.message);
        });
      }

      if (successResults.length > 0) {
        toast.success(
          `Successfully updated ${successResults.length} VIN entries`
        );

        console.log("Refreshing data after successful save...");
        try {
          const vehicles = await fetchTransporterData(transportRequestId);
          await loadContainerData(transportRequestId, vehicleType, vehicles);
          console.log("Data refreshed successfully");
        } catch (refreshError) {
          console.error("Error refreshing data:", refreshError);
          toast.warning(
            "Data saved but failed to refresh. Please reload the page."
          );
        }

        setTimeout(() => {
          navigate(-1);
        }, 3000);
      }
    } catch (error) {
      console.error("Submit error:", error);
      toast.error(error.message || "Failed to submit VIN details");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <ToastContainer position="top-right" autoClose={5000} />
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">VIN Details</h1>
        <div className="flex gap-2">
          <button
            onClick={handleRefresh}
            disabled={isLoading}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors disabled:opacity-50"
          >
            {isLoading ? "Refreshing..." : "Refresh"}
          </button>
          <button
            onClick={onBack}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
          >
            Back
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          {/* Simplified VIN entries container */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">
                VIN Entries for {vehicleType}
              </h2>
              {vehicleDataList.length > 0 && (
                <div className="text-sm text-gray-600">
                  Assigned to:{" "}
                  <span className="font-medium">
                    {vehicleDataList[0].vehicleNumber}
                  </span>
                </div>
              )}
            </div>
            <p className="text-sm text-gray-600 mb-6">
              Please enter exactly {getVinCountFromVehicleType(vehicleType)} VIN
              entries for this {vehicleType} request.
            </p>

            {containers.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">
                  No VIN entries available. Please check if vehicle type is
                  properly set.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {containers.map((container, index) => (
                  <div
                    key={index}
                    className="flex items-center p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center justify-center w-12 h-12 bg-blue-100 text-blue-600 rounded-full font-semibold mr-4">
                      {container.vehicleIndex}
                    </div>
                    <div className="flex-1">
                      <input
                        type="text"
                        value={container.containerNo}
                        onChange={(e) =>
                          updateContainerData(
                            index,
                            "containerNo",
                            e.target.value
                          )
                        }
                        placeholder="Enter VIN (e.g., 1HGCM82633A004352)"
                        className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                      />
                      <p className="text-xs text-gray-500 mt-1 ml-1">
                        Format: 17 alphanumeric characters
                      </p>
                    </div>
                    <div className="ml-4 text-sm text-gray-500">
                      {container.containerNo.length}/17
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Submit button */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting || containers.length === 0}
              className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {isSubmitting ? "Saving..." : "Save VIN Details"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default VinDetailsPage;
