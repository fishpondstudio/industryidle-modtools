import { Component } from "preact";
import { getUrlParams, nf } from "./helper";

const API_HOST = "https://api.fishpondstudio.com";
// const API_HOST = "http://localhost:5000";

export class App extends Component<
    {},
    {
        chats: any;
        trades: any;
        config: string;
    }
> {
    constructor() {
        super();
        this.loadData();
    }

    loadData = () => {
        fetch(`${API_HOST}/stat?token=${getUrlParams()?.token}`)
            .then((r) => r.json())
            .then((j) => {
                this.setState({ chats: j });
            });
        fetch(`${API_HOST}/trade?token=${getUrlParams()?.token}`)
            .then((r) => r.json())
            .then((j) => {
                this.setState({ trades: j });
            })
            .catch(() => {
                this.setState({ trades: {} });
            });

        fetch(`${API_HOST}/config?token=${getUrlParams()?.token}`)
            .then((r) => {
                if (r.status === 200) {
                    return r.text();
                } else {
                    throw new Error(r.status + " " + r.statusText);
                }
            })
            .then((j) => {
                this.setState({ config: j });
            });
    };

    ban = (type: "banChat" | "banTrade", time: number, ip: Record<string, number>) => {
        Promise.all(
            Object.keys(ip).map((ip) =>
                fetch(`${API_HOST}/stat?token=${getUrlParams()?.token}&ip=${ip}&${type}=${time}&update`)
            )
        ).then(this.loadData);
    };

    deleteTrade = (userId: string) => {
        if (window.confirm("Are you sure to delete this trade?")) {
            fetch(`${API_HOST}/trade?token=${getUrlParams()?.token}&userId=${userId}`).then(this.loadData);
        }
    };

    render() {
        if (!this.state.chats || !this.state.trades) {
            return;
        }
        const hasChat = this.state.chats.hasChat;
        const hasBan = this.state.chats.hasBan;
        const trades = this.state.trades;
        let config;
        if (this.state.config) {
            config = (
                <>
                    <a target="_blank" href={`${API_HOST}/config-live?token=${getUrlParams()?.token}`}>
                        Live Config
                    </a>
                    <textarea
                        class="edit-config"
                        onBlur={(e) => {
                            const value = (e.target as HTMLTextAreaElement).value.replaceAll("\n", "\r\n");
                            if (this.state.config !== value && confirm("Save your edit?")) {
                                fetch(`${API_HOST}/config?token=${getUrlParams()?.token}`, {
                                    method: "post",
                                    body: value,
                                    headers: { "Content-Type": "text/plain" },
                                })
                                    .then(() => {
                                        this.setState({ config: value });
                                        alert("Saved!");
                                    })
                                    .catch(() =>
                                        this.setState({
                                            config: this.state.config,
                                        })
                                    );
                            } else {
                                this.setState({
                                    config: this.state.config,
                                });
                            }
                        }}
                    >
                        {this.state.config}
                    </textarea>
                </>
            );
        }
        return (
            <>
                {config}
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
                    {Object.keys(trades).map((k) => {
                        const trade = trades[k];
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
                                <td className="text-right">
                                    {Math.round((Date.now() - trade.createdAt) / 100 / 60) / 10}m ago
                                </td>
                                <td className="nowrap text-right">
                                    <button
                                        onClick={() => navigator.clipboard.writeText(trade.fromUserId)}
                                        title={trade.fromIp}
                                    >
                                        Copy
                                    </button>{" "}
                                    <button
                                        onClick={this.ban.bind(this, "banTrade", 0, {
                                            [trade.fromIp]: 1,
                                        })}
                                    >
                                        0
                                    </button>{" "}
                                    <button
                                        onClick={this.ban.bind(this, "banTrade", 24 * 60 * 60 * 1000, {
                                            [trade.fromIp]: 1,
                                        })}
                                    >
                                        1d
                                    </button>{" "}
                                    <button
                                        onClick={this.ban.bind(this, "banTrade", 7 * 24 * 60 * 60 * 1000, {
                                            [trade.fromIp]: 1,
                                        })}
                                    >
                                        1w
                                    </button>{" "}
                                    <button
                                        onClick={this.ban.bind(this, "banTrade", 30 * 24 * 60 * 60 * 1000, {
                                            [trade.fromIp]: 1,
                                        })}
                                    >
                                        1mo
                                    </button>{" "}
                                    <button onClick={this.deleteTrade.bind(this, trade.fromUserId)}>Delete</button>
                                    <div class="red bold text-right">
                                        {hasBan?.[trade.fromUserId]?.banTrade
                                            ? `${
                                                  Math.round(
                                                      (hasBan?.[trade.fromUserId]?.banTrade - Date.now()) / 100 / 60
                                                  ) / 10
                                              }m Left`
                                            : ""}
                                    </div>
                                </td>
                            </tr>
                        );
                    })}
                </table>
                <table>
                    <tr>
                        <th></th>
                        <th>Name</th>
                        <th>Time</th>
                        <th>Content</th>
                        <th class="text-right">Ban Chat</th>
                    </tr>
                    {Object.keys(hasChat).map((k) => {
                        return (
                            <tr>
                                <td class="text-right">
                                    [{hasChat[k].message.flag.toUpperCase()}]{hasChat[k].message.dlc ? "[DLC]" : ""}
                                </td>
                                <td>{hasChat[k].message.user}</td>
                                <td>{new Date(hasChat[k].message.time).toLocaleString()}</td>
                                <td>{hasChat[k].message.message}</td>
                                <td class="nowrap text-right">
                                    <button onClick={this.ban.bind(this, "banChat", 0, hasChat[k].ip)}>0m</button>{" "}
                                    <button onClick={this.ban.bind(this, "banChat", 5 * 60 * 1000, hasChat[k].ip)}>
                                        5m
                                    </button>{" "}
                                    <button onClick={this.ban.bind(this, "banChat", 30 * 60 * 1000, hasChat[k].ip)}>
                                        30m
                                    </button>{" "}
                                    <button
                                        onClick={this.ban.bind(this, "banChat", 24 * 60 * 60 * 1000, hasChat[k].ip)}
                                    >
                                        24h
                                    </button>
                                    <div class="red bold">
                                        {hasBan?.[k]?.banChat
                                            ? `${Math.round((hasBan?.[k]?.banChat - Date.now()) / 100 / 60) / 10}m Left`
                                            : ""}
                                    </div>
                                </td>
                            </tr>
                        );
                    })}
                </table>
            </>
        );
    }
}
