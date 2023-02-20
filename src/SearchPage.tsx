import { getUrlParams } from "./Helper";
import { Page } from "./Page";

export class SearchPage extends Page<{ search: string; result: any[] }> {
    constructor() {
        super();
        this.state = { result: [], search: "" };
    }
    render() {
        return (
            <div className="mobile">
                <input
                    type="text"
                    style={{ width: "100%", fontSize: "20px" }}
                    onInput={(e) => {
                        this.setState({ search: (e.target as HTMLInputElement).value });
                    }}
                />
                <br />
                <br />
                <button onClick={async () => await this.search({ platformId: `steam:${this.state.search}` })}>
                    By SteamID
                </button>{" "}
                <button onClick={async () => await this.search({ userName: this.state.search })}>By Name</button>{" "}
                <button onClick={async () => await this.search({ lastIp: this.state.search })}>By LastIP</button>
                <br />
                <br />
                {this.state.result.map((f) => {
                    return (
                        <a key={f._id} href={`#user?id=${f._id}`}>
                            {f.userName} / {f.platformId} / {f.lastIp}
                        </a>
                    );
                })}
            </div>
        );
    }

    async search(params: Record<string, string>) {
        try {
            const resp = await fetch(`https://couchdb-de.fishpondstudio.com/industryidle_ticks/_find`, {
                headers: {
                    Authorization: `Basic ${btoa(getUrlParams()?.couchdb)}`,
                    "Content-Type": "application/json",
                },
                method: "post",
                body: JSON.stringify({
                    selector: params,
                    limit: 1,
                    sort: [{ updatedAt: "desc" }],
                }),
            });
            if (resp.status != 200) {
                throw new Error(`${resp.status} ${resp.statusText}`);
            }
            var j = await resp.json();
            if (j.docs.length > 0) {
                this.setState({ result: j.docs });
            } else {
                throw new Error("Not found!");
            }
        } catch (e) {
            alert(e);
        }
    }
}
