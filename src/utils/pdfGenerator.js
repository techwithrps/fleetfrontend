import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import logo from "../images/translogo.png"; // Adjust the path as necessary

export const generateInvoice = (request, transporterDetails, invoiceData) => {
  try {
    console.log(
      "Generating invoice for request:",
      request,
      "with transporter details:",
      transporterDetails
    );

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width || 210;
    const pageHeight = doc.internal.pageSize.height || 297;

    // Header section
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Transplus Logistics Pvt Ltd.", pageWidth / 2, 20, {
      align: "center",
    });
    doc.setLineWidth(0.3);

    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text(
      "Gf-15 TDI CENTER PLOT NO.7 ,Jasola, New Delhi-110025",
      pageWidth / 2,
      28,
      { align: "center" }
    );
    doc.text(
      "Admin Office: Phone No: +91-11-49061530, Mobile: +91-9810296622",
      pageWidth / 2,
      33,
      { align: "center" }
    );
    doc.text("E-mail: ops@transplus.in", pageWidth / 2, 38, {
      align: "center",
    });
    doc.text("Website: www.transplus.in", pageWidth / 2, 43, {
      align: "center",
    });
    doc.text("State Code: 07 GSTIN: 07AABCE3576G1Z1", pageWidth / 2, 48, {
      align: "center",
    });
    doc.text("PAN: AABCE3576G", pageWidth / 2, 53, { align: "center" });
    doc.text("CIN: U63090DL2004PTC123819", pageWidth / 2, 58, {
      align: "center",
    });

    // Add company logo
    try {
      doc.addImage(logo, "PNG", 18, 15, 30, 20);
    } catch (error) {
      console.error("Error adding logo to PDF:", error);
      // Fallback to placeholder if logo fails
      doc.setDrawColor(150, 150, 150);
      doc.rect(15, 15, 30, 25);
      doc.setFontSize(8);
      doc.text("LOGO", 30, 30, { align: "center" });
    }

    // TAX INVOICE header
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("TAX INVOICE", pageWidth / 2, 70, { align: "center" });
    doc.line(90, 72, pageWidth - 90, 72);

    // Invoice details section - Bill to Consigner
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text("To:", 15, 85);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");

    const billingAddress =
      invoiceData?.billingAddress ||
      `${request.consigner || ""}\n${request.pickup_location || ""}`;
    const addressLines = doc.splitTextToSize(billingAddress, 85);
    doc.text(addressLines, 15, 92);

    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text("State Code: 07", 15, 117);
    doc.text(
      "GSTIN: " + (invoiceData?.gstin || request.gstin || "07AABCE1665A1Z1"),
      15,
      122
    );
    doc.text(
      "A/C: " + (request.consigner || "CONSIGNER NAME").toUpperCase(),
      15,
      127
    );
    doc.text(
      "BL No: " + (invoiceData?.bl_no || transporterDetails[0]?.bl_no || "N/A"),
      15,
      132
    );

    // Right section - Invoice details
    doc.setFontSize(8);
    doc.text("Invoice:", pageWidth - 80, 85);
    doc.text(`ECAB/${request.id}/00${request.id}`, pageWidth - 35, 85);
    doc.text("Dated:", pageWidth - 80, 92);
    doc.text(
      new Date(request.created_at).toLocaleDateString("en-GB"),
      pageWidth - 35,
      92
    );
    doc.text("Place of Supply:", pageWidth - 80, 99);
    doc.text("07", pageWidth - 35, 99);
    doc.text("Size/Type:", pageWidth - 80, 106);
    doc.text(request.vehicle_type || "N/A", pageWidth - 35, 106);
    doc.text("Line:", pageWidth - 80, 113);
    doc.text(
      invoiceData?.line || transporterDetails[0]?.line || "N/A",
      pageWidth - 35,
      113
    );
    doc.text("POL:", pageWidth - 80, 120);
    doc.text(
      request.pickup_location ? request.pickup_location.split(",")[0] : "N/A",
      pageWidth - 35,
      120
    );
    doc.text("POD:", pageWidth - 80, 127);
    doc.text(
      request.delivery_location
        ? request.delivery_location.split(",")[0]
        : "N/A",
      pageWidth - 35,
      127
    );

    // Location details
    doc.text(
      `Empty Pickup: ${
        request.pickup_location ? request.pickup_location.split(",")[0] : "N/A"
      }`,
      15,
      142
    );
    doc.text(
      `Factory Location: ${
        request.stuffing_location || request.pickup_location || "N/A"
      }`,
      100,
      142
    );
    doc.text(
      `Handover ICD: ${
        request.delivery_location
          ? request.delivery_location.split(",")[0]
          : "N/A"
      }`,
      pageWidth - 50,
      142
    );

    // Summary of Charges header
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("SUMMARY OF CHARGES", pageWidth / 2, 155, {
      align: "center",
    });
    doc.line(80, 157, pageWidth - 80, 157);

    // Calculate totals - Simple pricing without GST breakdown
    const baseAmount = parseFloat(request.requested_price) || 0;

    // Simplified charges table - container wise pricing
    const totalContainers = transporterDetails.length || 1;
    const pricePerContainer = baseAmount / totalContainers;
    const chargesData = [
      ["Sr", "Service", "HSN Code", "Qty", "Rate", "Total Amount"],
      [
        "1",
        "Transportation\nCharges per Container",
        "9965",
        totalContainers,
        pricePerContainer.toFixed(0),
        baseAmount.toFixed(0),
      ],
    ];

    autoTable(doc, {
      startY: 165,
      head: [chargesData[0]],
      body: [chargesData[1]],
      theme: "grid",
      headStyles: {
        fillColor: [220, 220, 220],
        textColor: [0, 0, 0],
        fontStyle: "bold",
        fontSize: 8,
        halign: "center",
      },
      styles: {
        fontSize: 7,
        cellPadding: 3,
        halign: "center",
        overflow: "linebreak",
      },
      columnStyles: {
        0: { cellWidth: 20 },
        1: { cellWidth: 40 },
        2: { cellWidth: 25 },
        3: { cellWidth: 20 },
        4: { cellWidth: 30 },
        5: { cellWidth: 35 },
      },
      margin: { left: 10, right: 10 },
    });

    // Vehicle and Container Details header
    const vehicleY = doc.lastAutoTable.finalY + 10;
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("VEHICLE & CONTAINER DETAILS", pageWidth / 2, vehicleY, {
      align: "center",
    });
    doc.line(70, vehicleY + 2, pageWidth - 70, vehicleY + 2);

    // Vehicle and Container table
    const vehicleData = transporterDetails.map((trans, index) => [
      index + 1,
      trans.vehicle_number || "N/A",
      trans.container_no || "N/A",
      trans.container_size || "N/A",
      trans.container_type || "N/A",
      trans.seal_no || "N/A",
      pricePerContainer.toFixed(0),
    ]);

    autoTable(doc, {
      startY: vehicleY + 10,
      head: [
        [
          "Sr",
          "Vehicle No",
          "Container No",
          "Size",
          "Type",
          "Seal No",
          "Container Price",
        ],
      ],
      body: vehicleData,
      theme: "grid",
      headStyles: {
        fillColor: [220, 220, 220],
        textColor: [0, 0, 0],
        fontStyle: "bold",
        fontSize: 8,
      },
      styles: {
        fontSize: 7,
        cellPadding: 3,
        halign: "center",
        overflow: "linebreak",
      },
      columnStyles: {
        0: { cellWidth: 10 },
        1: { cellWidth: 25 },
        2: { cellWidth: 30 },
        3: { cellWidth: 20 },
        4: { cellWidth: 20 },
        5: { cellWidth: 20 },
        6: { cellWidth: 30 },
      },
      margin: { left: 10, right: 10 },
    });

    // Helper function to check if we need a new page
    const checkNewPage = (currentY, requiredSpace = 20) => {
      if (currentY + requiredSpace > pageHeight - 20) {
        doc.addPage();
        return 20;
      }
      return currentY;
    };

    // Amount in words
    let currentY = doc.lastAutoTable.finalY + 10;
    currentY = checkNewPage(currentY, 30);

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    const amountInWords = numberToWords(baseAmount.toFixed(0)) + " Only";
    const wrappedAmountText = doc.splitTextToSize(
      amountInWords,
      pageWidth - 30
    );

    doc.text("Amount in Words: " + wrappedAmountText[0], 15, currentY);
    currentY += 5;

    // Handle additional lines for amount in words
    for (let i = 1; i < wrappedAmountText.length; i++) {
      currentY = checkNewPage(currentY, 5);
      doc.text(wrappedAmountText[i], 15, currentY);
      currentY += 5;
    }

    currentY += 10;

    // Notes section
    currentY = checkNewPage(currentY, 15);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("Notes", 15, currentY);
    currentY += 8;

    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text("Thanks for your business.", 15, currentY);
    currentY += 15;

    // Terms and conditions
    currentY = checkNewPage(currentY, 100);

    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("Terms & Conditions", 15, currentY);
    currentY += 8;

    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");

    const terms = [
      "Credit on Input Tax charged on Goods & Services used in supplying the services has not been taken. GST @ 5% will be deposited by Recipient of Road Transportation Services.",
      "1) If Bill is not paid within agreed term, interest will be charged @24% p.a.",
      "2) All disputes are subject to the Delhi jurisdiction only;",
      "3) Payment must be made by A/c PAYEE Cheque/Draft/Online Payment in favour of : Transplus Logistics Private Limited",
      "Total Freight Rs.",
      `Nature of Service: Goods Transport Agency;        GST@ 5%        Rs`,
      `SAC Code        996511;`,
      "Place of Supply",
      "4) Pls contact Ritik at 70651 92723 for any query related to this invoice.",
      "5) IFS CODE :- ICIC0001134",
      `6) ACCOUNT NUMBER :- 165105002435`,
    ];

    terms.forEach((term, index) => {
      const wrappedTerm = doc.splitTextToSize(term, pageWidth - 30);
      const requiredSpace = wrappedTerm.length * 4 + 2;

      currentY = checkNewPage(currentY, requiredSpace);

      wrappedTerm.forEach((line, lineIndex) => {
        doc.text(line, 15, currentY);
        currentY += 4;
      });
      currentY += 2;
    });

    // Digital Signature section
    currentY = checkNewPage(currentY, 60); // Ensure enough space for the new signature block

    const signatureBlockX = pageWidth - 95; // X position for the signature block (right aligned)
    const signatureBlockWidth = 80; // Width of the signature block

    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text("For Transplus Logistics Pvt Ltd.", signatureBlockX + signatureBlockWidth / 2, currentY, { align: 'center' });

    // Draw a rectangle for signature
    doc.setDrawColor(0, 0, 0);
    doc.rect(signatureBlockX, currentY + 5, signatureBlockWidth, 30); // x, y, width, height

    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text("Authorised Signatory", signatureBlockX + signatureBlockWidth / 2, currentY + 40, { align: 'center' });

    return doc;
  } catch (error) {
    console.error("PDF Generation Error:", error);
    throw error;
  }
};

