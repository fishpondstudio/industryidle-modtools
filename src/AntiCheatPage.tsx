import { getUrlParams, nf } from "./Helper";
import { Page } from "./Page";
import { ResourceDialog } from "./ResourceDialog";
import { TradeDialog } from "./TradeDialog";
import { UserInfoDialog } from "./UserInfoDialog";

export class AntiCheatPage extends Page<{
    entries: any[];
    resources: any | null;
    highlightTime: number;
    userInfoId: string | null;
    tradeIp: string | null;
}> {
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
        const results: any = {};
        j.docs.forEach((doc: any) => {
            if (results[doc.userId]) {
                results[doc.userId].entries.push(doc);
                if (doc.createdAt > results[doc.userId].createdAt) {
                    results[doc.userId] = doc.createdAt;
                }
            } else {
                results[doc.userId] = { entries: [doc], createdAt: doc.createdAt };
            }
        });
        const entries = (Object.values(results) as any).sort((a: any, b: any) => {
            b.createdAt - a.createdAt;
        });
        this.setState({ entries });
    }

    render() {
        if (!this.state.entries) {
            return;
        }
        return (
            <>
                <ResourceDialog
                    entries={this.state.resources}
                    highlightTime={this.state.highlightTime}
                    onClose={() => this.setState({ resources: null })}
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
                    {this.state.entries.map((row: any) => {
                        return row.entries.map((entry: any, index: number) => {
                            const valuationBefore = entry.before.resourceValuation + entry.before.buildingValuation;
                            const valuationAfter = entry.after.resourceValuation + entry.after.buildingValuation;
                            const swissBefore = entry.before.prestigeCurrency;
                            const swissAfter = entry.after.prestigeCurrency;
                            const allTimeSwissBefore = entry.before.allPrestigeCurrency;
                            const allTimeSwissAfter = entry.after.allPrestigeCurrency;
                            const valuationDelta = (100 * (valuationAfter - valuationBefore)) / valuationBefore;
                            const userName =
                                index === 0 ? <a href={`#user?id=${entry.userId}`}>{entry.before.userName}</a> : null;
                            return (
                                <tr>
                                    <td>{userName}</td>
                                    <td>{nf(valuationBefore)}</td>
                                    <td>{nf(valuationAfter)}</td>
                                    <td class={valuationDelta >= 100 ? "red" : ""}>{Math.round(valuationDelta)}%</td>
                                    <td>{nf(swissBefore)}</td>
                                    <td>{nf(swissAfter)}</td>
                                    <td>{Math.round((100 * (swissAfter - swissBefore)) / swissBefore)}%</td>
                                    <td>{nf(allTimeSwissBefore)}</td>
                                    <td>{nf(allTimeSwissAfter)}</td>
                                    <td>
                                        {Math.round(
                                            (100 * (allTimeSwissAfter - allTimeSwissBefore)) / allTimeSwissBefore
                                        )}
                                        %
                                    </td>
                                    <td>{new Date(entry.createdAt).toLocaleString()}</td>
                                    <td>
                                        <button
                                            onClick={() => {
                                                this.setState({
                                                    resources: row.entries,
                                                    highlightTime: entry.createdAt,
                                                    userInfoId: null,
                                                    tradeIp: null,
                                                });
                                            }}
                                        >
                                            Diff
                                        </button>{" "}
                                        <button
                                            onClick={() => {
                                                this.setState({
                                                    resources: null,
                                                    highlightTime: 0,
                                                    userInfoId: entry.userId,
                                                    tradeIp: null,
                                                });
                                            }}
                                        >
                                            User
                                        </button>{" "}
                                        <button
                                            onClick={() => {
                                                this.setState({
                                                    resources: null,
                                                    highlightTime: 0,
                                                    userInfoId: null,
                                                    tradeIp: entry.ip,
                                                });
                                            }}
                                        >
                                            Trades
                                        </button>
                                    </td>
                                </tr>
                            );
                        });
                    })}
                </table>
            </>
        );
    }
}
