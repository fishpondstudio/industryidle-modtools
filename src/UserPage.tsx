import { ComponentChildren } from "preact";
import { API_HOST } from "./Constants";
import { getUrlParams, nf, safePush } from "./Helper";
import { Page } from "./Page";

interface ITransaction {
    price: number;
    amount: number;
}

interface ITradeSum {
    accumulated: Record<string, ITransaction[]>;
    trades: any[];
    name: string;
    profit: number;
}

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
        const tradeSums: Record<string, ITradeSum> = {};
        if (this.state.trades) {
            this.state.trades.forEach((t) => {
                if (t.status !== "filled") {
                    return;
                }
                if (t.fromUserId === this.props.params.id) {
                    if (!tradeSums[t.fillUserId]) {
                        tradeSums[t.fillUserId] = { accumulated: {}, name: t.fillBy, trades: [], profit: 0 };
                    }
                    tradeSums[t.fillUserId].trades.push(t);
                    if (t.side === "buy") {
                        safePush(tradeSums[t.fillUserId].accumulated, t.resource, {
                            price: t.price,
                            amount: -t.amount,
                        });
                    } else {
                        safePush(tradeSums[t.fillUserId].accumulated, t.resource, { price: t.price, amount: t.amount });
                    }
                }
                if (t.fillUserId === this.props.params.id) {
                    if (!tradeSums[t.fromUserId]) {
                        tradeSums[t.fromUserId] = { accumulated: {}, name: t.from, trades: [], profit: 0 };
                    }
                    tradeSums[t.fromUserId].trades.push(t);
                    if (t.side === "buy") {
                        safePush(tradeSums[t.fromUserId].accumulated, t.resource, { price: t.price, amount: t.amount });
                    } else {
                        safePush(tradeSums[t.fromUserId].accumulated, t.resource, {
                            price: t.price,
                            amount: -t.amount,
                        });
                    }
                }
            });
            for (const id in tradeSums) {
                const element = tradeSums[id];
                for (const res in element.accumulated) {
                    const trades = element.accumulated[res];
                    let totalAmountBought = 0;
                    let totalValueBought = 0;
                    let totalAmountSold = 0;
                    let totalValueSold = 0;
                    trades.forEach((t) => {
                        if (t.amount > 0) {
                            totalAmountBought += t.amount;
                            totalValueBought += t.amount * t.price;
                        }
                        if (t.amount < 0) {
                            totalAmountSold -= t.amount;
                            totalValueSold -= t.amount * t.price;
                        }
                    });
                    const averagePriceBought = totalAmountBought > 0 ? totalValueBought / totalAmountBought : 0;
                    const averagePriceSold = totalAmountSold > 0 ? totalValueSold / totalAmountSold : 0;
                    const netPosition = totalAmountBought - totalAmountSold;
                    if (averagePriceBought <= 0 || averagePriceSold <= 0) {
                        continue;
                    }
                    // Bought stuff, but at a lower price
                    if (netPosition > 0 && averagePriceBought < averagePriceSold) {
                        element.profit += Math.abs((averagePriceSold - averagePriceBought) * netPosition);
                    }
                    // Bought stuff, but at a higher price
                    if (netPosition > 0 && averagePriceBought > averagePriceSold) {
                        element.profit -= Math.abs((averagePriceSold - averagePriceBought) * netPosition);
                    }
                    // Sold stuff, but at a higher price
                    if (netPosition < 0 && averagePriceSold > averagePriceBought) {
                        element.profit += Math.abs((averagePriceSold - averagePriceBought) * netPosition);
                    }
                    // Sold stuff, but at a lower price
                    if (netPosition < 0 && averagePriceSold < averagePriceBought) {
                        element.profit -= Math.abs((averagePriceSold - averagePriceBought) * netPosition);
                    }
                }
                if (element.profit === 0) {
                    delete tradeSums[id];
                }
            }
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
                <table class="mt10">
                    <tr>
                        <th>Name</th>
                        <th colSpan={2}>Profit</th>
                        <th>Trade #</th>
                        <th></th>
                    </tr>
                    {Object.keys(tradeSums).map((id) => {
                        const sum = tradeSums[id];
                        return (
                            <tr key={id}>
                                <td>
                                    <UserLink id={id}>{sum.name}</UserLink>
                                </td>
                                <td>
                                    {nf(sum.profit)}
                                    <br />
                                </td>
                                <td>{sum.profit}</td>
                                <td>{sum.trades.length}</td>
                                <td>
                                    <button
                                        onClick={async () => {
                                            const resp = await fetch(
                                                `https://couchdb-de.fishpondstudio.com/industryidle_ticks/${id}`,
                                                {
                                                    headers: {
                                                        Authorization: `Basic ${btoa(getUrlParams()?.couchdb)}`,
                                                        "Content-Type": "application/json",
                                                    },
                                                    method: "get",
                                                }
                                            );
                                            const json = await resp.json();
                                            if (typeof json.platformId === "string" && json.platformId.length > 0) {
                                                const resp = await fetch(
                                                    `${API_HOST}/trade-fine?token=${getUrlParams()?.token}`,
                                                    {
                                                        method: "post",
                                                        headers: {
                                                            "Content-Type": "application/json",
                                                        },
                                                        body: JSON.stringify({
                                                            platformId: json.platformId,
                                                            playerName: this.state.user.userName,
                                                            numberOfTrades: sum.trades.length,
                                                            profit: sum.profit,
                                                        }),
                                                    }
                                                );
                                                alert(resp.status + " " + resp.statusText);
                                            } else {
                                                alert("PlatformId is not valid");
                                            }
                                        }}
                                    >
                                        Fine
                                    </button>
                                </td>
                            </tr>
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
