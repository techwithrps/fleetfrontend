const ContainerCard = ({
  container,
  containerIndex,
  vehicleNumber,
  containers,
  onUpdateContainer,
  onRemoveContainer,
  canRemove,
}) => {
  const handleInputChange = (field, value) => {
    const containerGlobalIndex = containers.findIndex(
      (c) => c.vehicleIndex === container.vehicleIndex
    );
    onUpdateContainer(containerGlobalIndex, field, value);
  };

  const handleRemove = () => {
    const containerGlobalIndex = containers.findIndex(
      (c) => c.vehicleIndex === container.vehicleIndex
    );
    onRemoveContainer(containerGlobalIndex, container.id);
  };

  return (
    <div
      className="border border-gray-200 rounded-lg p-4 bg-gray-50"
      data-vehicle={vehicleNumber}
      data-container={JSON.stringify(container)}
    >
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-md font-medium text-gray-900">
          Container #{containerIndex + 1}
        </h3>
        {canRemove && (
          <button
            type="button"
            onClick={handleRemove}
            className="text-red-600 hover:text-red-800 text-sm font-medium flex items-center"
          >
            <svg
              className="w-4 h-4 mr-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
            Remove Container
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Container Number */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Container Number *
          </label>
          <input
            type="text"
            required
            className={`w-full h-10 text-sm border rounded-md px-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              container.containerNo &&
              !/^[A-Z]{4}[0-9]{7}$/.test(container.containerNo)
                ? "border-red-300 bg-red-50"
                : "border-gray-300"
            }`}
            value={container.containerNo}
            onChange={(e) => {
              const value = e.target.value
                .toUpperCase()
                .replace(/[^A-Z0-9]/g, "");
              if (value.length <= 11) {
                handleInputChange("containerNo", value);
              }
            }}
            placeholder="ABCD1234567"
            maxLength="11"
          />
          {container.containerNo &&
            !/^[A-Z]{4}[0-9]{7}$/.test(container.containerNo) && (
              <p className="text-xs text-red-600 mt-1">
                Format: 4 letters + 7 numbers
              </p>
            )}
        </div>

        {/* Container Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Container Type
          </label>
          <select
            className="w-full h-10 text-sm border border-gray-300 rounded-md px-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={container.containerType}
            onChange={(e) =>
              updateContainerData(
                containers.findIndex(
                  (c) => c.vehicleIndex === container.vehicleIndex
                ),
                "containerType",
                e.target.value
              )
            }
          >
            <option value="">Select Container Type</option>
            <option value="HQ">HQ</option>
            <option value="DV">D</option>
            <option value="REFER">REFER</option>
          </select>
        </div>

        {/* Container Size */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Container Size
          </label>
          <input
            type="text"
            className="w-full h-10 text-sm border border-gray-300 rounded-md px-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={container.containerSize}
            onChange={(e) => handleInputChange("containerSize", e.target.value)}
            placeholder="Container Size"
          />
        </div>

        {/* Shipping Line */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Shipping Line
          </label>
          <input
            type="text"
            className="w-full h-10 text-sm border border-gray-300 rounded-md px-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={container.line}
            onChange={(e) => handleInputChange("line", e.target.value)}
            placeholder="Shipping Line"
          />
        </div>

        {/* Seal 1 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Seal 1
          </label>
          <input
            type="text"
            className="w-full h-10 text-sm border border-gray-300 rounded-md px-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={container.seal1}
            onChange={(e) =>
              handleInputChange("seal1", e.target.value.toUpperCase())
            }
            placeholder="Seal 1"
          />
        </div>

        {/* Seal 2 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Seal 2
          </label>
          <input
            type="text"
            className="w-full h-10 text-sm border border-gray-300 rounded-md px-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={container.seal2}
            onChange={(e) =>
              handleInputChange("seal2", e.target.value.toUpperCase())
            }
            placeholder="Seal 2"
          />
        </div>

        {/* Container Weight */}
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
              handleInputChange("containerTotalWeight", e.target.value)
            }
            placeholder="Container Weight"
          />
        </div>

        {/* Cargo Weight */}
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
              handleInputChange("cargoTotalWeight", e.target.value)
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
            value={container.cargoTotalWeight + container.containerTotalWeight}
            placeholder="Total Weight"
          />
        </div>
      </div>
    </div>
  );
};

export default ContainerCard;
