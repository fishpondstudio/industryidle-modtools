import { Component } from "preact";
import { API_HOST } from "./Constants";
import { getUrlParams, nf } from "./Helper";

export class AntiCheatPage extends Component<{}, { entires: any; entry: any }> {
    private dialog: HTMLDialogElement | null = null;

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
        let dialogContent = null;
        if (this.state.entry) {
            const toolbar = (
                <div>
                    <button
                        onClick={async () => {
                            const r = await fetch(
                                `${API_HOST}/opt-out?token=${getUrlParams()?.token}&userId=${this.state.entry.userId}`
                            );
                            this.dialog?.close();
                            alert(`${r.status} ${r.statusText}`);
                        }}
                        disabled={this.state.entry.after.optOut}
                    >
                        Opt Out
                    </button>{" "}
                    <button
                        onClick={async () => {
                            navigator.clipboard.writeText(this.state.entry.platformId);
                        }}
                    >
                        {this.state.entry.platformId.toUpperCase()}
                    </button>{" "}
                    <button onClick={() => this.dialog?.close()}>Close</button>
                </div>
            );
            dialogContent = (
                <>
                    {toolbar}
                    <table class="mb10 mt10">
                        <tr>
                            <th>Resource</th>
                            <th>Amount (Before)</th>
                            <th>Amount (After)</th>
                            <th>Amount (%)</th>
                        </tr>
                        {Object.keys(this.state.entry.after.res).map((k) => {
                            const delta =
                                (100 * (this.state.entry.after.res[k] - this.state.entry.before.res[k])) /
                                this.state.entry.before.res[k];
                            return (
                                <tr>
                                    <td>{k}</td>
                                    <td>
                                        {nf(this.state.entry.before.res[k] ?? 0)}
                                        <br />
                                        <code>{this.state.entry.before.res[k]}</code>
                                    </td>
                                    <td>
                                        {nf(this.state.entry.after.res[k])}
                                        <br />
                                        <code>{this.state.entry.after.res[k]}</code>
                                    </td>
                                    <td class={Math.abs(delta) > 10 ? "red" : ""}>{Math.round(delta)}%</td>
                                </tr>
                            );
                        })}
                    </table>
                    {toolbar}
                </>
            );
        }
        return (
            <>
                <dialog ref={(ref) => (this.dialog = ref)}>{dialogContent}</dialog>
                <table>
                    <tr>
                        <th>Name</th>
                        <th colSpan={3}>Valuation</th>
                        <th colSpan={3}>Swiss</th>
                        <th colSpan={3}>All Time Swiss</th>
                        <th>Created At</th>
                    </tr>
                    {Object.keys(this.state.entires).map((k) => {
                        const entry = this.state.entires[k];
                        const valuationBefore = entry.before.resourceValuation + entry.before.buildingValuation;
                        const valuationAfter = entry.after.resourceValuation + entry.after.buildingValuation;
                        const swissBefore = entry.before.prestigeCurrency;
                        const swissAfter = entry.after.prestigeCurrency;
                        const allTimeSwissBefore = entry.before.allPrestigeCurrency;
                        const allTimeSwissAfter = entry.after.allPrestigeCurrency;
                        const valuationDelta = (100 * (valuationAfter - valuationBefore)) / valuationBefore;
                        return (
                            <tr>
                                <td
                                    onClick={() => {
                                        this.setState({ entry });
                                        this.dialog?.showModal();
                                    }}
                                    class="pointer"
                                >
                                    {entry.before.userName}
                                </td>
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
                            </tr>
                        );
                    })}
                </table>
            </>
        );
    }
}
