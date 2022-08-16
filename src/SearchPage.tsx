import { getUrlParams } from "./Helper";
import { Page } from "./Page";

export class SearchPage extends Page<{ search: string }> {
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
                <button onClick={async () => await search({ platformId: `steam:${this.state.search}` })}>
                    By SteamID
                </button>{" "}
                <button onClick={async () => await search({ userName: this.state.search })}>By Name</button>{" "}
                <button onClick={async () => await search({ lastIp: this.state.search })}>By LastIP</button>
            </div>
        );
    }
}

async function search(params: Record<string, string>) {
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
            window.location.href = `#user?id=${j.docs[0]._id}`;
        } else {
            alert("Not Found!");
        }
    } catch (e) {
        alert(e);
    }
}
