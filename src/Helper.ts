import { API_HOST } from "./Constants";

export function getUrlParams(): Record<string, string> {
   const query = location.search.substr(1);
   const result: Record<string, string> = {};
   query.split("&").forEach((part) => {
      const item = part.split("=");
      result[item[0]] = decodeURIComponent(item[1]);
   });
   return result;
}

export const ONE_DAY = 24 * 60 * 60 * 1000;
export const ONE_HOUR = 60 * 60 * 1000;
export const ONE_MINUTE = 60 * 1000;

// prettier-ignore
const NUMBER_SUFFIX_1 = ["", "K", "M", "B", "T", "Qa", "Qt", "Sx", "Sp", "Oc", "Nn", "Dc", "UDc", "DDc", "TDc", "QaDc", "QtDc", "SxDc", "SpDc", "ODc",
    "NDc", "Vi", "UVi", "DVi", "TVi", "QaVi", "QtVi", "SxVi", "SpVi", "OcVi", "NnVi", "Tg", "UTg", "DTg", "TTg", "QaTg", "QtTg", "SxTg", "SpTg", "OcTg",
    "NnTg", "Qd", "UQd", "DQd", "TQd", "QaQd", "QtQd", "SxQd", "SpQd", "OcQd", "NnQd", "Qq", "UQq", "DQq", "TQq", "QaQq", "QtQq", "SxQq", "SpQq", "OcQq",
    "NnQq", "Sg"];

export function nf(num: number, point = 2): string {
   if (!isFinite(num)) {
      return "∞";
   }
   let idx = 0;
   while (Math.abs(num) >= 1000) {
      num /= 1000;
      idx++;
   }
   num = Math.round(num * Math.pow(10, point)) / Math.pow(10, point);
   if (idx < NUMBER_SUFFIX_1.length) {
      return num.toLocaleString() + NUMBER_SUFFIX_1[idx];
   }
   return num.toLocaleString() + "E" + idx;
}

export function banIp(type: "banChat" | "banTrade", time: number, ip: Record<string, number>): Promise<Response[]> {
   return Promise.all(
      Object.keys(ip).map((ip) =>
         fetch(`${API_HOST}/stat?token=${getUrlParams()?.token}&ip=${ip}&${type}=${time}&update`)
      )
   );
}

export function safeAdd<T extends string>(obj: Partial<Record<T, number>>, key: T, valueToAdd: number): void {
   if (!obj[key]) {
      obj[key] = 0;
   }
   obj[key]! += valueToAdd;
}

export function safePush<T extends string, K>(obj: Partial<Record<T, K[]>>, key: T, valueToPush: K): void {
   if (!obj[key]) {
      obj[key] = [];
   }
   obj[key]!.push(valueToPush);
}
