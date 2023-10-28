import { getUrlParams } from "./Helper";
import { Page } from "./Page";

export class BetaPage extends Page<{}> {
   override async componentDidMount() {
      const r = await fetch(`https://couchdb-de.fishpondstudio.com/cividle_keys`, {
         headers: {
            Authorization: `Basic ${btoa(getUrlParams()?.couchdb)}`,
            "Content-Type": "application/json",
         },
         method: "get",
      });
      const json = await r.json();
      console.log(json);
   }

   override render() {
      return <></>;
   }
}
