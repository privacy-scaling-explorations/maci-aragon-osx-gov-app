import { type BigNumberish } from "ethers";

export function unixTimestampToDate(timestamp: BigNumberish) {
  return new Date(Number(timestamp) * 1000).toLocaleString(undefined, {
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
