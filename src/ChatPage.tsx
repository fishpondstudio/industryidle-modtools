import { API_HOST } from "./Constants";
import { banIp, getUrlParams } from "./Helper";
import { Page } from "./Page";

export class ChatPage extends Page<{ chats: any }> {
   constructor() {
      super();
      this.loadData();
   }

   async loadData() {
      const r = await fetch(`${API_HOST}/stat?token=${getUrlParams()?.token}`);
      const j = await r.json();
      this.setState({ chats: j });
   }

   async banChat(ip: Record<string, number>, time: number) {
      await banIp("banChat", time, ip);
      await this.loadData();
   }

   render() {
      if (!this.state.chats) {
         return;
      }
      const hasChat = this.state.chats.hasChat;
      const hasBan = this.state.chats.hasBan;

      function getBanChat(ips: Record<string, number>): number {
         let result = 0;
         Object.keys(ips).forEach((k) => {
            if (hasBan[k] && hasBan[k].banChat > 0) {
               result = hasBan[k].banChat;
            }
         });
         return result;
      }

      return (
         <table>
            <tr>
               <th></th>
               <th>Name</th>
               <th>Time</th>
               <th>Content</th>
               <th class="text-right">Ban Chat</th>
            </tr>
            {Object.keys(hasChat).map((k) => {
               const banChat = getBanChat(hasChat[k].ip);
               return (
                  <tr>
                     <td class="text-right">
                        [{hasChat[k].message.flag.toUpperCase()}]{hasChat[k].message.dlc ? "[DLC]" : ""}
                     </td>
                     <td>
                        <a href={"#user?id=" + k}>{hasChat[k].message.user}</a>
                     </td>
                     <td>{new Date(hasChat[k].message.time).toLocaleString()}</td>
                     <td>{hasChat[k].message.message}</td>
                     <td class="nowrap text-right">
                        <button onClick={() => this.banChat(hasChat[k].ip, 0)}>0m</button>{" "}
                        <button onClick={() => this.banChat(hasChat[k].ip, 5 * 60 * 1000)}>5m</button>{" "}
                        <button onClick={() => this.banChat(hasChat[k].ip, 30 * 60 * 1000)}>30m</button>{" "}
                        <button onClick={() => this.banChat(hasChat[k].ip, 24 * 60 * 60 * 1000)}>24h</button>{" "}
                        <button onClick={() => this.banChat(hasChat[k].ip, 30 * 24 * 60 * 60 * 1000)}>30d</button>
                        <div class="red bold">
                           {banChat > 0 ? `${Math.round((banChat - Date.now()) / 100 / 60) / 10}m Left` : ""}
                        </div>
                     </td>
                  </tr>
               );
            })}
         </table>
      );
   }
}
