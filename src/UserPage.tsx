import { ComponentChildren } from "preact";
import { API_HOST } from "./Constants";
import { getUrlParams, nf } from "./Helper";
import { Page } from "./Page";

export class UserPage extends Page<{ entries: any[]; user: any; trades: any[]; platformIdBan: string }> {
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
            fetch(`https://couchdb-de.fishpondstudio.com/industryidle_trades/_find`, {
                headers: {
                    Authorization: `Basic ${btoa(getUrlParams()?.couchdb)}`,
                    "Content-Type": "application/json",
                },
                method: "post",
                body: JSON.stringify({
                    selector: {
                        fromUserId: this.props.params.id,
                        status: "closed",
                    },
                    limit: 999,
                }),
            }),
            fetch(`https://couchdb-de.fishpondstudio.com/industryidle_trades/_find`, {
                headers: {
                    Authorization: `Basic ${btoa(getUrlParams()?.couchdb)}`,
                    "Content-Type": "application/json",
                },
                method: "post",
                body: JSON.stringify({
                    selector: {
                        fillUserId: this.props.params.id,
                        status: "filled",
                    },
                    limit: 999,
                }),
            }),
        ]);
        let user = await r[1].json();
        const snapshots = (await r[0].json()).docs.sort((a: any, b: any) => b.createdAt - a.createdAt);
        // If user is not loaded, show latest snapshot
        if (user.error) {
            user = snapshots[0].after;
        }
        this.setState({
            entries: snapshots,
            user: user,
            trades: (await r[2].json()).docs.concat((await r[3].json()).docs).sort((a: any, b: any) => {
                return b.timestamp - a.timestamp;
            }),
        });
        if (user.platformId) {
            fetch(
                `${API_HOST}/platform-ban?token=${getUrlParams()?.token}&platformId=${encodeURIComponent(
                    user.platformId
                )}`
            )
                .then((r) => r.json())
                .then((v) => {
                    this.setState({ platformIdBan: v[user.platformId] });
                });
        }
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
                            window.open(`${API_HOST}/steam/steamid-trusted?steamid=${steamId}`, "_blank");
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
                        <th>Timestamp</th>
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
                                <td class={trade.fromUserId === this.props.params.id ? "red" : ""}>
                                    <UserLink id={trade.fromUserId}>{trade.from}</UserLink>
                                    <br />
                                    <code>{trade.fromIp}</code>
                                </td>
                                <td class={trade.fillUserId === this.props.params.id ? "red" : ""}>
                                    <UserLink id={trade.fillUserId}>{trade.fillBy}</UserLink>
                                    <br />
                                    <code>{trade.fillIp}</code>
                                </td>
                                <td>
                                    <code>{new Date(trade.timestamp).toLocaleString()}</code>
                                </td>
                            </tr>
                        );
                    })}
                </table>
            );
        }
        const ipAddress = this.state.user.lastIp ?? this.state.entries[0].ip;
        return (
            <div className="mobile">
                <div class="mb10 bold">
                    {this.state.user.userName} ({this.state.user.dlc}xDLC)
                </div>
                <div class="buttons">
                    <button
                        onClick={() => {
                            window.open(`https://iplocation.io/ip/${ipAddress}`, "_blank");
                        }}
                    >
                        {ipAddress}
                    </button>
                    {steamButton}
                    <button
                        onClick={() => {
                            window.open(
                                `${API_HOST}/trade-token?userId=${this.props.params.id}&token=${getUrlParams()?.token}`,
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
                        onClick={() => this.platformIdBan(true)}
                        disabled={!this.state.user.platformId || this.state.platformIdBan?.startsWith("!")}
                    >
                        Ban Platform Id
                    </button>
                    <button
                        onClick={() => this.platformIdBan(false)}
                        disabled={!this.state.user.platformId || !this.state.platformIdBan?.startsWith("!")}
                    >
                        Unban Platform Id
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

    private platformIdBan(ban: boolean) {
        fetch(
            `${API_HOST}/platform-ban?token=${getUrlParams()?.token}&platformId=${encodeURIComponent(
                this.state.user.platformId
            )}&comment=${encodeURIComponent(
                `${ban ? "!" : "~"}${this.state.user.userName}:${this.state.user.lastIp}`
            )}`,
            { method: "post" }
        ).then((r) => alert(`${r.status} ${r.statusText}`));
    }
}

interface UserLinkProps {
    id: string | null;
    children: ComponentChildren;
}

function UserLink({ id, children }: UserLinkProps) {
    if (!id) {
        return <>{children}</>;
    }
    return <a href={"#user?id=" + id}>{children}</a>;
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
