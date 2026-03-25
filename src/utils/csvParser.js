import { parse } from "csv-parse/sync";

export const parseZerodhaCSV = (buffer) => {
  const records = parse(buffer, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });

  return records.map((row) => {
    const quantity = parseFloat(row["Qty."] || row["Quantity"] || 0);
    const avgPrice = parseFloat(row["Avg. cost"] || row["Average Price"] || 0);
    const currentPrice = parseFloat(row["LTP"] || row["Last Price"] || 0);
    const marketValue = quantity * currentPrice;
    const pnl = (currentPrice - avgPrice) * quantity;

    return {
      symbol: (row["Instrument"] || row["Symbol"] || "").trim(),
      quantity,
      avgPrice,
      currentPrice,
      marketValue,
      pnl,
      source: "zerodha",
    };
  }).filter((h) => h.symbol && h.quantity > 0);
};