import { Component } from "preact";
import { getUrlParams, nf } from "./Helper";
import { ResourceDialog } from "./ResourceDialog";
import { TradeDialog } from "./TradeDialog";
import { UserInfoDialog } from "./UserInfoDialog";

export class AntiCheatPage extends Component<
    {},
    { entires: any[]; selectedIndex: number; userInfoId: string | null; tradeIp: string | null }
> {
    constructor() {
        super();
        this.loadData();
    }

    async loadData() {
        const r = await fetch(`https://couchdb-de.fishpondstudio.com/industryidle_anticheat/_find`, {
            headers: {
                Authorization: `Basic ${btoa(getUrlParams()?.couchdb)}`,
                "Content-Type": "application/json",
            },
            method: "post",
            body: JSON.stringify({
                selector: {},
                sort: [{ createdAt: "desc" }],
                limit: 999,
            }),
        });
        const j = await r.json();
        this.setState({
            entires: j.docs.sort((a: any, b: any) => {
                const userId = a.userId.localeCompare(b.userId);
                if (userId !== 0) {
                    return userId;
                }
                return b.createdAt - a.createdAt;
            }),
        });
    }

    render() {
        if (!this.state.entires) {
            return;
        }
        return (
            <>
                <ResourceDialog
                    entry={this.state.entires[this.state.selectedIndex]}
                    onClose={() => this.setState({ selectedIndex: -1 })}
                />
                <UserInfoDialog userId={this.state.userInfoId}></UserInfoDialog>
                <TradeDialog ip={this.state.tradeIp} />
                <table>
                    <tr>
                        <th>Name</th>
                        <th colSpan={3}>Valuation</th>
                        <th colSpan={3}>Swiss</th>
                        <th colSpan={3}>All Time Swiss</th>
                        <th>Created At</th>
                        <th></th>
                    </tr>
                    {this.state.entires.map((entry: any, index) => {
                        const valuationBefore = entry.before.resourceValuation + entry.before.buildingValuation;
                        const valuationAfter = entry.after.resourceValuation + entry.after.buildingValuation;
                        const swissBefore = entry.before.prestigeCurrency;
                        const swissAfter = entry.after.prestigeCurrency;
                        const allTimeSwissBefore = entry.before.allPrestigeCurrency;
                        const allTimeSwissAfter = entry.after.allPrestigeCurrency;
                        const valuationDelta = (100 * (valuationAfter - valuationBefore)) / valuationBefore;
                        return (
                            <tr>
                                <td>{entry.before.userName}</td>
                                <td>{nf(valuationBefore)}</td>
                                <td>{nf(valuationAfter)}</td>
                                <td class={valuationDelta >= 100 ? "red" : ""}>{Math.round(valuationDelta)}%</td>
                                <td>{nf(swissBefore)}</td>
                                <td>{nf(swissAfter)}</td>
                                <td>{Math.round((100 * (swissAfter - swissBefore)) / swissBefore)}%</td>
                                <td>{nf(allTimeSwissBefore)}</td>
                                <td>{nf(allTimeSwissAfter)}</td>
                                <td>
                                    {Math.round((100 * (allTimeSwissAfter - allTimeSwissBefore)) / allTimeSwissBefore)}%
                                </td>
                                <td>{new Date(entry.createdAt).toLocaleString()}</td>
                                <td>
                                    <button
                                        onClick={() => {
                                            this.setState({ selectedIndex: index, userInfoId: null, tradeIp: null });
                                        }}
                                    >
                                        Diff
                                    </button>{" "}
                                    <button
                                        onClick={() => {
                                            this.setState({
                                                selectedIndex: -1,
                                                userInfoId: entry.userId,
                                                tradeIp: null,
                                            });
                                        }}
                                    >
                                        User
                                    </button>{" "}
                                    <button
                                        onClick={() => {
                                            this.setState({ selectedIndex: -1, userInfoId: null, tradeIp: entry.ip });
                                        }}
                                    >
                                        Trades
                                    </button>
                                </td>
                            </tr>
                        );
                    })}
                </table>
            </>
        );
    }
}