// Helper function to convert numbers to words
function numberToWords(num) {
  const units = [
    "",
    "One",
    "Two",
    "Three",
    "Four",
    "Five",
    "Six",
    "Seven",
    "Eight",
    "Nine",
    "Ten",
    "Eleven",
    "Twelve",
    "Thirteen",
    "Fourteen",
    "Fifteen",
    "Sixteen",
    "Seventeen",
    "Eighteen",
    "Nineteen",
  ];

  const tens = [
    "",
    "",
    "Twenty",
    "Thirty",
    "Forty",
    "Fifty",
    "Sixty",
    "Seventy",
    "Eighty",
    "Ninety",
  ];

  const numStr = num.toString();
  const parts = numStr.split(".");
  const wholePart = parseInt(parts[0]);

  function convertLessThanOneThousand(n) {
    if (n === 0) return "";
    if (n < 20) return units[n];
    if (n < 100)
      return (
        tens[Math.floor(n / 10)] + (n % 10 !== 0 ? " " + units[n % 10] : "")
      );
    return (
      units[Math.floor(n / 100)] +
      " Hundred" +
      (n % 100 !== 0 ? " " + convertLessThanOneThousand(n % 100) : "")
    );
  }

  let result = "";

  if (wholePart === 0) {
    result = "Zero";
  } else {
    const crores = Math.floor(wholePart / 10000000);
    const lakhs = Math.floor((wholePart % 10000000) / 100000);
    const thousands = Math.floor((wholePart % 100000) / 1000);
    const remainder = wholePart % 1000;

    if (crores > 0) {
      result += convertLessThanOneThousand(crores) + " Crore ";
    }

    if (lakhs > 0) {
      result += convertLessThanOneThousand(lakhs) + " Lakh ";
    }

    if (thousands > 0) {
      result += convertLessThanOneThousand(thousands) + " Thousand ";
    }

    if (remainder > 0) {
      result += convertLessThanOneThousand(remainder);
    }
  }

  return "Indian Rupee " + result.trim();
}
