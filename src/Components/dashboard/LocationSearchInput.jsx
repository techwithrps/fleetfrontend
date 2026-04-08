import { useState, useEffect, useRef } from "react";

const LocationSearchInput = ({
  value,
  onChange,
  placeholder,
  useOpenStreetMap,
}) => {
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [inputValue, setInputValue] = useState(value);
  const wrapperRef = useRef(null);

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const searchSavedLocations = async (searchText) => {
    if (!searchText || searchText.length < 2) {
      setSuggestions([]);
      return;
    }
    try {
      const response = await fetch(
        "https://running-backendelogisol.onrender.com/api/locations"
      );
      const data = await response.json();
      const filteredLocations = data.filter((location) =>
        location.LOCATION_NAME?.toLowerCase().includes(searchText.toLowerCase())
      );
      setSuggestions(filteredLocations);
      setShowSuggestions(true);
    } catch (error) {
      console.error("Saved locations search error:", error);
      setSuggestions([]);
    }
  };

  const searchOpenStreetMap = async (searchText) => {
    if (!searchText || searchText.length < 3) {
      setSuggestions([]);
      return;
    }
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          searchText
        )}&limit=5`
      );
      const data = await response.json();
      setSuggestions(data);
      setShowSuggestions(true);
    } catch (error) {
      console.error("OpenStreetMap search error:", error);
      setSuggestions([]);
    }
  };

  const handleInputChange = (e) => {
    const val = e.target.value;
    setInputValue(val);
    if (useOpenStreetMap) {
      searchOpenStreetMap(val);
    } else {
      searchSavedLocations(val);
    }
  };

  // ✅ Handle pressing Enter or leaving input field
  const handleInputConfirm = () => {
    if (inputValue.trim()) {
      onChange(inputValue.trim()); // Send free text upward
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    const locationString = useOpenStreetMap
      ? suggestion.display_name
      : suggestion.LOCATION_NAME;

    setInputValue(locationString);
    onChange(locationString);
    setSuggestions([]);
    setShowSuggestions(false);
  };

  const renderSuggestion = (suggestion) =>
    useOpenStreetMap ? (
      <div className="p-2 hover:bg-gray-100 cursor-pointer text-sm">
        {suggestion.display_name}
      </div>
    ) : (
      <div className="p-2 hover:bg-gray-100 cursor-pointer text-sm">
        <div className="font-medium">{suggestion.LOCATION_NAME}</div>
        <div className="text-gray-600 text-xs">
          ID: {suggestion.LOCATION_ID} | Terminal: {suggestion.TERMINAL_ID}
        </div>
      </div>
    );

  return (
    <div ref={wrapperRef} className="relative">
      <input
        type="text"
        className="w-full border rounded-md p-2"
        value={inputValue}
        onChange={handleInputChange}
        onBlur={handleInputConfirm} // ✅ confirm on blur
        onKeyDown={(e) => {
          if (e.key === "Enter") handleInputConfirm(); // ✅ confirm on Enter
        }}
        placeholder={placeholder}
        required
      />

      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-10 w-full bg-white border rounded-md mt-1 shadow-lg max-h-60 overflow-auto">
          {suggestions.map((suggestion) => (
            <div
              key={
                useOpenStreetMap
                  ? suggestion.place_id
                  : suggestion.LOCATION_REF_ID
              }
              onClick={() => handleSuggestionClick(suggestion)}
              className="cursor-pointer"
            >
              {renderSuggestion(suggestion)}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default LocationSearchInput;
