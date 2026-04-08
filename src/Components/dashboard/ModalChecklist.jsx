import React, { useState } from "react";

const ModalChecklist = ({ isOpen, onClose, onVerify }) => {
  const checklistItems = [
    // ... your existing checklist items
    "CABIN ROOF",
    "CABIN INDICATOR",
    "PANEL LIGHT",
    "PANEL DISPLAY",
    "PANEL LOCK",
    "PANEL TOP GLASS",
    "GEAR LOCK",
    "DIESEL TANK KEY",
    "DIESEL TANK",
    "SEAT BELT LHS",
    "SEAT BELT RHS",
    "DRIVER SEAT",
    "CONDUCTOR SEAT",
    "FRONT BUMPER OK/NOT OK",
    "DASH BOARD ADDITIONAL SPOT",
    "NUMBER PLATE",
    "NUMBER PLATE LIGHT",
    "NUMBER PLATE BULB",
    "TROLLEY AIR PRESSURE TANK",
    "HYDROLIC JACK",
    "HYDROLIC JACK SHOE",
    "TROLLEY INSIDE LINER SHOE",
    "PM IN TROLLEY (YES/NO)",
    "TROLLEY TOOL BOX (TOOL)",
    "TROLLEY BACK (KHALA)",
    "TROLLEY SIDE SIDE RAIL",
    "TROLLEY LHS SIDE WALL",
    "TROLLEY RHS SIDE WALL",
    "SIDE END PLATE",
    "HYDROLIC JACK DECK",
    "BACK FOOT",
    "SPARETY INSIDE GRACK",
    "TROLLEY INSIDE BODY",
    "TROLLEY FLOOR FOAM",
    "TROLLEY DOOR",
    "TROLLEY SIDE BOX INSIDE",
    "TROLLEY SMALL WINDOW TOP SLIDING OK/NOT OK",
    "TROLLEY SMALL WINDOW BOTTOM ZND",
    "TROLLEY REMOTE",
    "TRAILER FLOOR",
    "TROLLEY CONTROL BOX ZINK/NOT OK",
    "UPPER JACK ZINK/GLADER",
    "TROLLEY MUDGUARD LHS",
    "TROLLEY MUDGUARD RHS",
    "TROLLEY INSIDE LINER OK/NOT OK",
    "HORSE FRONT LHS TYRE NO",
    "HORSE FRONT RHS TYRE NO",
    "HORSE REAR LHS TYRE NO",
    "HORSE REAR RHS TYRE NO",
    "TROLLY FRONT LHS TYRE NO",
    "TROLLY FRONT RHS TYRE NO",
    "TROLLY REAR LHS TYRE NO",
    "TROLLY REAR RHS TYRE NO",
    "STEPANY NO",
    "CABIN FLOOR",
    "CABIN SIDE MIRROR",
    "CABIN MIDDLE MIRROR ON TOP",
    "CABIN INSIDE MIRROR",
    "CABIN INSIDE MIRROR GLASS",
    "CABIN WASHSHIELD",
    "CABIN RHS WINDOW",
    "CABIN LHS WINDOW",
    "CABIN FOOTSTEP RHS",
    "CABIN FOOTSTEP LHS",
    "CABIN DOOR LHS HANDLE",
    "CABIN DOOR RHS HANDLE",
    "CABIN DOOR GLASS HANDLE",
    "CABIN DOOR GLASS WORKING/NOT WORKING",
    "FIRE SYLINDER",
    "PARKING LIGHT FRONT",
    "CABIN DOOR LOCK",
    "BATTERY BOX",
    "STEEL FRAME",
    "SANDWICH",
    "HORSE BACK",
    "HORSE LHS",
    "HORSE RHS",
    "HORSE MACHINE",
    "UPS",
    "LHS WIPER",
    "RHS WIPER",
    "NOX SENSOR",
    "DIFUSER MACHINE",
    "UREA NOZZLE",
    "UREA SENSOR WITH COVER",
    "BONNET SEAT",
    "NUMBER OF JACK",
    "CHASIS/KM READING/ENGINE REG NUMBER",
    "CARRIER DESCRIPTION WHILE TAKING HANDOVER FROM OEM",
  ];

  return isOpen ? (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        backgroundColor: "rgba(0,0,0,0.5)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 999,
      }}
    >
      <div
        style={{
          backgroundColor: "#fff",
          padding: "20px",
          width: "95%",
          maxHeight: "90vh",
          overflowY: "auto",
          borderRadius: "10px",
          boxShadow: "0 0 15px rgba(0,0,0,0.2)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <h2 style={{ margin: 0 }}>Inspection Checklist</h2>
          <button
            onClick={onClose}
            style={{
              padding: "6px 12px",
              backgroundColor: "#e74c3c",
              color: "#fff",
              border: "none",
              borderRadius: "5px",
              cursor: "pointer",
            }}
          >
            Close
          </button>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
            gap: "10px",
            marginTop: "20px",
          }}
        >
          {checklistItems.map((item, index) => (
            <label
              key={index}
              style={{
                display: "flex",
                alignItems: "center",
                padding: "5px 10px",
                border: "1px solid #ccc",
                borderRadius: "6px",
                background: "#f9f9f9",
              }}
            >
              <input type="checkbox" style={{ marginRight: "10px" }} />
              {item}
            </label>
          ))}
        </div>

        <div style={{ textAlign: "center", marginTop: "20px" }}>
          <button
            onClick={onVerify}
            style={{
              padding: "10px 20px",
              backgroundColor: "#2ecc71",
              color: "#fff",
              border: "none",
              borderRadius: "6px",
              fontWeight: "bold",
              cursor: "pointer",
            }}
          >
            Verify and Proceed
          </button>
        </div>
      </div>
    </div>
  ) : null;
};

export default ModalChecklist;
