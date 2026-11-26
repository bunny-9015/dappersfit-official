export interface InvoiceItem {
  name: string;
  brand: string;
  quantity: number;
  price: number;
}

export interface InvoicePayload {
  orderNumber: string;
  createdAt?: Date | string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string | null;
  shippingAddress: string;
  city?: string | null;
  state?: string | null;
  pincode?: string | null;
  paymentMethod: string;
  paymentStatus: string;
  orderStatus?: string;
  shippingMethod?: string;
  subtotal: number;
  discountAmount?: number;
  promoCode?: string | null;
  shippingCost?: number;
  totalAmount: number;
  paidNow?: number;
  balanceDue?: number;
  includeOgRolexBox?: boolean;
  rolexBoxPrice?: number;
  items: InvoiceItem[];
}

const esc = (v: unknown) =>
  String(v ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const fmtInr = (n: number) => `₹${(Number(n) || 0).toLocaleString("en-IN")}`;

export function buildInvoiceHtml(data: InvoicePayload): string {
  const origin = typeof window !== "undefined" ? window.location.origin : "https://www.dappersfit.com";
  const watermarkUrl = `${origin}/invoice-watermark.png`;
  const dateStr = new Date(data.createdAt || Date.now()).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  const locationLine = [data.city, data.state, data.pincode].filter(Boolean).join(", ");
  const isCod = data.paymentMethod === "cod" || data.paymentMethod === "cod_advance";
  const paymentModeLabel = isCod
    ? "Cash on Delivery (₹150 COD Prepaid Fee)"
    : "Prepaid Instant UPI";

  const rowsHtml = (data.items || [])
    .map(
      (item, idx) => `
      <tr>
        <td class="mono muted">${idx + 1}</td>
        <td><strong>${esc(item.name)}</strong></td>
        <td class="upper muted">${esc(item.brand || "DappersFit")}</td>
        <td class="center"><strong>${item.quantity}</strong></td>
        <td class="right mono">${fmtInr(item.price)}</td>
        <td class="right mono"><strong>${fmtInr(item.price * item.quantity)}</strong></td>
      </tr>`
    )
    .join("");

  const rolexRow = data.includeOgRolexBox
    ? `<tr>
        <td class="mono muted">+</td>
        <td><strong>Official OG Rolex Presentation Box</strong></td>
        <td class="upper muted">ACCESSORY</td>
        <td class="center"><strong>1</strong></td>
        <td class="right mono">${fmtInr(data.rolexBoxPrice || 499)}</td>
        <td class="right mono"><strong>${fmtInr(data.rolexBoxPrice || 499)}</strong></td>
      </tr>`
    : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>DappersFit Invoice #${esc(data.orderNumber)}</title>
  <style>
    * { box-sizing: border-box; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
    body { margin: 0; padding: 24px; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #111827; background: #fff; }
    .sheet { position: relative; max-width: 780px; margin: 0 auto; padding: 36px; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden; background: #fff; }
    .watermark { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; pointer-events: none; z-index: 0; }
    .watermark img { width: 460px; max-width: 78%; height: auto; opacity: 0.09; object-fit: contain; }
    .content { position: relative; z-index: 1; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #111; padding-bottom: 18px; margin-bottom: 20px; gap: 16px; }
    .brand { font-family: Georgia, serif; font-size: 28px; font-weight: 900; letter-spacing: 0.02em; margin: 0; }
    .sub { font-size: 10px; text-transform: uppercase; letter-spacing: 0.18em; color: #6b7280; font-weight: 700; margin: 4px 0 8px; }
    .meta { font-size: 11px; color: #4b5563; line-height: 1.5; }
    .badge { display: inline-block; background: #111; color: #fff; font-size: 10px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; padding: 5px 10px; border-radius: 5px; }
    .order-meta { margin-top: 10px; font-size: 11px; font-family: ui-monospace, monospace; text-align: right; line-height: 1.6; }
    .grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; background: rgba(249, 250, 251, 0.85); border: 1px solid #e5e7eb; border-radius: 10px; padding: 14px 16px; font-size: 11px; margin-bottom: 20px; }
    .grid2 h4 { margin: 0 0 6px; font-size: 10px; text-transform: uppercase; letter-spacing: 0.1em; color: #6b7280; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; margin-bottom: 22px; background: rgba(255,255,255,0.75); }
    thead th { background: #111; color: #fff; font-size: 10px; text-transform: uppercase; letter-spacing: 0.08em; padding: 9px 10px; text-align: left; }
    tbody td { padding: 10px; border-bottom: 1px solid #e5e7eb; }
    .right { text-align: right; } .center { text-align: center; } .mono { font-family: ui-monospace, monospace; } .upper { text-transform: uppercase; } .muted { color: #6b7280; }
    .bottom { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; align-items: start; }
    .totals { font-size: 12px; font-family: ui-monospace, monospace; }
    .totals .row { display: flex; justify-content: space-between; padding: 4px 0; color: #374151; }
    .totals .grand { border-top: 2px solid #111; margin-top: 6px; padding-top: 8px; font-size: 15px; font-weight: 900; color: #000; }
    .totals .paid { color: #047857; font-weight: 700; }
    .totals .due { color: #b45309; font-weight: 700; }
    .seal { margin-top: 28px; border-top: 1px solid #d1d5db; padding-top: 8px; font-size: 10px; text-transform: uppercase; letter-spacing: 0.1em; color: #6b7280; font-weight: 700; }
    @media print {
      body { padding: 0; }
      .sheet { border: none; border-radius: 0; max-width: 100%; padding: 20px; }
    }
  </style>
</head>
<body>
  <div class="sheet">
    <div class="watermark"><img src="${esc(watermarkUrl)}" alt="" /></div>
    <div class="content">
      <div class="header">
        <div>
          <h1 class="brand">DAPPERSFIT</h1>
          <div class="sub">Haute Horology &amp; Luxury Timepieces</div>
          <div class="meta">
            Web: https://www.dappersfit.com<br/>
            WhatsApp Concierge: +91 93639 03915
          </div>
        </div>
        <div style="text-align:right;">
          <span class="badge">Tax Invoice &amp; Packing Slip</span>
          <div class="order-meta">
            <div><strong>Order #:</strong> ${esc(data.orderNumber)}</div>
            <div><strong>Date:</strong> ${esc(dateStr)}</div>
            <div><strong>Payment:</strong> ${esc(paymentModeLabel)}</div>
            <div><strong>Status:</strong> ${esc((data.orderStatus || "Confirmed").toUpperCase())}</div>
          </div>
        </div>
      </div>

      <div class="grid2">
        <div>
          <h4>Delivery Address (Consignee)</h4>
          <div style="font-size:13px;font-weight:700;color:#111;">${esc(data.customerName)}</div>
          <div style="margin-top:4px;color:#374151;">${esc(data.shippingAddress)}</div>
          ${locationLine ? `<div style="font-weight:600;margin-top:2px;">${esc(locationLine)}</div>` : ""}
          <div style="margin-top:6px;"><strong>Phone:</strong> ${esc(data.customerPhone)}</div>
          ${data.customerEmail ? `<div><strong>Email:</strong> ${esc(data.customerEmail)}</div>` : ""}
        </div>
        <div>
          <h4>Dispatch &amp; Payment Details</h4>
          <div><strong>Shipping:</strong> ${esc((data.shippingMethod || "standard").toUpperCase())} Delivery</div>
          <div style="margin-top:4px;"><strong>Payment Mode:</strong> ${esc(paymentModeLabel)}</div>
          <div style="margin-top:4px;"><strong>Payment Status:</strong> <span class="upper" style="font-weight:700;">${esc(data.paymentStatus)}</span></div>
          <div style="margin-top:8px;color:#6b7280;font-size:10px;">
            Inspected &amp; packed in protective luxury case with tamper-evident seal.
          </div>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Watch Description</th>
            <th>Brand</th>
            <th class="center">Qty</th>
            <th class="right">Unit Price</th>
            <th class="right">Amount</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
          ${rolexRow}
        </tbody>
      </table>

      <div class="bottom">
        <div style="font-size:11px;color:#4b5563;line-height:1.5;">
          <strong style="color:#111;text-transform:uppercase;letter-spacing:0.08em;font-size:10px;">Authenticity &amp; Quality Guarantee</strong>
          <p style="margin:6px 0 0;">This certifies that the timepiece(s) listed above have passed DappersFit multi-point QC inspection for dial finish, movement accuracy, and bezel precision.</p>
          <div class="seal">Authorized DappersFit Quality Seal</div>
        </div>
        <div class="totals">
          <div class="row"><span>Subtotal:</span><span>${fmtInr(data.subtotal)}</span></div>
          ${data.discountAmount && data.discountAmount > 0 ? `<div class="row paid"><span>Discount (${esc(data.promoCode || "Promo")}):</span><span>-${fmtInr(data.discountAmount)}</span></div>` : ""}
          <div class="row"><span>Shipping:</span><span>${!data.shippingCost ? "FREE" : fmtInr(data.shippingCost)}</span></div>
          <div class="row"><span>GST (18%):</span><span>Included</span></div>
          <div class="row grand"><span>Total Amount:</span><span>${fmtInr(data.totalAmount)}</span></div>
          ${typeof data.paidNow === "number" ? `<div class="row paid"><span>Paid via UPI:</span><span>${fmtInr(data.paidNow)}</span></div>` : ""}
          ${typeof data.balanceDue === "number" && data.balanceDue > 0 ? `<div class="row due"><span>Balance Due (COD):</span><span>${fmtInr(data.balanceDue)}</span></div>` : ""}
        </div>
      </div>
    </div>
  </div>
  <script>
    window.onload = function() {
      setTimeout(function() { window.print(); }, 250);
    };
  </script>
</body>
</html>`;
}

export function downloadOrPrintInvoice(data: InvoicePayload): void {
  if (typeof window === "undefined") return;
  const html = buildInvoiceHtml(data);
  const win = window.open("", "_blank", "width=860,height=960");
  if (win) {
    win.document.open();
    win.document.write(html);
    win.document.close();
    return;
  }
  // Fallback if popup blocker prevents window.open: print via hidden iframe
  const iframe = document.createElement("iframe");
  iframe.style.cssText = "position:fixed;right:0;bottom:0;width:0;height:0;border:0;";
  document.body.appendChild(iframe);
  const doc = iframe.contentWindow?.document;
  if (doc) {
    doc.open();
    doc.write(html);
    doc.close();
    setTimeout(() => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
      setTimeout(() => iframe.remove(), 3000);
    }, 300);
  }
}
