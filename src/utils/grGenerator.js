import jsPDF from "jspdf";
import "jspdf-autotable";
import logo from "../images/translogo.png"; // Adjust the path as necessary

export const generateGR = (request, transporterDetails = null) => {
  const copies = ["Original Copy", "Duplicate Copy", "Triplicate Copy"];
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  // Helper function to get the first transporter/vehicle details
  const getFirstTransporter = () => {
    if (!transporterDetails || transporterDetails.length === 0) return null;
    return transporterDetails[0];
  };

  // Helper function to get container details
  const getContainerDetails = () => {
    const firstTransporter = getFirstTransporter();
    if (!firstTransporter) return null;

    // If containers array exists, get first container
    if (firstTransporter.containers && firstTransporter.containers.length > 0) {
      return firstTransporter.containers[0];
    }

    // Fallback to direct properties
    return {
      container_no: firstTransporter.container_no,
      line: firstTransporter.line,
      seal_no: firstTransporter.seal_no,
    };
  };

  const firstTransporter = getFirstTransporter();
  const containerDetails = getContainerDetails();

  copies.forEach((copyType, index) => {
    if (index > 0) doc.addPage();

    doc.setFontSize(8);
    doc.text(new Date().toLocaleDateString(), 14, 10);

    doc.setFontSize(10);
    doc.setTextColor(255, 0, 0);
    doc.text(copyType, doc.internal.pageSize.width - 50, 18);
    doc.setTextColor(0, 0, 0);

    try {
      doc.addImage(logo, "PNG", 14, 20, 25, 20);
    } catch (error) {
      doc.rect(14, 20, 30, 30);
      doc.setFontSize(6);
      doc.text("LOGO", 29, 37, { align: "center" });
    }

    // Main Company Header (keeping this part as requested)
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 255);
    doc.text(
      "TRANSPLUS LOGISTICS PRIVATE LIMITED",
      doc.internal.pageSize.width / 2,
      28,
      {
        align: "center",
      }
    );

    doc.setFontSize(8);
    doc.setTextColor(0, 0, 0);
    doc.text(
      "Complete Logistics Solution Provider",
      doc.internal.pageSize.width / 2,
      34,
      { align: "center" }
    );

    // Updated Company Address and Details (keeping this part as requested)
    doc.setFontSize(7);
    const addressLines = [
      "Regd. Office:Gf-15 TDI CENTER PLOT NO.7 ,Jasola, New Delhi-110025",
      "Admin Office: Phone No: +91-11-49061530, Mobile: +91-9810296622",
      "E-mail: ops@transplus.in Website: www.transplus.in",
      "State Code: 07 | GSTIN: 07AABCE3576G1Z1 | PAN: AABCE3576G | CIN: U63090DL2004PTC123819",
    ];

    addressLines.forEach((line, i) => {
      doc.text(line, doc.internal.pageSize.width / 2, 38 + i * 3, {
        align: "center",
      });
    });

    // Use API data for transporter details with fallbacks
    const vehicleNumber = firstTransporter?.vehicle_number || "Not Assigned";
    const driverName = firstTransporter?.driver_name || "Not Assigned";
    const driverContact = firstTransporter?.driver_contact || "Not Available";

    // Enhanced function to detect and handle Hindi text
    const isHindiText = (text) => {
      if (!text) return false;
      // Check for Devanagari script (Hindi)
      return /[\u0900-\u097F]/.test(text.toString());
    };

    // Enhanced function to handle long text with proper Hindi support
    const splitTextToFit = (text, maxWidth, fontSize = 7) => {
      if (!text) return [""];

      doc.setFontSize(fontSize);

      // Convert to string and handle Unicode properly
      const textStr = text.toString().trim();

      // Check if text contains Hindi characters
      const containsHindi = isHindiText(textStr);

      if (containsHindi) {
        // For Hindi text, use character-based splitting with better width estimation
        const lines = [];
        let currentLine = "";

        // Split by natural boundaries first (spaces, commas, dashes)
        const segments = textStr.split(/(\s+|,\s*|-\s*)/);

        for (let segment of segments) {
          const testLine = currentLine + segment;

          // Better width estimation for Hindi text
          // Hindi characters are generally wider than English
          const estimatedWidth = testLine.length * 3.2; // Adjusted multiplier for Hindi
          const englishChars = (testLine.match(/[a-zA-Z0-9]/g) || []).length;
          const adjustedWidth = estimatedWidth - englishChars * 0.8;

          if (adjustedWidth <= maxWidth) {
            currentLine = testLine;
          } else {
            if (currentLine.trim()) {
              lines.push(currentLine.trim());
              currentLine = segment;
            } else {
              // Segment is too long, break it by characters
              while (segment.length > 0) {
                let chunk = segment;
                let chunkWidth = chunk.length * 3.2;

                while (chunkWidth > maxWidth && chunk.length > 1) {
                  chunk = chunk.slice(0, -1);
                  chunkWidth = chunk.length * 3.2;
                }

                lines.push(chunk);
                segment = segment.slice(chunk.length);
              }
              currentLine = "";
            }
          }
        }

        if (currentLine.trim()) {
          lines.push(currentLine.trim());
        }

        return lines.length > 0 ? lines : [""];
      } else {
        // English text handling (original logic)
        const words = textStr.split(" ");
        const lines = [];
        let currentLine = "";

        words.forEach((word) => {
          const testLine = currentLine ? `${currentLine} ${word}` : word;
          const textWidth = doc.getTextWidth(testLine);

          if (textWidth <= maxWidth) {
            currentLine = testLine;
          } else {
            if (currentLine) {
              lines.push(currentLine);
              currentLine = word;
            } else {
              // Word is too long, break it character by character
              while (word.length > 0) {
                let chunk = word;
                while (doc.getTextWidth(chunk) > maxWidth && chunk.length > 1) {
                  chunk = chunk.slice(0, -1);
                }
                lines.push(chunk);
                word = word.slice(chunk.length);
              }
              currentLine = "";
            }
          }
        });

        if (currentLine) {
          lines.push(currentLine);
        }

        return lines.length > 0 ? lines : [""];
      }
    };

    // Enhanced function to truncate text with better Hindi handling
    const truncateText = (text, maxLines = 3, maxWidth = 50) => {
      if (!text) return "";

      const lines = splitTextToFit(text, maxWidth, 7);

      if (lines.length <= maxLines) {
        return lines.join("\n");
      }

      // Take first (maxLines - 1) lines completely
      const truncated = lines.slice(0, maxLines - 1);

      // Handle the last line with truncation
      const lastLine = lines[maxLines - 1] || "";
      const containsHindi = isHindiText(lastLine);

      if (containsHindi) {
        // For Hindi, truncate more conservatively
        if (lastLine.length > 25) {
          truncated.push(lastLine.substring(0, 22) + "...");
        } else {
          truncated.push(lastLine);
        }
      } else {
        // For English, use original logic
        if (lastLine.length > 40) {
          truncated.push(lastLine.substring(0, 37) + "...");
        } else {
          truncated.push(lastLine);
        }
      }

      return truncated.join("\n");
    };

    // Enhanced location formatting with better Hindi support
    const formatLocation = (location) => {
      if (!location) return "";

      const locationStr = location.toString().trim();
      const containsHindi = isHindiText(locationStr);

      // For Hindi locations, be more conservative with length
      const maxLength = containsHindi ? 35 : 45;

      if (locationStr.length > maxLength) {
        // Split by logical separators
        const separators = containsHindi
          ? /([,;।]|\s+)/ // Include Hindi sentence separator
          : /([,;]|\s+)/;

        const parts = locationStr
          .split(separators)
          .filter((part) => part.trim());

        if (parts.length > 1) {
          let result = [];
          let currentLine = "";

          parts.forEach((part) => {
            part = part.trim();
            if (!part || /^[,;।\s]+$/.test(part)) return; // Skip separators

            const separator = currentLine ? ", " : "";
            const testLine = currentLine + separator + part;
            const testLength = containsHindi
              ? testLine.length * 1.5
              : testLine.length;

            if (testLength <= maxLength) {
              currentLine = testLine;
            } else {
              if (currentLine) result.push(currentLine);
              currentLine = part;
            }
          });

          if (currentLine) result.push(currentLine);
          return result.slice(0, 2).join("\n");
        }
      }

      return truncateText(locationStr, 2, containsHindi ? 35 : 50);
    };

    // Process main details with API data
    const consignerLines = truncateText(
      request.consigner || "TEAM ELOGISOL .",
      2,
      50
    );
    const consigneeLines = truncateText(
      request.consignee || "Not Specified",
      2,
      50
    );
    const addressLines2 = truncateText(
      request.delivery_location || "Not Specified",
      3,
      50
    );

    const originLocation = formatLocation(
      request.pickup_location || "Not Specified"
    );
    const toLocation = formatLocation(
      request.delivery_location || "Not Specified"
    );
    const handoverLocation = formatLocation(
      request.delivery_location || "Not Specified"
    );

    // Format date from API data
    const formatDate = (dateString) => {
      if (!dateString) return new Date().toLocaleDateString("en-GB");
      return new Date(dateString).toLocaleDateString("en-GB");
    };

    const tableData = [
      [
        {
          content: "Consignor",
          styles: { fontStyle: "bold", fillColor: [230, 230, 230] },
        },
        { content: consignerLines },
        {
          content: "GR No",
          styles: { fontStyle: "bold", fillColor: [230, 230, 230] },
        },
        {
          content:
            request.formatted_request_id ||
            request.id?.toString() ||
            "Not Available",
        },
      ],
      [
        {
          content: "Consignee",
          styles: { fontStyle: "bold", fillColor: [230, 230, 230] },
        },
        { content: consigneeLines },
        {
          content: "Date",
          styles: { fontStyle: "bold", fillColor: [230, 230, 230] },
        },
        { content: formatDate(request.created_at) },
      ],
      [
        {
          content: "Address",
          styles: { fontStyle: "bold", fillColor: [230, 230, 230] },
        },
        { content: addressLines2 },
        {
          content: "Party GSTIN",
          styles: { fontStyle: "bold", fillColor: [230, 230, 230] },
        },
        { content: request.party_gstin || request.gstin || "Not Available" },
      ],
      [
        {
          content: "Trailor/Truck No",
          styles: { fontStyle: "bold", fillColor: [230, 230, 230] },
        },
        { content: vehicleNumber },
        {
          content: "Origin",
          styles: { fontStyle: "bold", fillColor: [230, 230, 230] },
        },
        { content: originLocation },
      ],
      [
        {
          content: "Driver Name",
          styles: { fontStyle: "bold", fillColor: [230, 230, 230] },
        },
        { content: driverName },
        {
          content: "To",
          styles: { fontStyle: "bold", fillColor: [230, 230, 230] },
        },
        { content: toLocation },
      ],
      [
        {
          content: "Mobile No",
          styles: { fontStyle: "bold", fillColor: [230, 230, 230] },
        },
        { content: driverContact },
        {
          content: "Handover",
          styles: { fontStyle: "bold", fillColor: [230, 230, 230] },
        },
        { content: handoverLocation },
      ],
      [
        {
          content: "Description of goods",
          styles: { fontStyle: "bold", fillColor: [230, 230, 230] },
        },
        {
          content:
            request.commodity || request.description || "MISCELLANEOUS GOODS",
          styles: { colSpan: 3 },
        },
        "",
        "",
      ],
    ];

    doc.autoTable({
      startY: 52, // Adjusted to accommodate new header height
      head: [],
      body: tableData,
      theme: "grid",
      styles: {
        fontSize: 7,
        cellPadding: 2,
        halign: "left",
        valign: "top",
        lineColor: [0, 0, 0],
        lineWidth: 0.5,
        overflow: "linebreak",
        cellWidth: "wrap",
      },
      columnStyles: {
        0: { cellWidth: 35, fillColor: [230, 230, 230] },
        1: { cellWidth: 55, overflow: "linebreak" },
        2: { cellWidth: 35, fillColor: [230, 230, 230] },
        3: { cellWidth: 55, overflow: "linebreak" },
      },
      didParseCell: function (data) {
        // Handle multi-line text in cells
        if (data.cell.text && data.cell.text.length > 0) {
          const text = data.cell.text[0];
          if (text && text.includes("\n")) {
            data.cell.text = text.split("\n");
          }
        }

        // Adjust cell height for multi-line content, especially Hindi text
        if (data.cell.text && data.cell.text.length > 1) {
          const hasHindi = data.cell.text.some((line) => isHindiText(line));
          const heightMultiplier = hasHindi ? 5 : 4; // More height for Hindi
          data.cell.styles.minCellHeight = Math.max(
            12,
            data.cell.text.length * heightMultiplier
          );
        }
      },
    });

    // Second section with container details using API data
    const getVehicleSize = () => {
      // Try to get from request first
      if (request.vehicle_size) {
        // Extract numeric value from vehicle size (e.g., "20ft" -> "20", "40ft" -> "40")
        const match = request.vehicle_size.match(/(\d+)/);
        return match ? match[1] : "40";
      }

      // Try to determine from container counts
      if (request.containers_40ft && parseInt(request.containers_40ft) > 0) {
        return "40";
      }
      if (request.containers_20ft && parseInt(request.containers_20ft) > 0) {
        return "20";
      }

      return "40"; // Default
    };

    const containerData = [
      [
        {
          content: "Jo No",
          styles: { fontStyle: "bold", fillColor: [230, 230, 230] },
        },
        {
          content:
            request.job_number ||
            request.formatted_request_id ||
            request.id?.toString() ||
            "Not Available",
        },
        {
          content: "(TO BE FILLED BY PARTY)",
          styles: { fontStyle: "bold", fillColor: [230, 230, 230], colSpan: 2 },
        },
        "",
      ],
      [
        {
          content: "Container No",
          styles: { fontStyle: "bold", fillColor: [230, 230, 230] },
        },
        {
          content:
            containerDetails?.container_no ||
            request.container_number ||
            "Not Available",
        },
        {
          content: "Party Ref No.",
          styles: { fontStyle: "bold", fillColor: [230, 230, 230] },
        },
        { content: request.party_ref_no || request.reference_number || "-" },
      ],
      [
        {
          content: "Size",
          styles: { fontStyle: "bold", fillColor: [230, 230, 230] },
        },
        { content: getVehicleSize() },
        {
          content: "Party Advance",
          styles: { fontStyle: "bold", fillColor: [230, 230, 230] },
        },
        { content: request.advance_amount || "-" },
      ],
      [
        {
          content: "Type",
          styles: { fontStyle: "bold", fillColor: [230, 230, 230] },
        },
        { content: request.cargo_type || request.vehicle_type || "HC" },
        {
          content: "Seal No",
          styles: { fontStyle: "bold", fillColor: [230, 230, 230] },
        },
        {
          content:
            containerDetails?.seal_no || request.seal_number || "Not Available",
        },
      ],
      [
        {
          content: "Line",
          styles: { fontStyle: "bold", fillColor: [230, 230, 230] },
        },
        {
          content:
            containerDetails?.line || request.shipping_line || "Not Available",
        },
        {
          content: "Factory Site Reporting",
          styles: { fontStyle: "bold", fillColor: [230, 230, 230] },
        },
        {
          content: request.factory_reporting_date
            ? formatDate(request.factory_reporting_date)
            : "-",
        },
      ],
      [
        {
          content: "Seal No",
          styles: { fontStyle: "bold", fillColor: [230, 230, 230] },
        },
        {
          content:
            containerDetails?.seal_no || request.seal_number || "Not Available",
        },
        {
          content: "Factory Site Release",
          styles: { fontStyle: "bold", fillColor: [230, 230, 230] },
        },
        {
          content: request.factory_release_date
            ? formatDate(request.factory_release_date)
            : "-",
        },
      ],
      [
        {
          content: "Pay Load",
          styles: { fontStyle: "bold", fillColor: [230, 230, 230] },
        },
        {
          content: `${request.cargo_weight || "Not Specified"} ${
            request.cargo_weight ? "kg" : ""
          }`,
        },
        {
          content: "VIA",
          styles: { fontStyle: "bold", fillColor: [230, 230, 230] },
        },
        { content: request.route_via || "-" },
      ],
      [
        {
          content: "Oil Slip No",
          styles: { fontStyle: "bold", fillColor: [230, 230, 230] },
        },
        { content: request.oil_slip_no || "00" },
        { content: "", styles: { colSpan: 2 } },
        "",
      ],
      [
        {
          content: "Port",
          styles: { fontStyle: "bold", fillColor: [230, 230, 230] },
        },
        {
          content:
            request.port ||
            request.origin_port ||
            request.destination_port ||
            "Not Specified",
          styles: { colSpan: 3 },
        },
        "",
        "",
      ],
    ];

    doc.autoTable({
      startY: doc.lastAutoTable.finalY + 2,
      head: [],
      body: containerData,
      theme: "grid",
      styles: {
        fontSize: 7,
        cellPadding: 2,
        halign: "left",
        valign: "middle",
        lineColor: [0, 0, 0],
        lineWidth: 0.5,
      },
      columnStyles: {
        0: { cellWidth: 35, fillColor: [230, 230, 230] },
        1: { cellWidth: 55 },
        2: { cellWidth: 35, fillColor: [230, 230, 230] },
        3: { cellWidth: 55 },
      },
    });

    // Signature sections
    const currentY = doc.lastAutoTable.finalY + 5;

    // Draw signature boxes with exact dimensions
    doc.rect(14, currentY, 90, 35); // Left signature box
    doc.rect(105, currentY, 90, 35); // Right signature box

    doc.setFontSize(8);
    doc.text("FOR FACTORY STAMP & SIGNATURE", 16, currentY + 8);
    doc.text("Authorised Signatory", 107, currentY + 8);

    // Declaration section
    const declarationY = currentY + 40;
    doc.rect(14, declarationY, 181, 35); // Declaration box

    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.text("DECLARATION", doc.internal.pageSize.width / 2, declarationY + 8, {
      align: "center",
    });

    doc.setFontSize(7);
    doc.text("Note:", 16, declarationY + 15);

    const declarationText = [
      "Goods are Transported at Owners risk.",
      "Company will not be responsible for the damage of goods, leakage and breakage.",
      "Consignee is responsible for the correctness of GSTIN & other details.",
      "All Matter of Disputes will be settled in DELHI Jurisdiction only.",
    ];

    declarationText.forEach((text, i) => {
      doc.text(`${i + 1}. ${text}`, 16, declarationY + 20 + i * 3.5);
    });

    // Footer with dynamic URL using API data
    doc.setFontSize(6);
    doc.setTextColor(0, 0, 255);
    const grNumber =
      request.formatted_request_id || request.id?.toString() || "default";
    doc.text(
      `https://www.elogfreight.com/GR.PH?uen6PRNT&Pthm-num-IDNO=sp=${grNumber}`,
      14,
      285
    );
    doc.setTextColor(0, 0, 0);
  });

  return doc;
};
