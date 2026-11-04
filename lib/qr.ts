import "server-only";
import QRCode from "qrcode";

/** Black-on-transparent SVG QR code. Quartile error correction survives print wear. */
export function qrSvg(text: string) {
  return QRCode.toString(text, {
    type: "svg",
    errorCorrectionLevel: "Q",
    margin: 2,
    color: { dark: "#000000", light: "#0000" },
  });
}
