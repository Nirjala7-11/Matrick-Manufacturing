import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

/**
 * Utility to export tabular data to Excel (.xlsx)
 * @param {Array} columns Array of { header: string, key: string }
 * @param {Array} rows Array of objects containing row data
 * @param {string} fileName Name of file without extension
 * @param {string} sheetTitle Title inside spreadsheet
 */
export const exportToExcel = (columns, rows, fileName = 'report_export', sheetTitle = 'Manufacturing Report') => {
  try {
    // Transform rows to plain objects matching header labels
    const formattedData = rows.map((row) => {
      const formattedRow = {};
      columns.forEach((col) => {
        formattedRow[col.header] = row[col.key] !== undefined && row[col.key] !== null ? row[col.key] : '-';
      });
      return formattedRow;
    });

    const worksheet = XLSX.utils.json_to_sheet(formattedData);

    // Auto-fit column widths
    const colWidths = columns.map((col) => {
      const maxContentLen = Math.max(
        col.header.length,
        ...rows.map((r) => String(r[col.key] || '').length)
      );
      return { wch: Math.min(Math.max(maxContentLen + 4, 12), 40) };
    });
    worksheet['!cols'] = colWidths;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Report Data');

    // Generate buffer and trigger download
    XLSX.writeFile(workbook, `${fileName}_${new Date().toISOString().split('T')[0]}.xlsx`);
  } catch (error) {
    console.error('Error generating Excel file:', error);
    alert('Failed to generate Excel download. Please check browser permissions.');
  }
};

/**
 * Utility to export tabular data to PDF (.pdf)
 * @param {Array} columns Array of { header: string, key: string }
 * @param {Array} rows Array of objects containing row data
 * @param {string} fileName Name of file without extension
 * @param {string} reportTitle Title printed on PDF
 * @param {string} subtitle Subtitle or filter details
 */
export const exportToPDF = (
  columns,
  rows,
  fileName = 'report_export',
  reportTitle = 'Manufacturing ERP Report',
  subtitle = `Generated on ${new Date().toLocaleString()}`
) => {
  try {
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

    // Company Brand Header
    doc.setFillColor(15, 23, 42); // slate-900
    doc.rect(0, 0, doc.internal.pageSize.width, 24, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Matrick Manufacturing ERP', 14, 12);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text('Production Operations & Quality Control Intelligence', 14, 18);

    // Report Title Block
    doc.setTextColor(30, 41, 59);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(reportTitle, 14, 34);

    doc.setTextColor(100, 116, 139);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(subtitle, 14, 40);

    // Prepare AutoTable Headers and Body
    const headers = [columns.map((col) => col.header)];
    const body = rows.map((row) =>
      columns.map((col) => (row[col.key] !== undefined && row[col.key] !== null ? String(row[col.key]) : '-'))
    );

    // Render AutoTable
    autoTable(doc, {
      head: headers,
      body: body,
      startY: 46,
      theme: 'striped',
      headStyles: {
        fillColor: [37, 99, 235], // blue-600
        textColor: 255,
        fontSize: 9,
        fontStyle: 'bold',
        halign: 'left',
      },
      bodyStyles: {
        fontSize: 8.5,
        textColor: [51, 65, 85],
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252],
      },
      margin: { left: 14, right: 14 },
      didDrawPage: (data) => {
        // Footer page numbering
        const str = `Page ${doc.internal.getNumberOfPages()}`;
        doc.setFontSize(8);
        doc.setTextColor(148, 163, 184);
        doc.text(
          str,
          doc.internal.pageSize.width - 20,
          doc.internal.pageSize.height - 10
        );
      },
    });

    // Save PDF file
    doc.save(`${fileName}_${new Date().toISOString().split('T')[0]}.pdf`);
  } catch (error) {
    console.error('Error generating PDF file:', error);
    alert('Failed to generate PDF document. Please try again.');
  }
};
