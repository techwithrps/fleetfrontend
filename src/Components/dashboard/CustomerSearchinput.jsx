import React, { useState, useEffect } from "react";
import api from "../../utils/Api";

const CustomerSearchInput = ({ value, onChange, placeholder }) => {
  const [customers, setCustomers] = useState([]);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState(value || "");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchCustomers = async () => {
      setLoading(true);

      try {
        const response = await api.get("/customers/customers");

        if (response?.data) {
          try {
            const customerData =
              typeof response.data === "string"
                ? JSON.parse(response.data)
                : response.data;

            const validCustomers = Array.isArray(customerData)
              ? customerData
              : [];

            setCustomers(validCustomers);
            setFilteredCustomers(validCustomers);
          } catch (parseError) {
            console.error("Error parsing customer data:", parseError);
            setCustomers([]);
            setFilteredCustomers([]);
          }
        } else {
          console.warn("Invalid or missing customer data in response");
          setCustomers([]);
          setFilteredCustomers([]);
        }
      } catch (error) {
        console.error("Error fetching customers:", error);
        setCustomers([]);
        setFilteredCustomers([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCustomers();
  }, []);

  // Update searchTerm when value prop changes (for editing scenarios)
  useEffect(() => {
    setSearchTerm(value || "");
  }, [value]);

  // Filter customers based on search term
  useEffect(() => {
    if (searchTerm && Array.isArray(customers) && customers.length > 0) {
      const filtered = customers.filter(
        (customer) =>
          (customer?.CustomerName || "")
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          (customer?.GSTNumber || "")
            .toLowerCase()
            .includes(searchTerm.toLowerCase())
      );
      setFilteredCustomers(filtered);
    } else {
      setFilteredCustomers(customers || []);
    }
  }, [searchTerm, customers]);

  const handleInputChange = (e) => {
    const inputValue = e.target.value;
    setSearchTerm(inputValue);
    onChange(inputValue);
    setIsOpen(true);
  };

  const handleCustomerSelect = (customer) => {
    if (!customer) {
      console.warn("No customer data provided");
      return;
    }

    const customerName = customer.CustomerName || "";
    setSearchTerm(customerName);
    onChange(customerName);
    setIsOpen(false);
  };

  const handleInputFocus = () => {
    setIsOpen(true);
  };

  const handleInputBlur = () => {
    setTimeout(() => setIsOpen(false), 200);
  };

  return (
    <div className="relative">
      <input
        type="text"
        className="w-full border rounded-md p-2"
        value={searchTerm}
        onChange={handleInputChange}
        onFocus={handleInputFocus}
        onBlur={handleInputBlur}
        placeholder={placeholder}
        required
      />

      {loading && (
        <div className="absolute right-2 top-2">
          <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      )}

      {isOpen && filteredCustomers.length > 0 && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
          {filteredCustomers.map((customer) => (
            <div
              key={customer.Id || customer.id}
              className="px-3 py-2 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0"
              onClick={() => handleCustomerSelect(customer)}
            >
              <div className="font-medium text-gray-900">
                {customer.CustomerName || "Unknown Customer"}
              </div>
              <div className="text-sm text-gray-500">
                GST: {customer.GSTNumber || "N/A"} |{" "}
                {customer.StateCode || "N/A"}, {customer.Country || "N/A"}
              </div>
              <div className="text-xs text-gray-400">
                {customer.BillingAddress || "No address available"}
              </div>
            </div>
          ))}
        </div>
      )}

      {isOpen && filteredCustomers.length === 0 && !loading && searchTerm && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg">
          <div className="px-3 py-2 text-gray-500 text-sm">
            No customers found matching "{searchTerm}"
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerSearchInput;
