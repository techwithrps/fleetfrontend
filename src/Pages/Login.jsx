import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import {
  Mail,
  Lock,
  ChevronDown,
  LogIn,
  CheckCircle,
} from "lucide-react";
import { authAPI, setAuthToken } from "../utils/Api";
import { locationAPI } from "../utils/Api"; // example

export default function Login() {
  const [locations, setLocations] = useState([]); // State to hold locations
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    location: "",
  });
  const [loading, setLoading] = useState(false);
  const [fetchingLocations, setFetchingLocations] = useState(false);
  const [error, setError] = useState("");

  const handleFetchLocations = async () => {
    if (!formData.email || !formData.password) {
      toast.warn("Please enter both email and password first");
      return;
    }

    setFetchingLocations(true);
    setError("");
    try {
      const response = await authAPI.getUserLocations({
        email: formData.email,
        password: formData.password
      });

      if (response && response.success) {
        setLocations(response.locations || []);
        if (response.locations.length > 0) {
          // Auto-select if only one location
          if (response.locations.length === 1) {
            setFormData(prev => ({ ...prev, location: response.locations[0].id }));
            sessionStorage.setItem("selectedLocation", response.locations[0].id);
          }
          toast.success("Access verified! Please select your location.");
        } else {
          setError("No locations assigned to this account.");
        }
      }
    } catch (err) {
      console.error("Access check error:", err);
      const msg = typeof err === 'string' ? err : err.message || "Invalid credentials or access error";
      setError(msg);
      toast.error(msg);
    } finally {
      setFetchingLocations(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Reset locations if credentials change
    if (name === 'email' || name === 'password') {
      if (locations.length > 0) setLocations([]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.location) {
      toast.error("Please select a location first");
      return;
    }
    setLoading(true);
    setError("");

    try {
      const { email, password, location } = formData;
      const response = await authAPI.login({ email, password, location });

      if (response && response.token) {
        const token = response.token;
        const user = response.user;

        setAuthToken(token);
        localStorage.setItem("user", JSON.stringify(user));
        localStorage.setItem("token", token);
        // Ensure the selected location is saved for global use
        sessionStorage.setItem("selectedLocation", location);
        
        const selectedLocObj = locations.find(l => String(l.id) === String(location));
        const locationName = selectedLocObj ? selectedLocObj.name : "";
        sessionStorage.setItem("selectedLocationName", locationName);

        toast.success(`Welcome back ${user.name}! Accessing ${locationName}`, {
          autoClose: 3000,
          position: "top-right",
        });

        setTimeout(() => {
          const userRole = user?.role?.toLowerCase();
          if (userRole === "admin") {
            window.location.href = "/admin-dashboard";
          } else {
            window.location.href = "/customer-dashboard";
          }
        }, 1000);
      } else {
        throw new Error("Invalid response from server. Please try again.");
      }
    } catch (err) {
      console.error("Authentication error:", err);
      let errorMessage = "Authentication failed. Please try again.";
      if (typeof err === "string") errorMessage = err;
      else if (err.message) errorMessage = err.message;
      
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Form Section */}
      <div className="flex flex-col w-full lg:w-1/2 bg-white relative z-10 shadow-[0_0_60px_-15px_rgba(0,0,0,0.1)]">
        <div className="flex flex-grow items-center justify-center p-8 sm:p-12 lg:p-16">
          <div className="w-full max-w-md animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Logo and Title */}
            <div className="text-center mb-10">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 text-white shadow-lg shadow-indigo-200 mb-6 transform transition-transform hover:scale-105">
                <svg
                  className="w-8 h-8"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                  ></path>
                </svg>
              </div>
              <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">
                Fleet Management
              </h1>
              <p className="text-slate-500 mt-2 text-sm font-medium">
                Welcome back! Please enter your details.
              </p>
            </div>

            <div className="mb-8 bg-slate-100/80 p-1.5 rounded-xl border border-slate-200/60 backdrop-blur-sm">
              <div className="w-full py-2.5 text-sm font-semibold rounded-lg transition-all duration-300 bg-white text-blue-600 shadow-sm ring-1 ring-slate-900/5 flex items-center justify-center">
                <LogIn className="w-4 h-4 mr-2" />
                Login
              </div>
            </div>

            {error && (
              <div className="mb-6 p-4 text-sm text-rose-600 bg-rose-50 border border-rose-100 rounded-xl flex items-start animate-in fade-in zoom-in-95 duration-300">
                <svg className="w-5 h-5 mr-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{error}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-5">
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-semibold text-slate-700 mb-1.5"
                  >
                    Email Address
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-500 transition-colors">
                      <Mail className="h-5 w-5" />
                    </div>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="pl-11 w-full px-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all outline-none"
                      placeholder="name@example.com"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="password"
                    className="block text-sm font-semibold text-slate-700 mb-1.5"
                  >
                    Password
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-500 transition-colors">
                      <Lock className="h-5 w-5" />
                    </div>
                    <input
                      type="password"
                      id="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      className="pl-11 w-full px-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all outline-none"
                      placeholder="••••••••"
                      required
                    />
                  </div>
                </div>

                {locations.length === 0 && (
                  <button
                    type="button"
                    onClick={handleFetchLocations}
                    disabled={fetchingLocations || !formData.email || !formData.password}
                    className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {fetchingLocations ? (
                      <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    ) : (
                      "Verify & Fetch Locations"
                    )}
                  </button>
                )}

                {locations.length > 0 && (
                  <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                    <label
                      htmlFor="location"
                      className="block text-sm font-semibold text-slate-700 mb-1.5"
                    >
                      Selected Access Location
                    </label>
                    <div className="relative group">
                      <select
                        id="location"
                        name="location"
                        value={formData.location}
                        onChange={(e) => {
                          const value = e.target.value;
                          setFormData((prev) => ({
                            ...prev,
                            location: value,
                          }));
                          sessionStorage.setItem("selectedLocation", value);
                        }}
                        className="pl-4 pr-10 w-full py-3 bg-blue-50/30 border border-blue-200 rounded-xl text-slate-800 text-sm appearance-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all outline-none font-bold"
                        required
                      >
                        <option value="" disabled>Choose Location</option>
                        {locations.map((loc) => (
                          <option key={loc.id} value={loc.id}>
                            {loc.name}
                          </option>
                        ))}
                      </select>
                      <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-blue-500">
                        <ChevronDown className="h-5 w-5" />
                      </div>
                    </div>
                    {locations.length > 1 && (
                      <p className="mt-1.5 text-[10px] text-slate-400 font-medium italic">
                        Multiple locations found. Please select one to proceed.
                      </p>
                    )}
                  </div>
                )}


                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center">
                    <input
                      id="remember-me"
                      name="remember-me"
                      type="checkbox"
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300 rounded cursor-pointer transition-colors"
                    />
                    <label
                      htmlFor="remember-me"
                      className="ml-2.5 block text-sm font-medium text-slate-600 cursor-pointer"
                    >
                      Remember me
                    </label>
                  </div>
                  <button
                    type="button"
                    className="text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors"
                    onClick={() => toast.info("Password reset functionality coming soon!")}
                  >
                    Forgot password?
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className={`relative w-full flex justify-center py-3.5 px-4 rounded-xl text-sm font-bold text-white shadow-[0_4px_14px_0_rgba(37,99,235,0.39)] bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 overflow-hidden transition-all duration-300 transform hover:-translate-y-0.5 ${
                    loading ? "opacity-90 cursor-not-allowed translate-y-0" : ""
                  }`}
                >
                  <span className={`relative z-10 flex items-center ${loading ? "opacity-0" : "opacity-100"}`}>
                    Sign In
                    <svg className="w-4 h-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </span>
                  {loading && (
                    <span className="absolute inset-0 z-20 flex items-center justify-center">
                      <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    </span>
                  )}
                </button>
              </div>
            </form>

            <div className="mt-8 text-center pt-6 border-t border-slate-100">
              <p className="text-sm font-medium text-slate-500">
                Account access is managed by your administrator.
              </p>
            </div>
          </div>
        </div>

        <div className="py-6 text-center text-xs font-semibold text-slate-400 flex justify-center space-x-4">
          <span>&copy; {new Date().getFullYear()} Fleet Management System.</span>
          <a href="#" className="hover:text-slate-600 transition-colors">Terms</a>
          <a href="#" className="hover:text-slate-600 transition-colors">Privacy</a>
        </div>
      </div>

      {/* Image/Background Section - Hidden on mobile */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-slate-900">
        {/* Abstract shapes / Gradients */}
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-600 rounded-full mix-blend-multiply filter blur-[100px] opacity-60 animate-blob"></div>
        <div className="absolute top-[20%] right-[-10%] w-[50%] h-[50%] bg-indigo-600 rounded-full mix-blend-multiply filter blur-[100px] opacity-60 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-[-20%] left-[20%] w-[60%] h-[60%] bg-purple-600 rounded-full mix-blend-multiply filter blur-[100px] opacity-40 animate-blob animation-delay-4000"></div>

        {/* Pattern overlay */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4wNSkiLz48L3N2Zz4=')] opacity-50"></div>

        <div className="relative z-10 flex flex-col justify-center w-full h-full p-16 lg:p-24 backdrop-blur-[2px]">
          <div className="max-w-xl">
            <h2 className="text-4xl lg:text-5xl font-extrabold text-white leading-tight mb-6">
              Manage Your Fleet with <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-300">Confidence</span>
            </h2>
            <p className="text-lg text-slate-300 mb-12 font-light leading-relaxed">
              Our comprehensive fleet management system helps you track vehicles, manage drivers, and optimize routes for maximum efficiency and reduced operational costs.
            </p>
            
            <div className="space-y-6">
              {[
                "Real-time vehicle tracking and advanced analytics",
                "Comprehensive maintenance scheduling & alerts",
                "Detailed reporting and fleet performance metrics"
              ].map((text, i) => (
                <div key={i} className="flex items-center transform transition-transform hover:translate-x-2 duration-300">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-white/10 backdrop-blur-md border border-white/10 mr-4 shadow-lg">
                    <CheckCircle className="w-5 h-5 text-indigo-300 flex-shrink-0" />
                  </div>
                  <p className="text-slate-200 font-medium">{text}</p>
                </div>
              ))}
            </div>

            <div className="mt-16 pt-8 border-t border-white/10 flex items-center">
              <div className="flex -space-x-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="w-10 h-10 rounded-full border-2 border-slate-900 bg-slate-700 flex items-center justify-center text-xs font-bold text-white overflow-hidden shadow-lg">
                    <img src={`https://i.pravatar.cc/100?img=${i + 10}`} alt="User" />
                  </div>
                ))}
              </div>
              <div className="ml-5">
                <div className="flex text-yellow-400">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} className="w-4 h-4 fill-current" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
                  ))}
                </div>
                <div className="text-sm text-slate-300 mt-1 font-medium">Trusted by 500+ companies</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
