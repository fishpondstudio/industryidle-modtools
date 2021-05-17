import { Component } from "preact";
import { getUrlParams } from "./helper";

export class App extends Component<{}, { data: any }> {
    constructor() {
        super();
        this.loadData();
    }

    loadData = () => {
        fetch(`https://api.fishpondstudio.com/stat?token=${getUrlParams()?.token}`)
            .then((r) => r.json())
            .then((j) => {
                this.setState({ data: j });
            });
    };

    ban = (type: "banChat" | "banTrade", time: number, ip: Record<string, number>) => {
        Promise.all(
            Object.keys(ip).map((ip) =>
                fetch(
                    `https://api.fishpondstudio.com/stat?token=${getUrlParams()?.token}&ip=${ip}&${type}=${time}&update`
                )
            )
        ).then(this.loadData);
    };

    render() {
        if (!this.state.data) {
            return;
        }
        const hasChat = this.state.data.hasChat;
        const hasBan = this.state.data.hasBan;
        return (
            <table>
                <tr>
                    <th></th>
                    <th>Name</th>
                    <th>Time</th>
                    <th>Content</th>
                    <th class="text-center">Ban Chat</th>
                    <th class="text-center">Ban Trade</th>
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
                            <td class="nowrap text-center">
                                <button onClick={this.ban.bind(this, "banChat", 0, hasChat[k].ip)}>0m</button>{" "}
                                <button onClick={this.ban.bind(this, "banChat", 5 * 60 * 1000, hasChat[k].ip)}>
                                    5m
                                </button>{" "}
                                <button onClick={this.ban.bind(this, "banChat", 30 * 60 * 1000, hasChat[k].ip)}>
                                    30m
                                </button>{" "}
                                <button onClick={this.ban.bind(this, "banChat", 24 * 60 * 60 * 1000, hasChat[k].ip)}>
                                    24h
                                </button>
                                <div class="red bold text-center">
                                    {hasBan?.[k]?.banChat
                                        ? `${Math.round((hasBan?.[k]?.banChat - Date.now()) / 100 / 60) / 10}m Left`
                                        : ""}
                                </div>
                            </td>
                            <td class="nowrap text-center">
                                <button onClick={this.ban.bind(this, "banTrade", 0, hasChat[k].ip)}>0m</button>{" "}
                                <button onClick={this.ban.bind(this, "banTrade", 5 * 60 * 1000, hasChat[k].ip)}>
                                    5m
                                </button>{" "}
                                <button onClick={this.ban.bind(this, "banTrade", 30 * 60 * 1000, hasChat[k].ip)}>
                                    30m
                                </button>{" "}
                                <button onClick={this.ban.bind(this, "banTrade", 24 * 60 * 60 * 1000, hasChat[k].ip)}>
                                    24h
                                </button>
                                <div class="red bold text-center">
                                    {hasBan?.[k]?.banTrade
                                        ? `${Math.round((hasBan?.[k]?.banTrade - Date.now()) / 100 / 60) / 10}m Left`
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
