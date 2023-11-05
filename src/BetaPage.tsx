import { format } from "date-fns";
import { ONE_DAY, getUrlParams } from "./Helper";
import { Page } from "./Page";

export class BetaPage extends Page<{
   keys: { key: string; validUntil: number; _id: string; _rev: string }[];
   addKey: string;
}> {
   override async componentDidMount() {
      const r = await fetch(`https://couchdb-de.fishpondstudio.com/cividle_keys/_all_docs?include_docs=true`, {
         headers: {
            Authorization: `Basic ${btoa(getUrlParams()?.couchdb)}`,
            "Content-Type": "application/json",
         },
         method: "get",
      });
      const { rows } = await r.json();
      this.setState({ keys: rows.map((r: any) => r.doc) });
   }

   override render() {
      return (
         <div class="mobile">
            <table>
               <tr>
                  <th>Key</th>
                  <th>Valid Until</th>
                  <th></th>
               </tr>
               <tr>
                  <td>
                     <input
                        value={this.state.addKey}
                        onInput={(e) => this.setState({ addKey: (e.target as HTMLInputElement).value })}
                        type="text"
                        style="width:100%"
                     />
                  </td>
                  <td></td>
                  <td class="text-right">
                     <button
                        onClick={async () => {
                           const r = await fetch(`https://couchdb-de.fishpondstudio.com/cividle_keys`, {
                              headers: {
                                 Authorization: `Basic ${btoa(getUrlParams()?.couchdb)}`,
                                 "Content-Type": "application/json",
                              },
                              body: JSON.stringify({ key: this.state.addKey, validUntil: Date.now() + 7 * ONE_DAY }),
                              method: "post",
                           });
                           if (r.status < 300) {
                              this.componentDidMount();
                              this.setState({ addKey: "" });
                           } else {
                              alert(r.status + " " + r.statusText);
                           }
                        }}
                     >
                        Add
                     </button>
                  </td>
               </tr>
               {this.state.keys?.map((k) => {
                  const addDays = async (n: number) => {
                     k.validUntil = Date.now() + n * ONE_DAY;
                     const r = await fetch(`https://couchdb-de.fishpondstudio.com/cividle_keys/${k._id}`, {
                        headers: {
                           Authorization: `Basic ${btoa(getUrlParams()?.couchdb)}`,
                           "Content-Type": "application/json",
                        },
                        body: JSON.stringify(k),
                        method: "put",
                     });
                     if (r.status < 300) {
                        this.componentDidMount();
                     } else {
                        alert(r.status + " " + r.statusText);
                     }
                  };

                  return (
                     <tr>
                        <td>
                           <a href={"https://cividle.com/alpha.html?key=" + k._id}>{k.key}</a>
                        </td>
                        <td>{format(k.validUntil, "M.d H.m")}</td>
                        <td class="text-right">
                           <button
                              onClick={() => {
                                 addDays(3);
                                 navigator.clipboard.writeText(
                                    `Hi, Thanks for signing up for CivIdle playtest. Here's your key: https://cividle.com/alpha.html?key=${k._id} The link will expire in 3 days - you need to redeem your key before that!`
                                 );
                              }}
                           >
                              Copy
                           </button>{" "}
                           <button onClick={addDays.bind(null, 7)}>+7d</button>{" "}
                           <button
                              onClick={async () => {
                                 const r = await fetch(
                                    `https://couchdb-de.fishpondstudio.com/cividle_keys/${k._id}?rev=${k._rev}`,
                                    {
                                       headers: {
                                          Authorization: `Basic ${btoa(getUrlParams()?.couchdb)}`,
                                          "Content-Type": "application/json",
                                       },
                                       method: "delete",
                                    }
                                 );
                                 if (r.status < 300) {
                                    this.componentDidMount();
                                 } else {
                                    alert(r.status + " " + r.statusText);
                                 }
                              }}
                           >
                              Del
                           </button>
                        </td>
                     </tr>
                  );
               })}
            </table>
         </div>
      );
   }
}
