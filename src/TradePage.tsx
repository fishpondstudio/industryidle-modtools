import { API_HOST } from "./Constants";
import { banIp, getUrlParams, nf } from "./Helper";
import { Page } from "./Page";

export class TradePage extends Page<{ trades: any; ban: any }> {
   constructor() {
      super();
      this.loadData();
   }

   async loadData() {
      const res = await Promise.all([
         fetch(`${API_HOST}/trade?token=${getUrlParams()?.token}`),
         fetch(`${API_HOST}/stat?token=${getUrlParams()?.token}`),
      ]);
      const r = await Promise.all([res[0].json(), res[1].json()]);
      this.setState({ trades: r[0], ban: r[1].hasBan });
   }

   async banTrande(ip: string, time: number) {
      await banIp("banTrade", time, {
         [ip]: 1,
      });
      await this.loadData();
   }

   async deleteTrade(userId: string) {
      if (window.confirm("Are you sure to delete this trade?")) {
         await fetch(`${API_HOST}/trade?token=${getUrlParams()?.token}&userId=${userId}`);
         await this.loadData();
      }
   }

   render() {
      if (!this.state.trades) {
         return;
      }
      return (
         <table>
            <tr>
               <th>Side</th>
               <th>From</th>
               <th>Resource</th>
               <th class="text-right">Amount</th>
               <th class="text-right">Price</th>
               <th class="text-right">Value</th>
               <th class="text-right">Quota</th>
               <th class="text-right">Valuation</th>
               <th class="text-right">Cash</th>
               <th class="text-right">CPS</th>
               <th class="text-right">Building #</th>
               <th class="text-right">Created At</th>
               <th class="text-right">Ban Trade</th>
            </tr>
            {Object.keys(this.state.trades).map((k) => {
               const trade = this.state.trades[k];
               const value = trade.price * trade.amount;
               const valuation = trade.resourceValuation + trade.buildingValuation;
               const quota = (trade.price * trade.amount) / valuation;
               return (
                  <tr>
                     <td>{trade.side}</td>
                     <td>{trade.from}</td>
                     <td>{trade.resource}</td>
                     <td className={trade.amount > 1e12 ? "red text-right" : "text-right"}>
                        {trade.amount} ({nf(trade.amount)})
                     </td>
                     <td className="text-right">
                        {trade.price} ({nf(trade.price)})
                     </td>
                     <td className={value > 1e15 ? "text-right red" : "text-right"}>
                        {value} ({nf(value)})
                     </td>
                     <td className={quota > 0.01 ? "red text-right" : "text-right"}>
                        {Math.round(quota * 100 * 100) / 100}%
                     </td>
                     <td className="text-right">
                        {valuation} ({nf(valuation)})
                     </td>
                     <td className="text-right">
                        {trade.cash} ({nf(trade.cash)})
                     </td>
                     <td className="text-right">
                        {trade.cashPerSec} ({nf(trade.cashPerSec)})
                     </td>
                     <td className="text-right">{trade.buildingCount}</td>
                     <td className="text-right">{Math.round((Date.now() - trade.createdAt) / 100 / 60) / 10}m ago</td>
                     <td className="nowrap text-right">
                        <button onClick={() => navigator.clipboard.writeText(trade.fromUserId)} title={trade.fromIp}>
                           Copy
                        </button>{" "}
                        <button onClick={() => this.banTrande(trade.fromIp, 0)}>0</button>{" "}
                        <button onClick={() => this.banTrande(trade.fromIp, 24 * 60 * 60 * 1000)}>1d</button>{" "}
                        <button onClick={() => this.banTrande(trade.fromIp, 7 * 24 * 60 * 60 * 1000)}>1w</button>{" "}
                        <button onClick={() => this.banTrande(trade.fromIp, 30 * 24 * 60 * 60 * 1000)}>1mo</button>{" "}
                        <button onClick={() => this.deleteTrade(trade.fromUserId)}>Delete</button>
                        <div class="red bold text-right">
                           {this.state?.ban?.[trade.fromIp]?.banTrade
                              ? `${
                                   Math.round((this.state?.ban?.[trade.fromIp]?.banTrade - Date.now()) / 100 / 60) / 10
                                }m Left`
                              : ""}
                        </div>
                     </td>
                  </tr>
               );
            })}
         </table>
      );
   }
}
