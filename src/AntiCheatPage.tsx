import { getUrlParams, nf } from "./Helper";
import { Page } from "./Page";

export class AntiCheatPage extends Page<{
    entries: any[];
    resources: any | null;
    highlightTime: number;
    userInfoId: string | null;
    tradeIp: string | null;
    toDelete: any[];
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
        const toDelete: any[] = [];
        j.docs.forEach((doc: any) => {
            if (results[doc.userId]) {
                results[doc.userId].entries.push(doc);
                if (doc.createdAt > results[doc.userId].createdAt) {
                    results[doc.userId] = doc.createdAt;
                }
            } else {
                results[doc.userId] = { entries: [doc], createdAt: doc.createdAt };
            }
            const before = doc.before.resourceValuation + doc.before.buildingValuation;
            const after = doc.after.resourceValuation + doc.after.buildingValuation;
            const delta = (after - before) / before;
            if (delta < 10) {
                toDelete.push({ _id: doc._id, _rev: doc._rev, _deleted: true });
            }
        });
        const entries = (Object.values(results) as any).sort((a: any, b: any) => {
            b.createdAt - a.createdAt;
        });
        this.setState({ entries, toDelete });
    }

    render() {
        if (!this.state.entries) {
            return;
        }
        return (
            <table className="mobile">
                <tr>
                    <th>
                        <button
                            onClick={async () => {
                                const r = await fetch(
                                    `https://couchdb-de.fishpondstudio.com/industryidle_anticheat/_bulk_docs?batch=ok`,
                                    {
                                        headers: {
                                            Authorization: `Basic ${btoa(getUrlParams()?.couchdb)}`,
                                            "Content-Type": "application/json",
                                        },
                                        method: "post",
                                        body: JSON.stringify({ docs: this.state.toDelete }),
                                    }
                                );
                                alert(`${r.status} ${r.statusText}`);
                            }}
                        >
                            Clean ({this.state.toDelete.length})
                        </button>
                    </th>
                    <th colSpan={3}>Valuation</th>
                    <th colSpan={3}>All Time Swiss</th>
                    <th>Created At</th>
                </tr>
                {this.state.entries.map((row: any) => {
                    return row.entries.map((entry: any, index: number) => {
                        const valuationBefore = entry.before.resourceValuation + entry.before.buildingValuation;
                        const valuationAfter = entry.after.resourceValuation + entry.after.buildingValuation;
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
                                <td class={valuationDelta >= 1000 ? "red" : ""}>{nf(valuationDelta, 0)}%</td>
                                <td>{nf(allTimeSwissBefore)}</td>
                                <td>{nf(allTimeSwissAfter)}</td>
                                <td>
                                    {Math.round((100 * (allTimeSwissAfter - allTimeSwissBefore)) / allTimeSwissBefore)}%
                                </td>
                                <td>{new Date(entry.createdAt).toLocaleString()}</td>
                            </tr>
                        );
                    });
                })}
            </table>
        );
    }
}
