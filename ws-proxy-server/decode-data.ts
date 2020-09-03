/**
 * ArrayBuffer 数据解码，比如存在协商的加密格式数据。此处仅为示例
 */
export function getDecodedData(buf: ArrayBuffer) {
  if (buf instanceof Buffer) return buf.toString();
  return buf;
}
