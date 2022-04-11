import { API_HOST } from "./Constants";
import { getUrlParams, nf } from "./Helper";
import { Page } from "./Page";

export class UserPage extends Page<{ entries: any[]; user: any; trades: any[] }> {
    override async componentDidMount() {
        const r = await Promise.all([
            fetch(`https://couchdb-de.fishpondstudio.com/industryidle_anticheat/_find`, {
                headers: {
                    Authorization: `Basic ${btoa(getUrlParams()?.couchdb)}`,
                    "Content-Type": "application/json",
                },
                method: "post",
                body: JSON.stringify({
                    selector: {
                        userId: this.props.params.id,
                    },
                    limit: 999,
                }),
            }),
            fetch(`https://couchdb-de.fishpondstudio.com/industryidle_ticks/${this.props.params.id}`, {
                headers: {
                    Authorization: `Basic ${btoa(getUrlParams()?.couchdb)}`,
                    "Content-Type": "application/json",
                },
                method: "get",
            }),
        ]);
        const user = await r[1].json();
        this.setState({
            entries: (await r[0].json()).docs.sort((a: any, b: any) => b.createdAt - a.createdAt),
            user: user,
        });
        const t = await Promise.all([
            fetch(`https://couchdb-de.fishpondstudio.com/industryidle_tradelog/_find`, {
                headers: {
                    Authorization: `Basic ${btoa(getUrlParams()?.couchdb)}`,
                    "Content-Type": "application/json",
                },
                method: "post",
                body: JSON.stringify({
                    selector: {
                        fillIp: user.lastIp,
                    },
                    limit: 999,
                }),
            }),
            fetch(`https://couchdb-de.fishpondstudio.com/industryidle_tradelog/_find`, {
                headers: {
                    Authorization: `Basic ${btoa(getUrlParams()?.couchdb)}`,
                    "Content-Type": "application/json",
                },
                method: "post",
                body: JSON.stringify({
                    selector: {
                        fromIp: user.lastIp,
                    },
                    limit: 999,
                }),
            }),
        ]);
        this.setState({
            trades: (await t[0].json()).docs.concat((await t[1].json()).docs).sort((a: any, b: any) => {
                return b.closedAt - a.closedAt;
            }),
        });
    }

