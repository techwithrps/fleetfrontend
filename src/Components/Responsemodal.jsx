// Add this component inside ContainerDetailsPage before the return statement
const ResponseModal = ({ isOpen, onClose, data }) => {
  if (!isOpen || !data) return null;

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto"
      aria-labelledby="modal-title"
      role="dialog"
      aria-modal="true"
    >
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          aria-hidden="true"
        ></div>

        {/* Modal panel */}
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="sm:flex sm:items-start">
              <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                  Container Update Results
                </h3>
                <div className="mt-2 space-y-4">
                  {data.containers.map((container, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="font-medium text-gray-900">
                        Container: {container.container_no}
                      </div>
                      <div className="text-sm text-gray-600 mt-2 space-y-1">
                        <p>Vehicle: {container.vehicle_number}</p>
                        <p>Line: {container.line}</p>
                        <p>Size: {container.container_size}'</p>
                        <p>Type: {container.container_type}</p>
                      </div>

                      {container.message && (
                        <div className="mt-2 bg-yellow-50 border-l-4 border-yellow-400 p-3">
                          <div className="text-yellow-700 text-sm">
                            <span className="font-bold">⚠️ Warning: </span>
                            {container.message}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button
              type="button"
              onClick={onClose}
              className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResponseModal;
