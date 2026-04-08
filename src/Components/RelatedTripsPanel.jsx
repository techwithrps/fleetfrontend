import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { ChevronDown, ChevronUp, Plus, ExternalLink } from "lucide-react";
import api from "../utils/Api";
import SubTripModal from "./SubTripModal";

const RelatedTripsPanel = ({ requestId, onRefresh }) => {
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [parentTrip, setParentTrip] = useState(null);
  const [subTrips, setSubTrips] = useState([]);
  const [showSubTripModal, setShowSubTripModal] = useState(false);

  const fetchRelatedTrips = async () => {
    if (!requestId) return;
    
    setLoading(true);
    try {
      const response = await api.get(`/api/trips/${requestId}/related`);
      if (response.data.success) {
        if (response.data.parentTrip) {
          setParentTrip(response.data.parentTrip);
          setSubTrips(response.data.subTrips || []);
        } else {
          // This is already a parent trip
          setParentTrip(response.data.currentTrip);
          setSubTrips(response.data.subTrips || []);
        }
      }
    } catch (error) {
      console.error("Error fetching related trips:", error);
      toast.error("Failed to load related trips");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (expanded) {
      fetchRelatedTrips();
    }
  }, [expanded, requestId]);

  const handleSubTripCreated = () => {
    fetchRelatedTrips();
    if (onRefresh) onRefresh();
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Not specified";
    return new Date(dateString).toLocaleDateString("en-IN");
  };

  const getStatusBadgeClass = (status) => {
    switch (status?.toLowerCase()) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "in progress":
        return "bg-blue-100 text-blue-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const canCreateSubTrip = parentTrip && !parentTrip.parent_request_id;

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden mb-6">
      <div
        className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex justify-between items-center cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <h3 className="text-md font-medium text-gray-900 flex items-center">
          {expanded ? <ChevronUp className="h-4 w-4 mr-2" /> : <ChevronDown className="h-4 w-4 mr-2" />}
          Related Trips (Parent & Sub-trips)
        </h3>
        {canCreateSubTrip && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowSubTripModal(true);
            }}
            className="px-2 py-1 bg-blue-600 text-white text-xs rounded-md flex items-center"
          >
            <Plus className="h-3 w-3 mr-1" /> Add Sub-Trip
          </button>
        )}
      </div>

      {expanded && (
        <div className="p-4">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : parentTrip ? (
            <div>
              {/* Parent Trip */}
              <div className="mb-4">
                <h4 className="text-sm font-semibold text-gray-700 mb-2">
                  {parentTrip.parent_request_id ? "Parent Trip" : "Current Trip (Parent)"}
                </h4>
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="text-md font-medium text-gray-900">
                        {parentTrip.formatted_request_id || `Request #${parentTrip.id}`}
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        SHIPA NO: {parentTrip.SHIPA_NO}
                      </div>
                    </div>
                    <div>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeClass(
                          parentTrip.status
                        )}`}
                      >
                        {parentTrip.status}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mt-3">
                    <div>
                      <div className="text-xs text-gray-500">From</div>
                      <div className="text-sm">{parentTrip.pickup_location}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">To</div>
                      <div className="text-sm">{parentTrip.delivery_location}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">Expected Pickup</div>
                      <div className="text-sm">{formatDate(parentTrip.expected_pickup_date)}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">Expected Delivery</div>
                      <div className="text-sm">{formatDate(parentTrip.expected_delivery_date)}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">Vehicle</div>
                      <div className="text-sm">
                        {parentTrip.vehicle_type} {parentTrip.vehicle_size && `(${parentTrip.vehicle_size})`}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">Amount</div>
                      <div className="text-sm font-medium">
                        {formatCurrency(parentTrip.requested_price || 0)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sub Trips */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <h4 className="text-sm font-semibold text-gray-700">
                    Sub-Trips ({subTrips.length})
                  </h4>
                </div>

                {subTrips.length > 0 ? (
                  <div className="space-y-3">
                    {subTrips.map((trip) => (
                      <div key={trip.id} className="bg-gray-50 rounded-lg p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="text-md font-medium text-gray-900">
                              {trip.formatted_request_id || `Request #${trip.id}`}
                            </div>
                            <div className="text-sm text-gray-600 mt-1">
                              SHIPA NO: {trip.SHIPA_NO}
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeClass(
                                trip.status
                              )}`}
                            >
                              {trip.status}
                            </span>
                            <a
                              href={`/admin/transport-requests?id=${trip.id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mt-3">
                          <div>
                            <div className="text-xs text-gray-500">From</div>
                            <div className="text-sm">{trip.pickup_location}</div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-500">To</div>
                            <div className="text-sm">{trip.delivery_location}</div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-500">Expected Pickup</div>
                            <div className="text-sm">{formatDate(trip.expected_pickup_date)}</div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-500">Expected Delivery</div>
                            <div className="text-sm">{formatDate(trip.expected_delivery_date)}</div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-500">Vehicle</div>
                            <div className="text-sm">
                              {trip.vehicle_type} {trip.vehicle_size && `(${trip.vehicle_size})`}
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-500">Amount</div>
                            <div className="text-sm font-medium">
                              {formatCurrency(trip.requested_price || 0)}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 bg-gray-50 rounded-lg">
                    <p className="text-gray-500">No sub-trips found</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">No related trips found</p>
            </div>
          )}
        </div>
      )}

      {showSubTripModal && parentTrip && (
        <SubTripModal
          parentTrip={parentTrip}
          onClose={() => setShowSubTripModal(false)}
          onSubTripCreated={handleSubTripCreated}
        />
      )}
    </div>
  );
};

export default RelatedTripsPanel;