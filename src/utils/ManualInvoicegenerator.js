import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

export const generateManualInvoice = (invoiceData) => {
  try {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width || 210;
    const pageHeight = doc.internal.pageSize.height || 297;

    // Header section
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Transplus Logistics Pvt Ltd.", pageWidth / 2, 20, {
      align: "center",
    });

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

    // TAX INVOICE header
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("TAX INVOICE", pageWidth / 2, 70, { align: "center" });
    doc.line(90, 72, pageWidth - 90, 72);

    // Customer Information
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text("To:", 15, 85);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text(
      invoiceData.customerName?.toUpperCase() || "CUSTOMER NAME",
      15,
      92
    );
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");

    // Split customer address into multiple lines
    const addressLines = doc.splitTextToSize(
      invoiceData.customerAddress || "Customer Address",
      85
    );
    let addressY = 97;
    addressLines.forEach((line) => {
      doc.text(line, 15, addressY);
      addressY += 5;
    });

    doc.text("State Code: 07", 15, addressY + 5);
    doc.text(
      "GSTIN: " + (invoiceData.gstin || "07AABCE1665A1Z1"),
      15,
      addressY + 10
    );
    doc.text(
      "A/C: " + (invoiceData.customerName?.toUpperCase() || "CUSTOMER NAME"),
      15,
      addressY + 15
    );

    // Right section - Invoice details
    doc.setFontSize(8);
    doc.text("Invoice:", pageWidth - 80, 85);
    doc.text(invoiceData.invoiceNumber, pageWidth - 35, 85);
    doc.text("Dated:", pageWidth - 80, 92);
    doc.text(
      new Date(invoiceData.invoiceDate).toLocaleDateString("en-GB"),
      pageWidth - 35,
      92
    );
    doc.text("Place of Supply:", pageWidth - 80, 99);
    doc.text(invoiceData.placeOfSupply || "07", pageWidth - 35, 99);

    // Multi-Trip Transportation Services header
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("MULTI-TRIP TRANSPORTATION SERVICES", pageWidth / 2, 155, {
      align: "center",
    });
    doc.line(60, 157, pageWidth - 60, 157);

    // Service Details Table
    const serviceTableHeaders = [
      "Sr",
      "Service Description",
      "HSN Code",
      "Qty",
      "Rate",
      "Amount",
      invoiceData.useIgst ? "IGST\n18%" : "CGST\n9%",
      invoiceData.useIgst ? "" : "SGST\n9%",
      "Total\nAmount",
    ].filter((header) => header !== "");

    const serviceTableData = [];

    // Add each sub-trip as a row
    invoiceData.subTrips.forEach((trip, index) => {
      const tripAmount = trip.amount || 0;
      let cgstAmount = 0;
      let sgstAmount = 0;
      let igstAmount = 0;
      let totalAmount = tripAmount;

      if (invoiceData.useIgst) {
        igstAmount = (tripAmount * invoiceData.igstRate) / 100;
        totalAmount = tripAmount + igstAmount;
      } else {
        cgstAmount = (tripAmount * invoiceData.cgstRate) / 100;
        sgstAmount = (tripAmount * invoiceData.sgstRate) / 100;
        totalAmount = tripAmount + cgstAmount + sgstAmount;
      }

      const rowData = [
        (index + 1).toString(),
        trip.description,
        trip.hsnCode,
        trip.quantity.toString(),
        tripAmount.toFixed(0),
        tripAmount.toFixed(0),
        invoiceData.useIgst ? igstAmount.toFixed(0) : cgstAmount.toFixed(0),
        invoiceData.useIgst ? "" : sgstAmount.toFixed(0),
        totalAmount.toFixed(0),
      ].filter((cell) => cell !== "");

      serviceTableData.push(rowData);
    });

    // Add additional charges if any
    if (invoiceData.additionalCharges > 0) {
      const additionalAmount = invoiceData.additionalCharges;
      let cgstAmount = 0;
      let sgstAmount = 0;
      let igstAmount = 0;
      let totalAmount = additionalAmount;

      if (invoiceData.useIgst) {
        igstAmount = (additionalAmount * invoiceData.igstRate) / 100;
        totalAmount = additionalAmount + igstAmount;
      } else {
        cgstAmount = (additionalAmount * invoiceData.cgstRate) / 100;
        sgstAmount = (additionalAmount * invoiceData.sgstRate) / 100;
        totalAmount = additionalAmount + cgstAmount + sgstAmount;
      }

      const additionalRowData = [
        (invoiceData.subTrips.length + 1).toString(),
        invoiceData.additionalChargesDescription || "Additional Charges",
        "9965",
        "1",
        additionalAmount.toFixed(0),
        additionalAmount.toFixed(0),
        invoiceData.useIgst ? igstAmount.toFixed(0) : cgstAmount.toFixed(0),
        invoiceData.useIgst ? "" : sgstAmount.toFixed(0),
        totalAmount.toFixed(0),
      ].filter((cell) => cell !== "");

      serviceTableData.push(additionalRowData);
    }

    // Add totals row
    const totals = invoiceData.totals;
    const totalRowData = [
      "",
      "Total Charges",
      "",
      "",
      "",
      totals.totalWithAdditional.toFixed(0),
      invoiceData.useIgst
        ? totals.igstAmount.toFixed(0)
        : totals.cgstAmount.toFixed(0),
      invoiceData.useIgst ? "" : totals.sgstAmount.toFixed(0),
      totals.grandTotal.toFixed(0),
    ].filter((cell) => cell !== "");

    serviceTableData.push(totalRowData);

    // Generate service table
    autoTable(doc, {
      startY: 165,
      head: [serviceTableHeaders],
      body: serviceTableData,
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
      columnStyles: invoiceData.useIgst
        ? {
            0: { cellWidth: 12 },
            1: { cellWidth: 35 },
            2: { cellWidth: 18 },
            3: { cellWidth: 12 },
            4: { cellWidth: 20 },
            5: { cellWidth: 20 },
            6: { cellWidth: 25 },
            7: { cellWidth: 25 },
          }
        : {
            0: { cellWidth: 12 },
            1: { cellWidth: 30 },
            2: { cellWidth: 18 },
            3: { cellWidth: 12 },
            4: { cellWidth: 18 },
            5: { cellWidth: 18 },
            6: { cellWidth: 18 },
            7: { cellWidth: 18 },
            8: { cellWidth: 22 },
          },
      margin: { left: 10, right: 10 },
    });

    // Trip Details Section
    const tripDetailsY = doc.lastAutoTable.finalY + 15;
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("TRIP DETAILS", pageWidth / 2, tripDetailsY, { align: "center" });
    doc.line(80, tripDetailsY + 2, pageWidth - 80, tripDetailsY + 2);

    // Trip details table
    const tripHeaders = [
      "Trip",
      "Vehicle No",
      "Container No",
      "Driver Name",
      "From Location",
      "To Location",
      "Seal No",
    ];

    const tripTableData = invoiceData.subTrips.map((trip, index) => [
      `Trip ${index + 1}`,
      trip.vehicleNumber || "N/A",
      trip.containerNumber || "N/A",
      trip.driverName || "N/A",
      trip.fromLocation || "N/A",
      trip.toLocation || "N/A",
      trip.sealNumber || "N/A",
    ]);

    autoTable(doc, {
      startY: tripDetailsY + 10,
      head: [tripHeaders],
      body: tripTableData,
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
        1: { cellWidth: 25 },
        2: { cellWidth: 25 },
        3: { cellWidth: 25 },
        4: { cellWidth: 35 },
        5: { cellWidth: 35 },
        6: { cellWidth: 20 },
      },
      margin: { left: 10, right: 10 },
    });

    // Helper function to check if we need a new page
    const checkNewPage = (currentY, requiredSpace = 20) => {
      if (currentY + requiredSpace > pageHeight - 20) {
        doc.addPage();
        return 20; // Reset to top margin
      }
      return currentY;
    };

    // Amount in words
    let currentY = doc.lastAutoTable.finalY + 10;
    currentY = checkNewPage(currentY, 30);

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    const amountInWords =
      "Rupees " + numberToWords(totals.grandTotal.toFixed(0)) + " Only";
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

    // Notes section
    if (invoiceData.notes) {
      currentY += 5;
      currentY = checkNewPage(currentY, 20);
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.text("Notes:", 15, currentY);
      currentY += 5;
      doc.setFont("helvetica", "normal");
      const notesLines = doc.splitTextToSize(invoiceData.notes, pageWidth - 30);
      notesLines.forEach((line) => {
        currentY = checkNewPage(currentY, 5);
        doc.text(line, 15, currentY);
        currentY += 5;
      });
    }

    // Invoice note
    currentY += 5;
    currentY = checkNewPage(currentY, 15);
    doc.text("Invoice Note:", 15, currentY);
    currentY += 5;
    doc.text(
      `MANUAL${Math.floor(Math.random() * 1000000)}99 DL/MANUAL/2024-25`,
      15,
      currentY
    );
    currentY += 10;

    // Terms and conditions
    currentY = checkNewPage(currentY, 50);

    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("Terms & Conditions", 15, currentY);
    doc.line(15, currentY + 2, 75, currentY + 2);
    currentY += 8;

    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");

    const terms = [
      "1. Consignor/Consignee will be responsible for paying GST applicable from 1-July-2017.",
      "2. Cheques/DD should be drawn in favour of TRANSPLUS LOGISTICS PVT LIMITED payable at New Delhi.",
      "3. Any discrepancies in the bill should be brought to the notice of the company within 2 weeks of bill date.",
      "4. GST on 'Road Transportation' to be paid by Service Recipient under reverse charge i.e. @ 5%.",
      "5. Interest @ 18% p.a. is applicable if invoice is not paid in 30 Days",
      "6. This is a multi-trip transportation service invoice covering multiple journeys.",
      "7. Each trip is billed separately with consolidated tax calculation.",
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

    // IRN section
    currentY += 5;
    currentY = checkNewPage(currentY, 40);

    doc.setFontSize(8);
    doc.text("IRN No:", 15, currentY);
    currentY += 5;
    doc.text(
      "MANUAL" + Math.random().toString(36).substring(2, 15).toUpperCase(),
      15,
      currentY
    );
    currentY += 10;

    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("RTGS Details", 15, currentY);
    doc.line(15, currentY + 2, 60, currentY + 2);
    currentY += 7;

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text("TRANSPLUS LOGISTICS PVT. LIMITED", 15, currentY);
    currentY += 10;

    // Payment details table
    currentY = checkNewPage(currentY, 60);

    const paymentData = [
      ["Payment Details", "For INR Payment"],
      ["IFSC Code", "YESB0000048"],
      ["Swift Code", "YESBINBB"],
      ["Bank Name", "Yes Bank Ltd"],
      ["Account No", "004890100015XXX"],
    ];

    autoTable(doc, {
      startY: currentY,
      body: paymentData,
      theme: "grid",
      styles: { fontSize: 8, cellPadding: 3 },
      columnStyles: { 0: { cellWidth: 50 }, 1: { cellWidth: 70 } },
      margin: { left: 15 },
    });

    // Company name and signatory
    const sigY = doc.lastAutoTable.finalY + 10;
    const finalSigY = checkNewPage(sigY, 40);

    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text("TRANSPLUS LOGISTICS PVT. LIMITED", pageWidth - 70, finalSigY);
    doc.text("Authorized Signatory", pageWidth - 70, finalSigY + 35);

    return doc;
  } catch (error) {
    console.error("Manual Invoice PDF Generation Error:", error);
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
  const decimalPart = parts.length > 1 ? parseInt(parts[1]) : 0;

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

  if (decimalPart > 0) {
    result += " Point " + convertLessThanOneThousand(decimalPart);
  }

  return result.trim();
}