    render() {
        if (!this.state.entries || !this.state.user) {
            return null;
        }
        let steamButton = null;
        if (this.state.user?.platformId?.startsWith?.("steam:")) {
            const steamId = this.state.user.platformId.split(":")[1];
            steamButton = (
                <>
                    <button
                        onClick={() => {
                            window.open(
                                `https://api.fishpondstudio.com/steam/steamid-trusted?steamid=${steamId}`,
                                "_blank"
                            );
                        }}
                    >
                        {steamId}
                    </button>
                </>
            );
        }
        let trades = <></>;
        if (this.state.trades) {
            trades = (
                <table class="mt10">
                    <tr>
                        <th>Side</th>
                        <th>Res</th>
                        <th>Value</th>
                        <th>From</th>
                        <th>Fill By</th>
                        <th>Closed At</th>
                    </tr>
                    {this.state.trades.map((trade) => {
                        return (
                            <tr>
                                <td>
                                    <div class={trade.side === "buy" ? "green bold" : "red bold"}>
                                        {trade.side.toUpperCase()}
                                    </div>
                                    <code>{trade.status.substring(0, 3).toUpperCase()}</code>
                                </td>
                                <td>{trade.resource}</td>
                                <td>
                                    {nf(trade.price * trade.amount)}
                                    <br />
                                    <code>
                                        ${nf(trade.price)}x{nf(trade.amount)}
                                    </code>
                                </td>
                                <td class={trade.fromIp === this.state.user.lastIp ? "red" : ""}>
                                    {trade.from}
                                    <br />
                                    <code>{trade.fromIp}</code>
                                </td>
                                <td class={trade.fillIp === this.state.user.lastIp ? "red" : ""}>
                                    {trade.fillBy}
                                    <br />
                                    <code>{trade.fillIp}</code>
                                </td>
                                <td>
                                    <code>{new Date(trade.closedAt).toLocaleString()}</code>
                                </td>
                            </tr>
                        );
                    })}
                </table>
            );
        }
        return (
            <div className="mobile">
                <div class="mb10 bold">
                    {this.state.user.userName} ({this.state.user.dlc}xDLC)
                </div>
                <div class="buttons">
                    <button
                        onClick={() => {
                            optInOrOut(this.state.user, true).then((r) => {
                                alert(r.map((v) => `${v.status} ${v.statusText}`).join(", "));
                            });
                        }}
                        disabled={this.state.user.optOut}
                    >
                        Opt Out
                    </button>
                    <button
                        onClick={() => {
                            optInOrOut(this.state.user, false).then((r) => {
                                alert(r.map((v) => `${v.status} ${v.statusText}`).join(", "));
                            });
                        }}
                        disabled={!this.state.user.optOut}
                    >
                        Opt In
                    </button>
                    <button
                        onClick={() => {
                            window.open(`https://iplocation.io/ip/${this.state.user.lastIp}`, "_blank");
                        }}
                    >
                        {this.state.user.lastIp}
                    </button>
                    {steamButton}
                    <button
                        onClick={() => {
                            window.open(
                                `https://api.fishpondstudio.com/trade-token?userId=${this.props.params.id}&token=${
                                    getUrlParams()?.token
                                }`,
                                "_blank"
                            );
                        }}
                    >
                        Trade Token
                    </button>
                    <button
                        onClick={() => {
                            window.open(
                                `https://couchdb-de.fishpondstudio.com/_utils/#database/industryidle_ticks/${this.props.params.id}`,
                                "_blank"
                            );
                        }}
                    >
                        CouchDB
                    </button>
                </div>
                <table>
                    {this.state.entries.map((entry) => {
                        return (
                            <>
                                <tr>
                                    <th colSpan={4}>{new Date(entry.createdAt).toLocaleString()}</th>
                                </tr>
                                {Object.keys(entry.after.res).map((res) =>
                                    diffRow(res, entry.before.res[res], entry.after.res[res])
                                )}
                                {diffRow(
                                    "Valuation",
                                    entry.before.resourceValuation + entry.before.buildingValuation,
                                    entry.after.resourceValuation + entry.after.buildingValuation
                                )}
                                {diffRow(
                                    "Swiss",
                                    entry.before.allPrestigeCurrency + entry.before.allPrestigeCurrency,
                                    entry.after.allPrestigeCurrency + entry.after.allPrestigeCurrency
                                )}
                            </>
                        );
                    })}
                </table>
                {trades}
                <pre>{JSON.stringify(this.state.user, null, 4)}</pre>
            </div>
        );
    }
}

function diffRow(label: string, before: number, after: number) {
    const delta = before ? Math.round((100 * (after - before)) / before) : 0;
    if (Math.abs(delta) <= 5 || before <= 1e6) {
        return;
    }
    return (
        <tr>
            <td>{label}</td>
            <td title={String(before)}>{nf(before)}</td>
            <td title={String(after)}>{nf(after)}</td>
            <td class={Math.abs(delta) >= 50 ? "red" : ""}>{delta}%</td>
        </tr>
    );
}

function optInOrOut(userInfo: any, optOut: boolean) {
    userInfo.optOut = optOut;
    const userId = userInfo._id;
    return Promise.all([
        fetch(`https://couchdb-de.fishpondstudio.com/industryidle_ticks/${userId}`, {
            headers: {
                Authorization: `Basic ${btoa(getUrlParams()?.couchdb)}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(userInfo),
            method: "put",
        }),
        fetch(`${API_HOST}/opt-${optOut ? "out" : "in"}?token=${getUrlParams()?.token}&userId=${userId}`),
    ]);
}
