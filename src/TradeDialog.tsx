import { Component } from "preact";
import { getUrlParams, nf } from "./Helper";

interface TradeDialogProps {
    ip: string | null;
}

export class TradeDialog extends Component<TradeDialogProps, { trades: any[] | null }> {
    override async componentDidUpdate(prevProps: TradeDialogProps) {
        if (this.props.ip === prevProps.ip || this.props.ip === null) {
            return;
        }
        const r = await Promise.all([
            fetch(`https://couchdb-de.fishpondstudio.com/industryidle_tradelog/_find`, {
                headers: {
                    Authorization: `Basic ${btoa(getUrlParams()?.couchdb)}`,
                    "Content-Type": "application/json",
                },
                method: "post",
                body: JSON.stringify({
                    selector: {
                        fillIp: this.props.ip,
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
                        fromIp: this.props.ip,
                    },
                    limit: 999,
                }),
            }),
        ]);
        const [j1, j2] = await Promise.all(r.map((r) => r.json()));
        this.setState({
            trades: j1.docs.concat(j2.docs).sort((a: any, b: any) => {
                return b.closedAt - a.closedAt;
            }),
        });
    }
    override render() {
        if (!this.state.trades) {
            return null;
        }
        const toolbar = (
            <button
                onClick={() => {
                    this.props.ip = null;
                    this.setState({ trades: null });
                }}
            >
                Close
            </button>
        );
        return (
            <dialog open>
                {toolbar}
                <table class="mb10 mt10">
                    <tr>
                        <th>Side</th>
                        <th>Resource</th>
                        <th>Price</th>
                        <th>Amount</th>
                        <th>Value</th>
                        <th>From</th>
                        <th>Fill By</th>
                        <th>Status</th>
                        <th>Closed At</th>
                    </tr>
                    {this.state.trades.map((trade) => {
                        return (
                            <tr>
                                <td class={trade.side === "buy" ? "green bold" : "red bold"}>
                                    {trade.side.toUpperCase()}
                                </td>
                                <td>{trade.resource}</td>
                                <td>{nf(trade.price)}</td>
                                <td>{nf(trade.amount)}</td>
                                <td>{nf(trade.price * trade.amount)}</td>
                                <td class={trade.fromIp === this.props.ip ? "red" : ""}>
                                    {trade.from}
                                    <br />
                                    <code>{trade.fromIp}</code>
                                </td>
                                <td class={trade.fillIp === this.props.ip ? "red" : ""}>
                                    {trade.fillBy}
                                    <br />
                                    <code>{trade.fillIp}</code>
                                </td>
                                <td>{trade.status}</td>
                                <td>{new Date(trade.closedAt).toLocaleString()}</td>
                            </tr>
                        );
                    })}
                </table>
                {toolbar}
            </dialog>
        );
    }
}
