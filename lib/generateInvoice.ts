// utils/generateInvoice.ts
import puppeteer from "puppeteer";
import fs from "fs/promises";
import path from "path";

export interface OrderInvoiceProps {
    id: string;
    customerName: string;
    phone: string;
    createdAt: Date;
    total: number;
    orderItems: Array<{
        name: string;
        quantity: number;
        price: number;
    }>;
    storeName: string;
    subtotal: number;
    tax: number;
    discount: number;
}

export async function generateInvoicePDF(order: OrderInvoiceProps) {
    const htmlPath = path.join(process.cwd(), "templates", "invoice-template.html");
    let html = await fs.readFile(htmlPath, "utf8");

    // Simple placeholder replacement
    html = html
        .replace("{{storeName}}", order.storeName)
        .replace("{{orderId}}", order.id)
        .replace("{{customerName}}", order.customerName)
        .replace("{{phone}}", order.phone)
        .replace("{{date}}", new Date(order.createdAt).toLocaleDateString())
        .replace("{{total}}", order.total.toString())
        .replace("{{subtotal}}", order.subtotal.toString())
        .replace("{{tax}}", order.tax.toString())
        .replace("{{discount}}", order.discount.toString());

    const itemsHtml = order.orderItems
        .map(item => `<tr><td>${item.name}</td><td>${item.quantity}</td><td>₹${item.price}</td></tr>`)
        .join("");

    html = html.replace("</tbody>", `${itemsHtml}</tbody>`);

    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    await page.setContent(html);

    const pdfBuffer = await page.pdf({
        format: "A4",
        printBackground: true
    });

    await browser.close();
    return pdfBuffer;
}
